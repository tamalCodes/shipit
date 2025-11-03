import { cookies } from "next/headers";

import TaskBoard, {
  type TaskBoardGroup,
} from "@/components/tasks/TaskBoard";
import { verifyAuthToken } from "@/lib/auth-server";
import { isGenericEmail } from "@/lib/email";

const demoTaskGroups: TaskBoardGroup[] = [
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

      <TaskBoard
        initialGroups={demoTaskGroups}
        showAssignee={Boolean(showAssignee)}
      />
    </div>
  );
}
