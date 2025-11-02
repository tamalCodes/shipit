import { cookies } from "next/headers";

import TaskTable from "@/components/tasks/TaskTable";
import { verifyAuthToken } from "@/lib/auth-server";
import { isGenericEmail } from "@/lib/email";
import { type TaskStatus } from "@/lib/schemas/task";

type DemoTask = {
  title: string;
  status: TaskStatus;
  focusWindow: string;
  assignedTo?: string | null;
};

type TaskGroup = {
  key: "today" | "up_next";
  title: string;
  description: string;
  tasks: DemoTask[];
};

const demoTaskGroups: TaskGroup[] = [
  {
    key: "today",
    title: "Today",
    description: "Finish what’s on your plate before pulling new work.",
    tasks: [
      {
        title: "Publish weekly release notes",
        status: "review",
        focusWindow: "Today · 10:00 - 11:00",
        assignedTo: "maya@shipitstudio.com",
      },
      {
        title: "Refine dashboard KPI tiles",
        status: "in_progress",
        focusWindow: "Today · Design deep work block",
        assignedTo: "luca@shipitstudio.com",
      },
      {
        title: "Answer security questionnaire",
        status: "todo",
        focusWindow: "Today · Afternoon wrap-up",
        assignedTo: "you@shipitstudio.com",
      },
    ],
  },
  {
    key: "up_next",
    title: "Next up",
    description:
      "Queued once today is complete. Keep them visible but stay focused.",
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
        focusWindow: "This week · Strategy sync",
        assignedTo: null,
      },
    ],
  },
];

export default async function TasksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;
  const payload = token ? verifyAuthToken(token) : null;

  const showAssignee =
    payload?.email && !isGenericEmail(payload.email.trim().toLowerCase());

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

      <section className="space-y-8">
        {demoTaskGroups.map((group) => (
          <div key={group.key} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {group.title}
              </h3>
              <p className="text-sm text-zinc-500">{group.description}</p>
            </div>

            <div className="overflow-hidden rounded-2xl md:border md:border-zinc-200 md:bg-white md:shadow-sm">
              <TaskTable
                initialTasks={group.tasks}
                showAssignee={Boolean(showAssignee)}
              />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
