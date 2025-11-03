import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import TaskBoard, { type TaskBoardGroup } from "@/components/tasks/TaskBoard";
import { verifyAuthToken } from "@/lib/auth-server";
import { getTasksCollection } from "@/lib/db";
import { isGenericEmail } from "@/lib/email";
import type { TaskDocument } from "@/lib/schemas/task";

const GROUP_META: Record<
  TaskBoardGroup["key"],
  { title: string; description: string }
> = {
  today: {
    title: "Today",
    description: "Finish what&apos;s on your plate before pulling new work.",
  },
  up_next: {
    title: "Next up",
    description:
      "Queued once today is complete. Keep them visible but stay focused.",
  },
};

const demoTaskGroups: TaskBoardGroup[] = [
  {
    key: "today",
    title: GROUP_META.today.title,
    description: GROUP_META.today.description,
    tasks: [
      {
        title: "Publish weekly release notes",
        status: "review",
        focusWindow: "Today 10:00-11:00",
        assignedTo: "maya@shipitstudio.com",
      },
      {
        title: "Refine dashboard KPI tiles",
        status: "in_progress",
        focusWindow: "Today design deep work block",
        assignedTo: "luca@shipitstudio.com",
      },
      {
        title: "Answer security questionnaire",
        status: "todo",
        focusWindow: "Today afternoon wrap-up",
        assignedTo: "you@shipitstudio.com",
      },
    ],
  },
  {
    key: "up_next",
    title: GROUP_META.up_next.title,
    description: GROUP_META.up_next.description,
    tasks: [
      {
        title: "Prototype task automations",
        status: "todo",
        focusWindow: "Next 3 days",
        assignedTo: "amelia@shipitstudio.com",
      },
      {
        title: "Audit onboarding email series",
        status: "blocked",
        focusWindow: "Waiting on legal handoff",
        assignedTo: "support@shipitstudio.com",
      },
      {
        title: "Prep Q2 roadmap briefing",
        status: "todo",
        focusWindow: "This week strategy sync",
        assignedTo: null,
      },
    ],
  },
];

async function loadTaskGroups(
  workspaceId: string | undefined
): Promise<TaskBoardGroup[]> {
  if (!workspaceId) {
    return demoTaskGroups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({ ...task })),
    }));
  }

  let parsedWorkspaceId: ObjectId;
  try {
    parsedWorkspaceId = new ObjectId(workspaceId);
  } catch {
    return demoTaskGroups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({ ...task })),
    }));
  }

  const tasksCollection = await getTasksCollection<TaskDocument>();
  const tasks = await tasksCollection
    .find({ workspaceId: parsedWorkspaceId })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  if (tasks.length === 0) {
    return demoTaskGroups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({ ...task })),
    }));
  }

  const grouped: Record<TaskBoardGroup["key"], TaskBoardGroup["tasks"]> = {
    today: [],
    up_next: [],
  };

  for (const task of tasks) {
    if (task.groupKey !== "today" && task.groupKey !== "up_next") {
      continue;
    }

    grouped[task.groupKey].push({
      id: task._id.toHexString(),
      title: task.title,
      status: task.status,
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
          Ship what&apos;s already in motion first. Reorder tasks as priorities shift
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
