/* eslint-disable @typescript-eslint/no-explicit-any */
/*
  A light-weight drag and drop table used for prioritising tasks.
  Reorders items locally so users can focus on what comes next.
*/
"use client";

import type {
  TaskBoardGroup,
  TaskModel,
  TaskTableDropAction,
} from "@/components/tasks/types";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/schemas/task";
import { cn } from "@/lib/utils";
import type { DragEvent, MouseEvent } from "react";
import { useCallback } from "react";
import { RiDraggable } from "react-icons/ri";

type TaskTableProps = {
  groupKey: TaskBoardGroup["key"];
  tasks: TaskModel[];
  showAssignee: boolean;
  draggingTaskId: string | null;
  onDragStart: (taskId: string, index: number) => void;
  onDragEnd: () => void;
  onTaskDrop: (action: TaskTableDropAction) => void;
  onTaskOpen: (task: TaskModel) => void;
};

const statusAccent: Record<TaskStatus, string> = {
  todo: "bg-zinc-100 text-zinc-600 ",
  in_progress: "bg-blue-50 text-blue-600",
  blocked: "bg-rose-50 text-rose-600",
  done: "bg-emerald-50 text-emerald-600",
};

type DragEventElement =
  | HTMLTableRowElement
  | HTMLDivElement
  | HTMLTableSectionElement;
type DragEventTarget = DragEvent<DragEventElement>;

function readDragData(event: DragEventTarget) {
  try {
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return null;
    return JSON.parse(raw) as Omit<
      TaskTableDropAction,
      "targetGroupKey" | "targetIndex"
    >;
  } catch {
    return null;
  }
}

export default function TaskTable({
  groupKey,
  tasks,
  showAssignee,
  draggingTaskId,
  onDragStart,
  onDragEnd,
  onTaskDrop,
  onTaskOpen,
}: TaskTableProps) {
  const handleDragStart = useCallback(
    (event: DragEventTarget, taskId: string, index: number) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          taskId,
          sourceGroupKey: groupKey,
          sourceIndex: index,
        })
      );
      onDragStart(taskId, index);
    },
    [groupKey, onDragStart]
  );

  const handleDragOver = useCallback((event: DragEventTarget) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropOnRow = useCallback(
    (event: DragEventTarget, targetIndex: number) => {
      event.preventDefault();
      event.stopPropagation();
      const payload = readDragData(event);
      if (!payload) return;

      onTaskDrop({
        ...payload,
        targetGroupKey: groupKey,
        targetIndex,
      });
      onDragEnd();
    },
    [groupKey, onDragEnd, onTaskDrop]
  );

  const handleDropOnContainer = useCallback(
    (event: DragEventTarget) => {
      event.preventDefault();
      const payload = readDragData(event);
      if (!payload) return;

      onTaskDrop({
        ...payload,
        targetGroupKey: groupKey,
        targetIndex: tasks.length,
      });
      onDragEnd();
    },
    [groupKey, onDragEnd, onTaskDrop, tasks.length]
  );

  const handleTaskActivate = useCallback(
    (
      event: MouseEvent<HTMLTableRowElement | HTMLDivElement>,
      task: TaskModel
    ) => {
      event.preventDefault();
      if (draggingTaskId) {
        return;
      }
      onTaskOpen(task);
    },
    [draggingTaskId, onTaskOpen]
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  if (tasks.length === 0) {
    return (
      <>
        <div
          className="hidden min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center text-sm text-zinc-500 md:flex"
          onDragOver={handleDragOver}
          onDrop={handleDropOnContainer}
        >
          <div className="space-y-2">
            <p className="font-medium text-zinc-600">
              All clear! Nothing is queued here.
            </p>
            <p className="text-xs text-zinc-400">
              Drag a task into this lane or use Add task to create a new one.
            </p>
          </div>
        </div>

        <div
          className="flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-5 py-8 text-center text-sm text-zinc-500 md:hidden"
          onDragOver={handleDragOver}
          onDrop={handleDropOnContainer}
        >
          <div className="space-y-2">
            <p className="font-medium text-zinc-600">
              No tasks in this lane yet.
            </p>
            <p className="text-xs text-zinc-400">
              Add a task or drag one up when it&apos;s time.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
                <th className=" px-5 py-3 font-medium text-zinc-500 md:w-1/2">
                  Task
                </th>
                <th className="px-5 py-3 font-medium text-zinc-500 md:w-1/3">
                  Focus window
                </th>
                <th className="px-5 py-3 font-medium text-zinc-500 md:w-36">
                  Status
                </th>
                {showAssignee ? (
                  <th className="px-5 py-3 font-medium text-zinc-500 md:w-48">
                    Assigned to
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody onDragOver={handleDragOver} onDrop={handleDropOnContainer}>
              {tasks.map((task, index) => (
                <tr
                  key={task.id}
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(event, task.id, index)
                  }
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDropOnRow(event, index)}
                  onDragEnd={handleDragEnd}
                  onClick={(event) => handleTaskActivate(event, task)}
                  className={cn(
                    "border-b border-zinc-100 last:border-b-0",
                    draggingTaskId === task.id
                      ? "bg-zinc-100"
                      : "hover:bg-zinc-50 cursor-grab active:cursor-grabbing"
                  )}
                >
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <RiDraggable
                        className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-300"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {task.title}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-zinc-600">
                    {task.focusWindow}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        statusAccent[task.status]
                      }`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </td>
                  {showAssignee ? (
                    <td className="px-5 py-4 align-top text-sm font-medium text-zinc-700">
                      {task.assignedTo ?? "Unassigned"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="space-y-3 bg-transparent md:hidden"
        onDragOver={handleDragOver}
        onDrop={handleDropOnContainer}
      >
        {[...tasks]
          .sort((a, b) => b.position - a.position) // reverse by position
          .map((task, index) => {
            console.log("🚀 ~ TaskTable ~ task:", task);
            const isDone = task.status === "done";

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(event) => handleDragStart(event, task.id, index)}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDropOnRow(event, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center justify-between rounded-xl px-1 py-2 text-sm",
                  draggingTaskId === task.id
                    ? "bg-zinc-100"
                    : "hover:bg-zinc-50 cursor-grab active:cursor-grabbing"
                )}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    // hook this up to your "mark done" logic
                    onTaskOpen(task);
                  }}
                  className={cn(
                    "mr-3 flex h-5 w-5 items-center justify-center rounded border text-[10px]",
                    isDone
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-zinc-600 bg-transparent"
                  )}
                >
                  {isDone ? "✓" : null}
                </button>

                {/* Title + pill */}
                <button
                  type="button"
                  onClick={(event) => handleTaskActivate(event as any, task)}
                  className="flex flex-1 items-center gap-2 text-left justify-between"
                >
                  <span
                    className={cn(
                      "truncate text-[18px] font-medium",
                      isDone ? "line-through text-zinc-400" : "text-zinc-600"
                    )}
                  >
                    {task.title}
                  </span>

                  <span
                    className={cn(
                      "ml-2 shrink-0 rounded-md px-3 py-1 text-[15px] font-medium",
                      task.focusWindow === "Today"
                        ? "bg-rose-100 text-rose-600 ring-rose-300 ring"
                        : "bg-amber-50 text-amber-600 ring-amber-300 ring"
                    )}
                  >
                    {task.focusWindow}
                  </span>
                </button>
              </div>
            );
          })}
      </div>
    </>
  );
}
