import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import TaskBoard, { type TaskBoardGroup } from "@/components/tasks/TaskBoard";
import { verifyAuthToken } from "@/lib/auth-server";
import { getTasksCollection } from "@/lib/db";
import { isGenericEmail } from "@/lib/email";
import type { TaskDocument, TaskStatus } from "@/lib/schemas/task";

const GROUP_META: Record<
  TaskBoardGroup["key"],
  { title: string; description: string }
> = {
  today: {
    title: "Today",
    description: "Finish what’s on your plate before pulling new work.",
  },
  up_next: {
    title: "Next up",
    description:
      "Queued once today is complete. Keep them visible but stay focused.",
  },
};

const allowedStatuses: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

const EMPTY_GROUPS: TaskBoardGroup[] = (["today", "up_next"] as const).map(
  (key) => ({
    key,
    title: GROUP_META[key].title,
    description: GROUP_META[key].description,
    tasks: [],
  })
);

async function loadTaskGroups(
  workspaceId: string | undefined
): Promise<TaskBoardGroup[]> {
  if (!workspaceId) {
    return EMPTY_GROUPS;
  }

  let parsedWorkspaceId: ObjectId;
  try {
    parsedWorkspaceId = new ObjectId(workspaceId);
  } catch {
    return EMPTY_GROUPS;
  }

  const tasksCollection = await getTasksCollection<TaskDocument>();
  const tasks = await tasksCollection
    .find({ workspaceId: parsedWorkspaceId })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  if (tasks.length === 0) {
    return EMPTY_GROUPS;
  }

  const grouped: Record<TaskBoardGroup["key"], TaskBoardGroup["tasks"]> = {
    today: [],
    up_next: [],
  };

  for (const task of tasks) {
    if (task.groupKey !== "today" && task.groupKey !== "up_next") {
      continue;
    }

    const status = allowedStatuses.includes(task.status)
      ? task.status
      : "todo";

    grouped[task.groupKey].push({
      id: task._id.toHexString(),
      title: task.title,
      status,
      focusWindow: task.focusWindow,
      assignedTo: task.assignedTo ?? null,
    });
  }

  return (["today", "up_next"] as const).map((key) => ({
    key,
    title: GROUP_META[key].title,
    description: GROUP_META[key].description,
    tasks: grouped[key],
  }));
}

export default async function TasksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;
  const payload = token ? verifyAuthToken(token) : null;

  const showAssignee =
    payload?.email && !isGenericEmail(payload.email.trim().toLowerCase());

  const taskGroups = await loadTaskGroups(payload?.sub);

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Daily focus
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          Ship what’s already in motion first. Reorder tasks as priorities shift
          so the team always knows what to execute next.
        </p>
      </section>

      <TaskBoard
        initialGroups={taskGroups}
        showAssignee={Boolean(showAssignee)}
      />
    </div>
  );
}
