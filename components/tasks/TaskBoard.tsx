"use client";

import {
  FormEvent,
  MouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiPlus, FiTrash2, FiX } from "react-icons/fi";

import { MAX_TODAY_TASKS } from "@/components/tasks/constants";
import TaskTable from "@/components/tasks/TaskTable";
import type {
  TaskBoardGroup,
  TaskModel,
  TaskTableDropAction,
} from "@/components/tasks/types";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/schemas/task";

type TaskBoardProps = {
  initialGroups: TaskBoardGroup[];
  showAssignee: boolean;
  showAddButton?: boolean;
};

export type TaskBoardHandle = {
  openCreateTask: (groupKey: TaskBoardGroup["key"]) => void;
};

type ClientTaskGroup = Omit<TaskBoardGroup, "tasks"> & {
  tasks: TaskModel[];
};

function createTaskId(groupKey: string, title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${groupKey}-${base}-${crypto.randomUUID()}`;
  }
  return `${groupKey}-${base}-${Math.random().toString(36).slice(2, 10)}`;
}

const TASK_STATUS_OPTIONS: TaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
];

type TaskCreateFormProps = {
  groupKey: TaskBoardGroup["key"];
  showAssignee: boolean;
  onSuccess: (task: TaskModel, groupKey: TaskBoardGroup["key"]) => void;
};

type TaskEditFormProps = {
  task: TaskModel;
  groupKey: TaskBoardGroup["key"];
  showAssignee: boolean;
  onSuccess: (task: TaskModel, groupKey: TaskBoardGroup["key"]) => void;
  onDelete: (taskId: string, groupKey: TaskBoardGroup["key"]) => void;
  onDeletingChange?: (isDeleting: boolean) => void;
};

type TaskEditFormHandle = {
  deleteTask: () => Promise<void>;
  isDeleting: boolean;
};

type CreateTaskResponse = {
  task?: {
    id?: string;
    title?: string;
    status?: TaskModel["status"];
    focusWindow?: string;
    assignedTo?: string | null;
    groupKey?: TaskBoardGroup["key"];
    position?: number;
  };
  message?: string;
};

type TaskModalProps =
  | {
      mode: "create";
      groupKey: TaskBoardGroup["key"];
      showAssignee: boolean;
      onClose: () => void;
      onCreate: (task: TaskModel, groupKey: TaskBoardGroup["key"]) => void;
    }
  | {
      mode: "edit";
      groupKey: TaskBoardGroup["key"];
      showAssignee: boolean;
      task: TaskModel;
      onClose: () => void;
      onUpdate: (task: TaskModel, groupKey: TaskBoardGroup["key"]) => void;
      onDelete: (taskId: string, groupKey: TaskBoardGroup["key"]) => void;
    };

type TaskModalState =
  | { mode: "create"; groupKey: TaskBoardGroup["key"] }
  | { mode: "edit"; groupKey: TaskBoardGroup["key"]; task: TaskModel };

function TaskCreateForm({
  groupKey,
  showAssignee,
  onSuccess,
}: TaskCreateFormProps) {
  const defaultFocusWindow = groupKey === "today" ? "Today" : "Next up";
  const [title, setTitle] = useState("");
  const [focusWindow, setFocusWindow] = useState(defaultFocusWindow);
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError("Add a task title.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      title: trimmedTitle,
      status: "todo" as TaskModel["status"],
      focusWindow: focusWindow.trim(),
      assignedTo: assignedTo.trim() ? assignedTo.trim() : undefined,
      groupKey,
    };

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Unable to create the task.";
        try {
          const body = (await response.json()) as CreateTaskResponse;
          if (body?.message && typeof body.message === "string") {
            message = body.message;
          }
        } catch {
          // Ignore JSON parsing errors
        }
        setError(message);
        return;
      }

      const data = (await response.json()) as CreateTaskResponse;
      const created = data?.task;

      if (
        !created ||
        typeof created.id !== "string" ||
        typeof created.title !== "string" ||
        typeof created.status !== "string" ||
        typeof created.focusWindow !== "string" ||
        (created.groupKey !== "today" && created.groupKey !== "up_next")
      ) {
        setError("Task created but response was unexpected.");
        return;
      }

      const newTask: TaskModel = {
        id: created.id,
        title: created.title,
        status: created.status,
        focusWindow: created.focusWindow,
        position: typeof created.position === "number" ? created.position : 0,
        assignedTo: created.assignedTo ?? null,
      };

      onSuccess(newTask, created.groupKey);

      setTitle("");
      setFocusWindow(defaultFocusWindow);
      setAssignedTo("");
    } catch (error) {
      console.error("Failed to submit task form", error);
      setError("Unable to create the task right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLFormElement>) => {
      if (
        event.key !== "Enter" ||
        event.shiftKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.tagName === "BUTTON") {
        return;
      }

      event.preventDefault();

      if (!isSubmitting) {
        event.currentTarget.requestSubmit();
      }
    },
    [isSubmitting]
  );

  return (
    <form
      className="space-y-12 md:space-y-8"
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
    >
      <div className="space-y-2 md:space-y-1.5">
        <label className="block text-[20px] md:text-xs font-medium  tracking-wide text-zinc-500">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to get done?"
          className="w-full outline-none focus:ring-0  rounded-xl border border-zinc-200 bg-white px-3 py-2 md:text-sm text-[18px] font-medium text-zinc-900 focus:border-zinc-300 focus:outline-none"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[20px] md:text-xs font-medium  tracking-wide text-zinc-500">
          Focus Window
        </label>
        <input
          type="text"
          value={focusWindow}
          onChange={(event) => setFocusWindow(event.target.value)}
          placeholder={
            groupKey === "today" ? "Today 09:00-10:00" : "Next 3 days"
          }
          className="w-full outline-none focus:ring-0  rounded-xl border border-zinc-200 bg-white px-3 py-2 md:text-sm text-[18px] font-medium text-zinc-900 focus:border-zinc-300 focus:outline-none"
          disabled={isSubmitting}
        />
      </div>

      {showAssignee ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Assignee (optional)
          </label>
          <input
            type="email"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            placeholder="teammate@company.com"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            disabled={isSubmitting}
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className={`flex justify-center md:w-auto w-full items-center gap-2 rounded-md px-4 py-4 md:py-2 md:text-sm text-[16px] font-semibold transition focus:outline-none ${
            isSubmitting
              ? "cursor-not-allowed bg-zinc-300 text-white"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span>Add Task</span>
              <span
                aria-hidden="true"
                title="Press Enter to add"
                className="rounded-[3px] h-5 w-6 hidden md:flex items-center justify-center pt-[0.3px] border border-white/40 bg-white/10 px-1.5 text-[10px] font-semibold leading-none text-white/80"
              >
                ↵
              </span>
            </div>
          )}
        </button>
      </div>
    </form>
  );
}

