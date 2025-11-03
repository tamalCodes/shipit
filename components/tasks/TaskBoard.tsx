"use client";

import { FormEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiX } from "react-icons/fi";

import TaskTable, {
  type TaskTableDropAction,
  type TaskTableTask,
} from "@/components/tasks/TaskTable";

type TaskBoardTaskInput = Omit<TaskTableTask, "id"> & {
  id?: string;
};

export type TaskBoardGroup = {
  key: "today" | "up_next";
  title: string;
  description: string;
  tasks: TaskBoardTaskInput[];
};

type TaskBoardProps = {
  initialGroups: TaskBoardGroup[];
  showAssignee: boolean;
};

type ClientTaskGroup = Omit<TaskBoardGroup, "tasks"> & {
  tasks: TaskTableTask[];
};

function createTaskId(groupKey: string, title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${groupKey}-${base}-${crypto.randomUUID()}`;
  }
  return `${groupKey}-${base}-${Math.random().toString(36).slice(2, 10)}`;
}

type TaskCreateFormProps = {
  groupKey: TaskBoardGroup["key"];
  showAssignee: boolean;
  onSuccess: (task: TaskTableTask, groupKey: TaskBoardGroup["key"]) => void;
};

type CreateTaskResponse = {
  task?: {
    id?: string;
    title?: string;
    status?: TaskTableTask["status"];
    focusWindow?: string;
    assignedTo?: string | null;
    groupKey?: TaskBoardGroup["key"];
  };
  message?: string;
};

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
      status: "todo" as TaskTableTask["status"],
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

      const newTask: TaskTableTask = {
        id: created.id,
        title: created.title,
        status: created.status,
        focusWindow: created.focusWindow,
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to get done?"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Focus window
        </label>
        <input
          type="text"
          value={focusWindow}
          onChange={(event) => setFocusWindow(event.target.value)}
          placeholder={groupKey === "today" ? "Today 09:00-10:00" : "Next 3 days"}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none"
          disabled={isSubmitting}
        />
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
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none"
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
          className={`inline-flex justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none ${
            isSubmitting
              ? "cursor-not-allowed bg-zinc-300 text-white"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Add task"}
        </button>
      </div>
    </form>
  );
}

type TaskCreateModalProps = {
  groupKey: TaskBoardGroup["key"];
  showAssignee: boolean;
  onClose: () => void;
  onSuccess: (task: TaskTableTask, groupKey: TaskBoardGroup["key"]) => void;
};

function TaskCreateModal({
  groupKey,
  showAssignee,
  onClose,
  onSuccess,
}: TaskCreateModalProps) {
  const mountNode =
    typeof window === "undefined" ? null : (document.body as HTMLElement | null);

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
      aria-label="Create task"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={handleCardClick}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
          aria-label="Close"
        >
          <FiX className="h-4 w-4" />
        </button>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">New task</h2>
            <p className="text-sm text-zinc-600">
              Capture what matters right now. You can reorder or assign it later.
            </p>
          </div>

          <TaskCreateForm
            groupKey={groupKey}
            showAssignee={showAssignee}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>,
    mountNode
  );
}

export default function TaskBoard({
  initialGroups,
  showAssignee,
}: TaskBoardProps) {
  const [taskGroups, setTaskGroups] = useState<ClientTaskGroup[]>(() =>
    initialGroups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({
        ...task,
        id: task.id ?? createTaskId(group.key, task.title),
        assignedTo: task.assignedTo ?? null,
      })),
    }))
  );
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createModalGroupKey, setCreateModalGroupKey] =
    useState<TaskBoardGroup["key"]>("today");

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
      setTaskGroups((previous) => {
        if (
          sourceGroupKey === targetGroupKey &&
          sourceIndex === targetIndex
        ) {
          return previous;
        }

        const next = previous.map((group) => ({
          ...group,
          tasks: [...group.tasks],
        }));

        const sourceGroup = next.find((group) => group.key === sourceGroupKey);
        const targetGroup = next.find((group) => group.key === targetGroupKey);

        if (!sourceGroup || !targetGroup) {
          return previous;
        }

        if (
          sourceIndex < 0 ||
          sourceIndex >= sourceGroup.tasks.length
        ) {
          return previous;
        }

        const [movedTask] = sourceGroup.tasks.splice(sourceIndex, 1);
        if (!movedTask) {
          return previous;
        }

        let insertionIndex = targetIndex;

        if (sourceGroup === targetGroup && sourceIndex < targetIndex) {
          insertionIndex = targetIndex - 1;
        }

        insertionIndex = Math.max(0, insertionIndex);
        insertionIndex = Math.min(insertionIndex, targetGroup.tasks.length);

        targetGroup.tasks.splice(insertionIndex, 0, movedTask);

        return next;
      });
    },
    []
  );

  const handleTaskCreated = useCallback(
    (task: TaskTableTask, groupKey: TaskBoardGroup["key"]) => {
      setTaskGroups((previous) =>
        previous.map((group) =>
          group.key === groupKey
            ? { ...group, tasks: [task, ...group.tasks] }
            : group
        )
      );
      setCreateModalOpen(false);
    },
    []
  );

  const openCreateModal = useCallback((groupKey: TaskBoardGroup["key"]) => {
    setCreateModalGroupKey(groupKey);
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
  }, []);

  return (
    <>
      {isCreateModalOpen ? (
        <TaskCreateModal
          groupKey={createModalGroupKey}
          showAssignee={showAssignee}
          onClose={closeCreateModal}
          onSuccess={handleTaskCreated}
        />
      ) : null}

      <section className="space-y-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => openCreateModal("today")}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            <FiPlus className="h-4 w-4" aria-hidden="true" />
            Add task
          </button>
        </div>

        {taskGroups.map((group) => (
          <div key={group.key} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {group.title}
              </h3>
              <p className="text-sm text-zinc-500">{group.description}</p>
            </div>

            <div className="overflow-hidden rounded-2xl md:border md:border-zinc-200 md:bg-white md:shadow-sm">
              <TaskTable
                groupKey={group.key}
                tasks={group.tasks}
                showAssignee={showAssignee}
                draggingTaskId={draggingTaskId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTaskDrop={handleTaskDrop}
              />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
