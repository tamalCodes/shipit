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
  todo: "bg-zinc-100 text-zinc-600",
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
              Tap Add task or drag one down when itâ€™s ready.
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
                <th className="px-5 py-3 font-medium text-zinc-500 md:w-1/2">
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
        className="space-y-4 bg-transparent md:hidden"
        onDragOver={handleDragOver}
        onDrop={handleDropOnContainer}
      >
        {tasks.map((task, index) => (
          <div
            key={task.id}
            draggable
            onDragStart={(event) => handleDragStart(event, task.id, index)}
            onDragOver={handleDragOver}
            onDrop={(event) => handleDropOnRow(event, index)}
            onDragEnd={handleDragEnd}
            onClick={(event) => handleTaskActivate(event, task)}
            className={cn(
              "rounded-2xl border border-zinc-200 bg-white/90 p-4 transition",
              draggingTaskId === task.id
                ? "ring-2 ring-zinc-300"
                : "hover:border-zinc-300 cursor-grab active:cursor-grabbing"
            )}
          >
            <div className="flex items-start gap-3">
              <RiDraggable
                className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-zinc-900">
                {task.title}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-xs text-zinc-500">{task.focusWindow}</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  statusAccent[task.status]
                }`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>

            {showAssignee ? (
              <p className="mt-2 text-xs font-medium text-zinc-600">
                {task.assignedTo ?? "Unassigned"}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
