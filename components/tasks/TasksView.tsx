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
      <section className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-[35px] md:text-2xl font-semibold tracking-tight text-zinc-900">
            Your Tasks
          </h2>
          <button
            type="button"
            onClick={handleAddTask}
            className="flex items-center justify-center gap-2 md:rounded-lg rounded-[10px] bg-zinc-900 px-3 md:px-4 py-3 md:py-2 text-sm  font-semibold text-white md:w-auto w-12 md:h-auto h-12 transition cursor-pointer  "
          >
            <FiPlus className="md:h-4 w-6 md:w-4 h-6" aria-hidden="true" />
            <span className="hidden md:flex">Add Task</span>
          </button>
        </div>
        <p className="max-w-2xl hidden md:block text-sm leading-6 text-zinc-600">
          Ship what&apos;s already in motion first. Reorder tasks as priorities
          shift.
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