const TaskEditForm = forwardRef<TaskEditFormHandle, TaskEditFormProps>(
  (
    { task, groupKey, showAssignee, onSuccess, onDelete, onDeletingChange },
    ref
  ) => {
    const isPersistedTask = /^[a-f\d]{24}$/i.test(task.id);
    const [title, setTitle] = useState(task.title);
    const [focusWindow, setFocusWindow] = useState(task.focusWindow);
    const [status, setStatus] = useState<TaskStatus>(task.status);
    const [assignedTo, setAssignedTo] = useState(task.assignedTo ?? "");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setSubmitting] = useState(false);
    const [isDeleting, setDeleting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting || isDeleting) {
        return;
      }

      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        setError("Add a task title.");
        return;
      }

      setSubmitting(true);
      setError(null);

      const trimmedFocusWindow = focusWindow.trim();
      const trimmedAssignedTo = assignedTo.trim();

      const payload: Record<string, unknown> = {
        title: trimmedTitle,
        focusWindow: trimmedFocusWindow,
        status,
      };

      if (showAssignee) {
        payload.assignedTo =
          trimmedAssignedTo.length > 0 ? trimmedAssignedTo : null;
      }

      if (!isPersistedTask) {
        setError(
          "This sample task can't be updated. Create a new task first, then edit it."
        );
        setSubmitting(false);
        return;
      }

      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = "Unable to update the task.";
          try {
            const body = (await response.json()) as CreateTaskResponse;
            if (body?.message && typeof body.message === "string") {
              message = body.message;
            }
          } catch {
            // Ignore JSON parsing errors
          }
          setError(message);
          return;
        }

        const data = (await response.json()) as CreateTaskResponse;
        const updated = data?.task;

        if (
          !updated ||
          typeof updated.id !== "string" ||
          typeof updated.title !== "string" ||
          typeof updated.status !== "string" ||
          typeof updated.focusWindow !== "string" ||
          (updated.groupKey !== "today" && updated.groupKey !== "up_next")
        ) {
          setError("Task updated but response was unexpected.");
          return;
        }

        const updatedTask: TaskModel = {
          id: updated.id,
          title: updated.title,
          status: updated.status,
          focusWindow: updated.focusWindow,
          position:
            typeof updated.position === "number"
              ? updated.position
              : task.position,
          assignedTo: updated.assignedTo ?? null,
        };

        onSuccess(updatedTask, updated.groupKey);
      } catch (error) {
        console.error("Failed to submit task update form", error);
        setError("Unable to update the task right now.");
      } finally {
        setSubmitting(false);
      }
    };

    const handleDelete = useCallback(async () => {
      if (!isPersistedTask || isDeleting || isSubmitting) {
        if (!isPersistedTask) {
          setError(
            "This sample task can't be deleted. Create a new task first, then remove it."
          );
        }
        return;
      }

      setDeleting(true);
      onDeletingChange?.(true);
      setError(null);

      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let message = "Unable to delete the task.";
          try {
            const body = (await response.json()) as CreateTaskResponse;
            if (body?.message && typeof body.message === "string") {
              message = body.message;
            }
          } catch {
            // Ignore JSON parsing
          }
          setError(message);
          return;
        }

        onDelete(task.id, groupKey);
      } catch (error) {
        console.error("Failed to delete task", error);
        setError("Unable to delete the task right now.");
      } finally {
        setDeleting(false);
        onDeletingChange?.(false);
      }
    }, [
      groupKey,
      isDeleting,
      isPersistedTask,
      isSubmitting,
      onDelete,
      onDeletingChange,
      task.id,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        deleteTask: handleDelete,
        isDeleting,
      }),
      [handleDelete, isDeleting]
    );

    const handleEditFormKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLFormElement>) => {
        if (
          event.key !== "Enter" ||
          event.shiftKey ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        ) {
          return;
        }

        const target = event.target as HTMLElement | null;
        if (target?.tagName === "BUTTON") {
          return;
        }

        event.preventDefault();

        if (!isSubmitting && !isDeleting) {
          event.currentTarget.requestSubmit();
        }
      },
      [isSubmitting, isDeleting]
    );

    return (
      <form
        className="space-y-5"
        onSubmit={handleSubmit}
        onKeyDown={handleEditFormKeyDown}
      >
        <div className="space-y-2 mt-8">
          <label className="block text-xs font-medium  tracking-wide text-zinc-500">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to get done?"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-0 focus:ring-zinc-900/10"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium  tracking-wide text-zinc-500">
              Focus window
            </label>
            <input
              type="text"
              value={focusWindow}
              onChange={(event) => setFocusWindow(event.target.value)}
              placeholder={
                groupKey === "today" ? "Today 09:00-10:00" : "Next 3 days"
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-300 focus:outline-none focus:ring-0 focus:ring-zinc-900/10"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium  tracking-wide text-zinc-500">
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                className="peer w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm font-medium text-zinc-800 outline-none  transition focus:outline-none focus:ring-0 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
              >
                {TASK_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {TASK_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400 peer-focus:text-zinc-600">
                <FiChevronDown className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        {showAssignee ? (
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Assignee (optional)
            </label>
            <input
              type="email"
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              placeholder="teammate@company.com"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              disabled={isSubmitting}
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm font-medium text-rose-600">{error}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className={`flex items-center gap-3 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
              isSubmitting || isDeleting
                ? "cursor-not-allowed bg-zinc-300 text-white"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}{" "}
            <span
              aria-hidden="true"
              title="Press Enter to add"
              className="rounded-[3px] h-5 w-6 flex items-center justify-center pt-[0.3px] border border-white/40 bg-white/10 px-1.5 text-[10px] font-semibold leading-none text-white/80"
            >
              ↵
            </span>
          </button>
        </div>
      </form>
    );
  }
);

function TaskModal(props: TaskModalProps) {
  const { mode, groupKey, showAssignee, onClose } = props;
  const editFormRef = useRef<TaskEditFormHandle | null>(null);
  const [isEditDeleting, setEditDeleting] = useState(false);

  const mountNode =
    typeof window === "undefined"
      ? null
      : (document.body as HTMLElement | null);

  useEffect(() => {
    if (!mountNode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mountNode, onClose]);

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCardClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  if (!mountNode) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Create task" : "Edit task"}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={handleCardClick}
      >
        {mode === "edit" ? (
          <button
            type="button"
            onClick={() => {
              if (mode !== "edit" || isEditDeleting) return;
              void editFormRef.current?.deleteTask();
            }}
            className="absolute right-14 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-rose-200 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isEditDeleting ? "Deleting task..." : "Delete task"}
            disabled={isEditDeleting}
          >
            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          aria-label="Close"
        >
          <FiX className="h-4 w-4" />
        </button>

        <div className="space-y-6">
          {mode === "create" ? (
            <div className="space-y-2">
              <h2 className="text-[28px] md:text-lg font-semibold font-display text-zinc-900">
                Add a New Task
              </h2>
            </div>
          ) : null}

          {mode === "create" ? (
            <TaskCreateForm
              groupKey={groupKey}
              showAssignee={showAssignee}
              onSuccess={(task, createdGroupKey) =>
                props.onCreate(task, createdGroupKey)
              }
            />
          ) : (
            <TaskEditForm
              ref={editFormRef}
              task={props.task}
              groupKey={groupKey}
              showAssignee={showAssignee}
              onSuccess={(task, updatedGroupKey) =>
                props.onUpdate(task, updatedGroupKey)
              }
              onDelete={props.onDelete}
              onDeletingChange={setEditDeleting}
            />
          )}
        </div>
      </div>
    </div>,
    mountNode
  );
}

const TaskBoard = forwardRef<TaskBoardHandle, TaskBoardProps>(
  function TaskBoard(
    { initialGroups, showAssignee, showAddButton = true },
    ref
  ) {
    const [taskGroups, setTaskGroups] = useState<ClientTaskGroup[]>(() =>
      initialGroups.map((group) => ({
        ...group,
        tasks: group.tasks
          .map((task, index) => ({
            ...task,
            id: task.id ?? createTaskId(group.key, task.title),
            assignedTo: task.assignedTo ?? null,
            position: typeof task.position === "number" ? task.position : index,
          }))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      }))
    );

    console.log(taskGroups);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [modalState, setModalState] = useState<TaskModalState | null>(null);

    const isPersistedTaskId = useCallback((taskId: string) => {
      return /^[a-f\d]{24}$/i.test(taskId);
    }, []);

    const persistTaskOrder = useCallback(
      async (
        groups: Array<{
          groupKey: TaskBoardGroup["key"];
          tasks: Array<{ id: string; position: number }>;
        }>
      ) => {
        const filteredGroups = groups
          .map((group) => ({
            groupKey: group.groupKey,
            tasks: group.tasks.filter((task) => isPersistedTaskId(task.id)),
          }))
          .filter((group) => group.tasks.length > 0);

        if (filteredGroups.length === 0) {
          console.debug("[TaskBoard] No persisted tasks to reorder");
          return;
        }

        try {
          console.debug("[TaskBoard] Persisting task order", filteredGroups);
          const response = await fetch("/api/tasks/reorder", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ groups: filteredGroups }),
          });

          if (!response.ok) {
            const body = await response.text().catch(() => null);
            console.error(
              "[TaskBoard] Failed to persist task order",
              response.status,
              body
            );
          } else {
            console.debug("[TaskBoard] Task order persisted");
          }
        } catch (error) {
          console.error("[TaskBoard] Failed to persist task order", error);
        }
      },
      [isPersistedTaskId]
    );

    const handleDragStart = useCallback((taskId: string) => {
      setDraggingTaskId(taskId);
    }, []);

    const handleDragEnd = useCallback(() => {
      setDraggingTaskId(null);
    }, []);

    const handleTaskDrop = useCallback(
      ({
        sourceGroupKey,
        sourceIndex,
        targetGroupKey,
        targetIndex,
      }: TaskTableDropAction) => {
        console.debug("[TaskBoard] handleTaskDrop fired", {
          sourceGroupKey,
          sourceIndex,
          targetGroupKey,
          targetIndex,
        });

        if (sourceGroupKey === targetGroupKey && sourceIndex === targetIndex) {
          console.debug("[TaskBoard] Drop ignored (same position)");
          return;
        }

        const nextGroups = taskGroups.map((group) => ({
          ...group,
          tasks: [...group.tasks],
        }));

        const sourceGroup = nextGroups.find(
          (group) => group.key === sourceGroupKey
        );
        const targetGroup = nextGroups.find(
          (group) => group.key === targetGroupKey
        );

        if (!sourceGroup || !targetGroup) {
          console.warn(
            "[TaskBoard] Drop ignored - missing target/source group"
          );
          return;
        }

        if (sourceIndex < 0 || sourceIndex >= sourceGroup.tasks.length) {
          console.warn("[TaskBoard] Drop ignored - invalid source index");
          return;
        }

        const [movedTask] = sourceGroup.tasks.splice(sourceIndex, 1);
        if (!movedTask) {
          console.warn("[TaskBoard] Drop ignored - no task found at index");
          return;
        }

        let insertionIndex = targetIndex;

        if (sourceGroup === targetGroup && sourceIndex < targetIndex) {
          insertionIndex = targetIndex - 1;
        }

        insertionIndex = Math.max(0, insertionIndex);
        insertionIndex = Math.min(insertionIndex, targetGroup.tasks.length);

        const focusAdjustedTask =
          targetGroupKey === "up_next"
            ? { ...movedTask, focusWindow: "Coming up" }
            : movedTask;

        targetGroup.tasks.splice(insertionIndex, 0, focusAdjustedTask);

        console.debug("[TaskBoard] Task reordered locally", {
          taskId: focusAdjustedTask.id,
          from: sourceGroupKey,
          to: targetGroupKey,
        });

        const affectedGroupKeys = new Set<TaskBoardGroup["key"]>([
          targetGroupKey as TaskBoardGroup["key"],
        ]);
        if (sourceGroupKey !== targetGroupKey) {
          affectedGroupKeys.add(sourceGroupKey as TaskBoardGroup["key"]);
        }

        const payload: Array<{
          groupKey: TaskBoardGroup["key"];
          tasks: Array<{ id: string; position: number }>;
        }> = [];

        for (const groupKey of affectedGroupKeys) {
          const group = nextGroups.find((item) => item.key === groupKey);
          if (!group) continue;
          group.tasks = group.tasks.map((task, index) => ({
            ...task,
            position: index,
          }));
          const persistedTasks = group.tasks
            .filter((task) => isPersistedTaskId(task.id))
            .map((task) => ({
              id: task.id,
              position: task.position,
            }));
          if (persistedTasks.length > 0) {
            payload.push({ groupKey, tasks: persistedTasks });
          }
        }

        setTaskGroups(nextGroups);

        if (payload.length > 0) {
          void persistTaskOrder(payload);
        }
      },
      [persistTaskOrder, taskGroups, isPersistedTaskId]
    );

    const handleTaskCreated = useCallback(
      (task: TaskModel, groupKey: TaskBoardGroup["key"]) => {
        const removedTaskIds: string[] = [];
        let payload: Array<{
          groupKey: TaskBoardGroup["key"];
          tasks: Array<{ id: string; position: number }>;
        }> = [];

        setTaskGroups((previous) => {
          const next = previous.map((group) => ({
            ...group,
            tasks: [...group.tasks],
          }));

          const targetGroup = next.find((group) => group.key === groupKey);
          if (targetGroup) {
            targetGroup.tasks.unshift({
              ...task,
              position: 0,
            });

            if (groupKey === "today") {
              while (
                targetGroup.tasks.length > MAX_TODAY_TASKS &&
                targetGroup.tasks.some((item) => item.status === "done")
              ) {
                let removeIndex = -1;
                for (let i = targetGroup.tasks.length - 1; i >= 0; i -= 1) {
                  if (targetGroup.tasks[i].status === "done") {
                    removeIndex = i;
                    break;
                  }
                }
                if (removeIndex === -1) break;
                const [removed] = targetGroup.tasks.splice(removeIndex, 1);
                removedTaskIds.push(removed.id);
              }
            }

            targetGroup.tasks = targetGroup.tasks.map((item, index) => ({
              ...item,
              position: index,
            }));

            const persisted = targetGroup.tasks
              .filter((item) => isPersistedTaskId(item.id))
              .map((item) => ({ id: item.id, position: item.position }));
            if (persisted.length > 0) {
              payload = [{ groupKey, tasks: persisted }];
            }
          }

          return next;
        });

        if (payload.length > 0) {
          void persistTaskOrder(payload);
        }

        setModalState(null);

        const persistedRemovedIds = removedTaskIds.filter((id) =>
          isPersistedTaskId(id)
        );

        if (persistedRemovedIds.length > 0) {
          void Promise.all(
            persistedRemovedIds.map(async (id) => {
              const response = await fetch(`/api/tasks/${id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              if (!response.ok) {
                console.error(
                  "[TaskBoard] Failed to delete overflow task",
                  id,
                  response.status
                );
              }
            })
          );
        }
      },
      [isPersistedTaskId, persistTaskOrder]
    );

    const handleTaskUpdated = useCallback(
      (task: TaskModel, updatedGroupKey: TaskBoardGroup["key"]) => {
        let payload: Array<{
          groupKey: TaskBoardGroup["key"];
          tasks: Array<{ id: string; position: number }>;
        }> = [];

        setTaskGroups((previous) => {
          const originalGroupKey =
            modalState?.mode === "edit" ? modalState.groupKey : updatedGroupKey;

          const next = previous.map((group) => ({
            ...group,
            tasks: [...group.tasks],
          }));

          const originalGroup = next.find(
            (group) => group.key === originalGroupKey
          );
          const targetGroup = next.find(
            (group) => group.key === updatedGroupKey
          );

          if (!originalGroup || !targetGroup) {
            return previous;
          }

          const taskClone: TaskModel =
            updatedGroupKey === "up_next"
              ? { ...task, focusWindow: "Coming up" }
              : task;

          if (originalGroup === targetGroup) {
            const index = originalGroup.tasks.findIndex(
              (item) => item.id === task.id
            );
            if (index >= 0) {
              originalGroup.tasks[index] = taskClone;
            } else {
              originalGroup.tasks.unshift(taskClone);
            }
          } else {
            originalGroup.tasks = originalGroup.tasks.filter(
              (item) => item.id !== task.id
            );
            targetGroup.tasks.unshift(taskClone);
          }

          const affectedGroupKeys = new Set<TaskBoardGroup["key"]>([
            originalGroup.key,
            targetGroup.key,
          ]);

          payload = Array.from(affectedGroupKeys).map((groupKey) => {
            const group = next.find((item) => item.key === groupKey)!;
            group.tasks = group.tasks.map((item, index) => ({
              ...item,
              position: index,
            }));
            return {
              groupKey,
              tasks: group.tasks
                .filter((item) => isPersistedTaskId(item.id))
                .map((item) => ({ id: item.id, position: item.position })),
            };
          });

          payload = payload.filter((entry) => entry.tasks.length > 0);

          return next;
        });

        if (payload.length > 0) {
          void persistTaskOrder(payload);
        }

        setModalState(null);
      },
      [isPersistedTaskId, persistTaskOrder, modalState]
    );

    const handleTaskDeleted = useCallback(
      (taskId: string, groupKey: TaskBoardGroup["key"]) => {
        let payload: Array<{
          groupKey: TaskBoardGroup["key"];
          tasks: Array<{ id: string; position: number }>;
        }> = [];

        setTaskGroups((previous) => {
          const next = previous.map((group) => ({
            ...group,
            tasks: [...group.tasks],
          }));

          const targetGroup = next.find((group) => group.key === groupKey);
          if (targetGroup) {
            targetGroup.tasks = targetGroup.tasks
              .filter((task) => task.id !== taskId)
              .map((task, index) => ({
                ...task,
                position: index,
              }));
            const persisted = targetGroup.tasks
              .filter((task) => isPersistedTaskId(task.id))
              .map((task) => ({ id: task.id, position: task.position }));
            if (persisted.length > 0) {
              payload = [{ groupKey, tasks: persisted }];
            }
          }

          return next;
        });

        if (payload.length > 0) {
          void persistTaskOrder(payload);
        }

        setModalState(null);
      },
      [isPersistedTaskId, persistTaskOrder]
    );
    const openCreateModal = useCallback((groupKey: TaskBoardGroup["key"]) => {
      setModalState({ mode: "create", groupKey });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        openCreateTask: openCreateModal,
      }),
      [openCreateModal]
    );

    const handleTaskStatusQuickChange = useCallback(
      async (
        task: TaskModel,
        groupKey: TaskBoardGroup["key"],
        nextStatus: TaskStatus
      ) => {
        let rollbackState: ClientTaskGroup[] | null = null;
        const removedTaskIds: string[] = [];
        let reorderPayload: Array<{
          groupKey: TaskBoardGroup["key"];
          tasks: Array<{ id: string; position: number }>;
        }> = [];
        const isCompleting = nextStatus === "done";

        setTaskGroups((previous) => {
          rollbackState = previous.map((group) => ({
            ...group,
            tasks: group.tasks.map((item) => ({ ...item })),
          }));

          const next = previous.map((group) => ({
            ...group,
            tasks: [...group.tasks],
          }));

          const targetGroup = next.find((group) => group.key === groupKey);
          if (!targetGroup) {
            return previous;
          }

          const index = targetGroup.tasks.findIndex(
            (item) => item.id === task.id
          );
          if (index === -1) {
            return previous;
          }

          targetGroup.tasks[index] = {
            ...targetGroup.tasks[index],
            status: nextStatus,
          };

          if (groupKey === "today" && isCompleting) {
            while (
              targetGroup.tasks.length > MAX_TODAY_TASKS &&
              targetGroup.tasks.some((item) => item.status === "done")
            ) {
              let removeIndex = -1;
              for (let i = targetGroup.tasks.length - 1; i >= 0; i -= 1) {
                if (targetGroup.tasks[i].status === "done") {
                  removeIndex = i;
                  break;
                }
              }
              if (removeIndex === -1) break;
              const [removed] = targetGroup.tasks.splice(removeIndex, 1);
              removedTaskIds.push(removed.id);
            }
          }

          targetGroup.tasks = targetGroup.tasks.map((item, position) => ({
            ...item,
            position,
          }));

          const persisted = targetGroup.tasks
            .filter((item) => isPersistedTaskId(item.id))
            .map((item) => ({ id: item.id, position: item.position }));

          if (persisted.length > 0) {
            reorderPayload = [{ groupKey, tasks: persisted }];
          }

          return next;
        });

        if (!isPersistedTaskId(task.id)) {
          return;
        }

        try {
          const patchResponse = await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: nextStatus }),
          });

          if (!patchResponse.ok) {
            throw new Error(
              `Failed to update task status: ${patchResponse.status}`
            );
          }

          if (reorderPayload.length > 0) {
            void persistTaskOrder(reorderPayload);
          }

          if (isCompleting) {
            const persistedRemovedIds = removedTaskIds.filter((id) =>
              isPersistedTaskId(id)
            );

            if (persistedRemovedIds.length > 0) {
              await Promise.all(
                persistedRemovedIds.map(async (id) => {
                  const response = await fetch(`/api/tasks/${id}`, {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });
                  if (!response.ok) {
                    throw new Error(
                      `Failed to delete completed task ${id}: ${response.status}`
                    );
                  }
                })
              );
            }
          }
        } catch (error) {
          console.error("[TaskBoard] Unable to update task status", error);
          if (rollbackState) {
            setTaskGroups(rollbackState);
          }
          throw error;
        }
      },
      [isPersistedTaskId, persistTaskOrder]
    );

    const closeModal = useCallback(() => {
      setModalState(null);
    }, []);

    const handleTaskOpen = useCallback(
      (groupKey: TaskBoardGroup["key"], taskId: string) => {
        const group = taskGroups.find((item) => item.key === groupKey);
        const task = group?.tasks.find((item) => item.id === taskId);
        if (!task) {
          return;
        }
        setModalState({ mode: "edit", groupKey, task });
      },
      [taskGroups]
    );

    const modalProps: TaskModalProps | null = modalState
      ? modalState.mode === "create"
        ? {
            mode: "create",
            groupKey: modalState.groupKey,
            showAssignee,
            onClose: closeModal,
            onCreate: handleTaskCreated,
          }
        : {
            mode: "edit",
            groupKey: modalState.groupKey,
            showAssignee,
            onClose: closeModal,
            task: modalState.task,
            onUpdate: handleTaskUpdated,
            onDelete: handleTaskDeleted,
          }
      : null;

    return (
      <>
        {modalProps ? <TaskModal {...modalProps} /> : null}

        <section className="space-y-8">
          {showAddButton ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => openCreateModal("today")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              >
                <FiPlus className="h-4 w-4" aria-hidden="true" />
                Add Task
              </button>
            </div>
          ) : null}

          {/* up_next, today */}

          <div className={` space-y-4 mb-12`}>
            <div className="overflow-hidden">
              <TaskTable
                groupKey={"today"}
                tasks={taskGroups[0]?.tasks}
                showAssignee={showAssignee}
                draggingTaskId={draggingTaskId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTaskDrop={handleTaskDrop}
                onTaskOpen={(task) => handleTaskOpen("today", task.id)}
                onTaskStatusChange={(task, _index, nextStatus) =>
                  handleTaskStatusQuickChange(task, "today", nextStatus)
                }
              />
            </div>
          </div>
        </section>
      </>
    );
  }
);

TaskEditForm.displayName = "TaskEditForm";

TaskBoard.displayName = "TaskBoard";

export default TaskBoard;
