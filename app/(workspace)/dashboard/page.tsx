const metrics = [
  {
    label: "Active projects",
    value: "12",
    change: "+3 this month",
  },
  {
    label: "Tasks completed",
    value: "248",
    change: "+18% vs last week",
  },
  {
    label: "Upcoming reviews",
    value: "4",
    change: "Next deadline in 2 days",
  },
  {
    label: "Team capacity",
    value: "76%",
    change: "Balanced workload",
  },
];

const updates = [
  {
    title: "Design system refresh",
    description: "Typography, spacing, and semantic token updates are live.",
    time: "2h ago",
  },
  {
    title: "Mobile onboarding",
    description: "QA sign-off complete. Ready for phased rollout tomorrow.",
    time: "Yesterday",
  },
  {
    title: "Billing integration",
    description: "Stripe webhook retries configured and tested in staging.",
    time: "2 days ago",
  },
];

const roadmap = [
  {
    quarter: "Q1",
    focus: "Lifecycle automations",
    state: "In progress",
  },
  {
    quarter: "Q2",
    focus: "Insights dashboards",
    state: "Planned",
  },
  {
    quarter: "Q3",
    focus: "AI-powered assistance",
    state: "Exploring",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Morning, product team
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Keep shipping with clarity. Your key metrics, upcoming reviews, and
            roadmap highlights stay in one focused view.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                {metric.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-zinc-900">
                {metric.value}
              </p>
              <p className="mt-2 text-xs font-medium text-emerald-600">
                {metric.change}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <header className="border-b border-zinc-200 p-5">
            <h3 className="text-base font-semibold text-zinc-900">
              Recent updates
            </h3>
            <p className="text-sm text-zinc-500">
              Progress highlights shared by the team this week.
            </p>
          </header>
          <ul className="divide-y divide-zinc-100">
            {updates.map((update) => (
              <li key={update.title} className="p-5">
                <p className="text-sm font-semibold text-zinc-900">
                  {update.title}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {update.description}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-400">
                  {update.time}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <header className="border-b border-zinc-200 p-5">
            <h3 className="text-base font-semibold text-zinc-900">
              Roadmap focus
            </h3>
            <p className="text-sm text-zinc-500">
              High-level priorities aligned across the quarter.
            </p>
          </header>
          <ul className="divide-y divide-zinc-100">
            {roadmap.map((item) => (
              <li key={item.quarter} className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    {item.quarter}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {item.focus}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  {item.state}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
