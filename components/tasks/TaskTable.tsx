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
import { useCallback, useMemo, useState } from "react";
import { FiCheck, FiChevronDown, FiMoreVertical } from "react-icons/fi";
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
  onTaskComplete: (task: TaskModel, index: number) => Promise<void> | void;
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
  onTaskComplete,
}: TaskTableProps) {
  const [completionOverrides, setCompletionOverrides] = useState<
    Partial<Record<string, boolean>>
  >({});

  const getIsDone = useCallback(
    (task: TaskModel) => completionOverrides[task.id] ?? task.status === "done",
    [completionOverrides]
  );

  const markCompleteOptimistically = useCallback((taskId: string) => {
    setCompletionOverrides((prev) => ({
      ...prev,
      [taskId]: true,
    }));
  }, []);

  const clearCompletionOverride = useCallback((taskId: string) => {
    setCompletionOverrides((prev) => {
      if (!(taskId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const revertCompletionOverride = useCallback((taskId: string) => {
    setCompletionOverrides((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const [isTodayOpen, setIsTodayOpen] = useState(true);
  const [isNextUpOpen, setIsNextUpOpen] = useState(true);

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
      event: MouseEvent<
        HTMLTableRowElement | HTMLDivElement | HTMLButtonElement
      >,
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

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDone = getIsDone(a);
      const bDone = getIsDone(b);
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
      return b.position - a.position;
    });
  }, [getIsDone, tasks]);

  const sortedEntries = useMemo(
    () => sortedTasks.map((task, index) => ({ task, index })),
    [sortedTasks]
  );

  const todayEntries = sortedEntries.slice(0, 10);
  const nextUpEntries = sortedEntries.slice(10);
  const hasNextUp = nextUpEntries.length > 0;

  const renderTaskRow = (task: TaskModel, index: number) => {
    const isDone = getIsDone(task);

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id, index)}
        onDragOver={handleDragOver}
        onDrop={(event) => handleDropOnRow(event, index)}
        onDragEnd={handleDragEnd}
        onClick={async (event) => {
          event.preventDefault();
          if (draggingTaskId || isDone) return;
          markCompleteOptimistically(task.id);
          try {
            await onTaskComplete(task, index);
            clearCompletionOverride(task.id);
          } catch (error) {
            console.error("Failed to complete task", error);
            revertCompletionOverride(task.id);
          }
        }}
        className={cn(
          "flex items-center gap-3 px-1 py-3 text-sm transition",
          draggingTaskId === task.id
            ? "bg-zinc-100"
            : "hover:bg-zinc-50 cursor-grab active:cursor-grabbing"
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          aria-label={
            isDone ? "Mark task as incomplete" : "Mark task as complete"
          }
          className={cn(
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition",
            isDone
              ? "border-black bg-black text-white"
              : "border-zinc-300 bg-transparent text-transparent"
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isDone) return;
            markCompleteOptimistically(task.id);
            void Promise.resolve(onTaskComplete(task, index))
              .then(() => {
                clearCompletionOverride(task.id);
              })
              .catch((error) => {
                console.error("Failed to complete task", error);
                revertCompletionOverride(task.id);
              });
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {isDone ? <FiCheck className="h-3.5 w-3.5" /> : null}
        </button>

        <div className="flex flex-1 min-w-0 items-center justify-between gap-3 overflow-hidden">
          <span
            className={cn(
              "flex-1 min-w-0 truncate text-[18px] font-medium",
              isDone ? "line-through text-zinc-400" : "text-zinc-700"
            )}
            title={task.title}
          >
            {task.title}
          </span>

          <div className="flex shrink-0 items-center gap-2 pl-2">
            <span
              className={cn(
                "ml-2 shrink-0 rounded-md border px-3 py-[5px] text-[15px] font-medium leading-none",
                isDone && "opacity-30",
                task.focusWindow === "Today"
                  ? "bg-rose-100 text-rose-600 border-rose-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              )}
              title={task.focusWindow}
            >
              {task.focusWindow}
            </span>
            <button
              type="button"
              aria-label="Task actions"
              className={cn(
                "flex h-6 w-6 items-center justify-center text-zinc-400 transition hover:text-zinc-600",
                isDone && "opacity-30"
              )}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleTaskActivate(event, task);
              }}
            >
              <FiMoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

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
        className="md:hidden space-y-4"
        onDragOver={handleDragOver}
        onDrop={handleDropOnContainer}
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 shadow-sm">
          <button
            type="button"
            onClick={() => setIsTodayOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <FiChevronDown
                className={cn(
                  "h-4 w-4 text-zinc-500 transition-transform",
                  isTodayOpen ? "rotate-0" : "-rotate-90"
                )}
              />
              <p className="text-[17px] flex gap-1 font-display items-center font-semibold text-zinc-800">
                <span className="text-xl">💪</span>{" "}
                <span className="pt-[5px]">Today</span>
              </p>
            </div>
            <span className="rounded-md bg-zinc-100 p-1 px-2.5 flex items-center justify-center aspect-square text-sm font-medium text-zinc-900">
              {todayEntries.length}
            </span>
          </button>

          {isTodayOpen ? (
            todayEntries.length > 0 ? (
              <div className="space-y-1 px-1 pb-2">
                {todayEntries.map(({ task, index }) =>
                  renderTaskRow(task, index)
                )}
              </div>
            ) : (
              <div className="px-4 pb-4 text-sm text-zinc-400">
                Nothing lined up for today yet.
              </div>
            )
          ) : null}
        </div>

        {hasNextUp ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 shadow-sm">
            <button
              type="button"
              onClick={() => setIsNextUpOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <FiChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform",
                    isNextUpOpen ? "rotate-0" : "-rotate-90"
                  )}
                />

                <p className="text-[17px] flex gap-1 font-display items-center font-semibold text-zinc-800">
                  <span className="text-xl">⌛</span>{" "}
                  <span className="pt-[5px]">Next Up</span>
                </p>
              </div>

              <span className="rounded-md bg-zinc-100 p-1 px-2.5 flex items-center justify-center aspect-square text-sm font-medium text-zinc-900">
                {nextUpEntries.length}
              </span>
            </button>

            {isNextUpOpen ? (
              <div className="space-y-1 px-1 pb-2">
                {nextUpEntries.map(({ task, index }) =>
                  renderTaskRow(task, index)
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
