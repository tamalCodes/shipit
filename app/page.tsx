import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

import TasksView from "@/components/tasks/TasksView";
import type { TaskBoardGroup } from "@/components/tasks/types";
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
    description: "Finish what's on your plate before pulling new work.",
  },
  up_next: {
    title: "Next Up",
    description: "Keep them visible but stay focused.",
  },
};

const allowedStatuses: TaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
];

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
    .sort({ groupKey: 1, position: 1, createdAt: 1 })
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

    const status = allowedStatuses.includes(task.status) ? task.status : "todo";

    grouped[task.groupKey].push({
      id: task._id.toHexString(),
      title: task.title,
      status,
      focusWindow: task.focusWindow,
      assignedTo: task.assignedTo ?? null,
      position:
        typeof task.position === "number"
          ? task.position
          : grouped[task.groupKey].length,
    });
  }

  return (["today", "up_next"] as const).map((key) => ({
    key,
    title: GROUP_META[key].title,
    description: GROUP_META[key].description,
    tasks: grouped[key].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }));
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;
  const payload = token ? verifyAuthToken(token) : null;

  const showAssignee =
    payload?.email && !isGenericEmail(payload.email.trim().toLowerCase());

  const taskGroups = await loadTaskGroups(payload?.sub);

  return (
    <main className="min-h-screen bg-zinc-100 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6">
        <TasksView
          initialGroups={taskGroups}
          showAssignee={Boolean(showAssignee)}
        />
      </div>
    </main>
  );
}
