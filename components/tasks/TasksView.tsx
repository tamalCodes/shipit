"use client";

import { useRef } from "react";
import { FiPlus } from "react-icons/fi";

import TaskBoard, { type TaskBoardHandle } from "@/components/tasks/TaskBoard";
import type { TaskBoardGroup } from "@/components/tasks/types";

type TasksViewProps = {
  initialGroups: TaskBoardGroup[];
  showAssignee: boolean;
};

export default function TasksView({
  initialGroups,
  showAssignee,
}: TasksViewProps) {
  const boardRef = useRef<TaskBoardHandle | null>(null);

  const handleAddTask = () => {
    boardRef.current?.openCreateTask("today");
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">
            Daily focus
          </h2>
          <button
            type="button"
            onClick={handleAddTask}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            <FiPlus className="h-4 w-4" aria-hidden="true" />
            Add task
          </button>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          Ship what&apos;s already in motion first. Reorder tasks as priorities
          shift so the team always knows what to execute next.
        </p>
      </section>

      <TaskBoard
        ref={boardRef}
        initialGroups={initialGroups}
        showAssignee={showAssignee}
        showAddButton={false}
      />
    </div>
  );
}
