"use client";

import TaskBoard, { type TaskBoardHandle } from "@/components/tasks/TaskBoard";
import type { TaskBoardGroup } from "@/components/tasks/types";
import star from "@/public/star.svg";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";

type TasksViewProps = {
  initialGroups: TaskBoardGroup[];
  showAssignee: boolean;
};

const getGreetingForHour = (hour: number) => {
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  }
  return "Good Evening";
};

export default function TasksView({
  initialGroups,
  showAssignee,
}: TasksViewProps) {
  const boardRef = useRef<TaskBoardHandle | null>(null);
  const [greeting, setGreeting] = useState("Good Evening");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateGreeting = () => {
      setGreeting(getGreetingForHour(new Date().getHours()));
    };

    const timeoutId = window.setTimeout(updateGreeting, 0);
    const intervalId = window.setInterval(updateGreeting, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const handleAddTask = () => {
    boardRef.current?.openCreateTask("today");
  };

  return (
    <div className="space-y-10 h-[90dvh] overflow-hidden   relative">
      <div className="w-full flex items-center justify-between">
        <section className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-3 text-[35px] md:text-2xl font-semibold tracking-tight text-zinc-900 ">
              {greeting}, Tamal{" "}
              <Image src={star} alt="" className="w-10 h-10" />
            </h2>
          </div>
          <p className="max-w-2xl inline text-sm leading-6 text-zinc-600">
            Ship what&apos;s already in motion first. Reorder tasks as
            priorities shift.
          </p>
        </section>

        <button
          type="button"
          onClick={handleAddTask}
          className="md:flex hidden w-full items-center justify-center gap-2 md:rounded-lg rounded-[10px] bg-zinc-900 px-3 md:px-4 py-3 md:py-2 text-md  font-semibold text-white md:w-auto  md:h-auto h-12 transition cursor-pointer "
        >
          <FiPlus className="md:h-4 w-6 md:w-4 h-6" aria-hidden="true" />
          <span className="flex">Add a Task</span>
        </button>
      </div>

      <TaskBoard
        ref={boardRef}
        initialGroups={initialGroups}
        showAssignee={showAssignee}
        showAddButton={false}
      />

      <button
        type="button"
        onClick={handleAddTask}
        className="absolute bottom-0 w-full md:hidden flex items-center justify-center gap-2 md:rounded-lg rounded-[10px] bg-zinc-900 px-3 md:px-4 py-3 md:py-2 text-md  font-semibold text-white md:w-auto  md:h-auto h-12 transition cursor-pointer  "
      >
        <FiPlus className="md:h-4 w-6 md:w-4 h-6" aria-hidden="true" />
        <span className="flex">Add a Task</span>
      </button>
    </div>
  );
}
