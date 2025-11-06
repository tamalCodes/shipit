/*
  A light-weight drag and drop table used for prioritising tasks.
  Reorders items locally so users can focus on what comes next.
*/
"use client";

import { MAX_TODAY_TASKS } from "@/components/tasks/constants";
import type {
  TaskBoardGroup,
  TaskModel,
  TaskTableDropAction,
} from "@/components/tasks/types";
import { type TaskStatus } from "@/lib/schemas/task";
import { cn } from "@/lib/utils";
import biceps from "@/public/biceps.svg";
import eyes from "@/public/eyes.svg";
import Image from "next/image";
import type { DragEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiMoreVertical } from "react-icons/fi";

type TaskTableProps = {
  groupKey: TaskBoardGroup["key"];
  tasks: TaskModel[];
  showAssignee: boolean;
  draggingTaskId: string | null;
  onDragStart: (taskId: string, index: number) => void;
  onDragEnd: () => void;
  onTaskDrop: (action: TaskTableDropAction) => void;
  onTaskOpen: (task: TaskModel) => void;
  onTaskStatusChange: (
    task: TaskModel,
    index: number,
    nextStatus: TaskStatus
  ) => Promise<void> | void;
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
  onTaskStatusChange,
}: TaskTableProps) {
  const [completionOverrides, setCompletionOverrides] = useState<
    Partial<Record<string, boolean>>
  >({});
  const previousStatusRef = useRef<Record<string, TaskStatus>>({});

  useEffect(() => {
    tasks.forEach((task) => {
      if (task.status !== "done") {
        previousStatusRef.current[task.id] = task.status;
      }
    });
  }, [tasks]);

  const getIsDone = useCallback(
    (task: TaskModel) => completionOverrides[task.id] ?? task.status === "done",
    [completionOverrides]
  );

  const setCompletionOverrideValue = useCallback(
    (taskId: string, value: boolean) => {
      setCompletionOverrides((prev) => ({
        ...prev,
        [taskId]: value,
      }));
    },
    []
  );

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

  const applyTaskStatusChange = useCallback(
    async (task: TaskModel, index: number, nextStatus: TaskStatus) => {
      const shouldComplete = nextStatus === "done";
      if (shouldComplete) {
        if (task.status !== "done") {
          previousStatusRef.current[task.id] = task.status;
        } else if (!previousStatusRef.current[task.id]) {
          previousStatusRef.current[task.id] = "todo";
        }
        setCompletionOverrideValue(task.id, true);
      } else {
        if (!previousStatusRef.current[task.id]) {
          previousStatusRef.current[task.id] = nextStatus;
        }
        setCompletionOverrideValue(task.id, false);
      }

      try {
        await onTaskStatusChange(task, index, nextStatus);
        clearCompletionOverride(task.id);
        if (!shouldComplete) {
          previousStatusRef.current[task.id] = nextStatus;
        }
      } catch (error) {
        console.error("Failed to update task status", error);
        revertCompletionOverride(task.id);
        throw error;
      }
    },
    [
      clearCompletionOverride,
      onTaskStatusChange,
      revertCompletionOverride,
      setCompletionOverrideValue,
    ]
  );

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

  const todayEntries = sortedEntries.slice(0, MAX_TODAY_TASKS);
  const nextUpEntries = sortedEntries.slice(MAX_TODAY_TASKS);
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
          if (draggingTaskId) return;
          const nextStatus: TaskStatus = isDone
            ? previousStatusRef.current[task.id] ?? "todo"
            : "done";
          try {
            await applyTaskStatusChange(task, index, nextStatus);
          } catch {
            // errors already logged in applyTaskStatusChange
          }
        }}
        className={cn(
          "flex items-center gap-2 py-3 text-sm transition",
          draggingTaskId === task.id
            ? "bg-zinc-100"
            : " cursor-grab active:cursor-grabbing"
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
            const nextStatus: TaskStatus = isDone
              ? previousStatusRef.current[task.id] ?? "todo"
              : "done";
            void applyTaskStatusChange(task, index, nextStatus).catch(() => {
              // errors already handled in applyTaskStatusChange
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
              "flex-1 min-w-0 truncate text-[18px] font-normal",
              isDone ? "line-through text-zinc-400" : "text-zinc-800"
            )}
          >
            {task.title}
          </span>

          <div className="flex shrink-0 items-center gap-2 pl-2">
            <span
              className={cn(
                "ml-2 shrink-0 rounded-md border px-3 py-[5px] text-[15px] font-medium leading-none",
                isDone && "opacity-50",
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
                isDone && "opacity-50"
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
      <div
        className="space-y-4"
        onDragOver={handleDragOver}
        onDrop={handleDropOnContainer}
      >
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => setIsTodayOpen((prev) => !prev)}
            className="flex mb-4 w-full items-center  gap-3   py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <FiChevronDown
                className={cn(
                  "h-6 w-6 text-zinc-800 transition-transform",
                  isTodayOpen ? "rotate-0" : "-rotate-90"
                )}
              />
              <p className="text-[22px] flex gap-2 font-display items-center font-semibold text-zinc-700">
                <Image src={biceps} alt="" className="w-6 h-6" />
                <span className="pt-[5px]">Focusing On</span>
              </p>
            </div>
            {/* <span className="rounded-md mt-[5px] py-[3px] bg-zinc-200 px-2.5 flex items-center justify-center aspect-square text-xs font-medium text-zinc-900">
              {todayEntries.length}
            </span> */}
          </button>

          {isTodayOpen ? (
            todayEntries.length > 0 ? (
              <div className="space-y-1 pl-4 pr-2 bg-white rounded-[15px] py-2">
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
          <div className="overflow-hidden">
            <button
              type="button"
              onClick={() => setIsTodayOpen((prev) => !prev)}
              className="flex mb-4 w-full items-center  gap-3   py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <FiChevronDown
                  className={cn(
                    "h-6 w-6 text-zinc-800 transition-transform",
                    isTodayOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
                <p className="text-[22px] flex gap-2 font-display items-center font-semibold text-zinc-700">
                  <Image src={eyes} alt="" className="w-6 h-6" />
                  <span className="pt-[5px]">Coming Up next</span>
                </p>
              </div>
              {/* <span className="rounded-md mt-[5px] py-[3px] bg-zinc-200 px-2.5 flex items-center justify-center aspect-square text-xs font-medium text-zinc-900">
              {todayEntries.length}
            </span> */}
            </button>

            {isNextUpOpen ? (
              todayEntries.length > 0 ? (
                <div className="space-y-1 max-h-[310px] overflow-y-scroll pl-4 pr-2 bg-white rounded-[15px] py-2">
                  {nextUpEntries.map(({ task, index }) =>
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
        ) : null}
      </div>
    </>
  );
}
