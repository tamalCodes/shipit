/*
  A light-weight drag and drop table used for prioritising tasks.
  Reorders items locally so users can focus on what comes next.
*/
"use client";

import { useCallback } from "react";
import type { DragEvent } from "react";

import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/schemas/task";
import { cn } from "@/lib/utils";
import { RiDraggable } from "react-icons/ri";

export type TaskTableTask = {
  id: string;
  title: string;
  status: TaskStatus;
  focusWindow: string;
  assignedTo?: string | null;
};

export type TaskTableDropAction = {
  taskId: string;
  sourceGroupKey: string;
  sourceIndex: number;
  targetGroupKey: string;
  targetIndex: number;
};

type TaskTableProps = {
  groupKey: string;
  tasks: TaskTableTask[];
  showAssignee: boolean;
  draggingTaskId: string | null;
  onDragStart: (taskId: string, index: number) => void;
  onDragEnd: () => void;
  onTaskDrop: (action: TaskTableDropAction) => void;
};

const statusAccent: Record<TaskStatus, string> = {
  todo: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-blue-50 text-blue-600",
  review: "bg-emerald-50 text-emerald-600",
  blocked: "bg-rose-50 text-rose-600",
  done: "bg-indigo-50 text-indigo-600",
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
    return JSON.parse(raw) as Omit<TaskTableDropAction, "targetGroupKey" | "targetIndex">;
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
}: TaskTableProps) {
  const handleDragStart = useCallback(
    (
      event: DragEventTarget,
      taskId: string,
      index: number
    ) => {
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

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
                <th className="w-20 px-5 py-3 font-medium text-zinc-500">
                  Order
                </th>
                <th className="px-5 py-3 font-medium text-zinc-500 md:w-2/5">
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
            <tbody
              onDragOver={handleDragOver}
              onDrop={handleDropOnContainer}
            >
              {tasks.map((task, index) => (
                <tr
                  key={task.id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, task.id, index)}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDropOnRow(event, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "border-b border-zinc-100 last:border-b-0",
                    draggingTaskId === task.id
                      ? "bg-zinc-100"
                      : "hover:bg-zinc-50 cursor-grab active:cursor-grabbing"
                  )}
                >
                  <td className="w-20 px-5 py-4 align-top">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <RiDraggable className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm font-medium text-zinc-500">
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="text-sm font-medium text-zinc-900">
                      {task.title}
                    </span>
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
            className={cn(
              "rounded-2xl border border-zinc-200 bg-white/90 p-4 transition",
              draggingTaskId === task.id
                ? "ring-2 ring-zinc-300"
                : "hover:border-zinc-300 cursor-grab active:cursor-grabbing"
            )}
          >
            <div className="flex items-center gap-2 text-zinc-400">
              <RiDraggable
                className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-sm font-semibold text-zinc-900">
                {task.title}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  statusAccent[task.status]
                }`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>

              <p className="text-xs text-zinc-500">{task.focusWindow}</p>
              {showAssignee ? (
                <p className="text-xs font-medium text-zinc-600">
                  {task.assignedTo ?? "Unassigned"}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
