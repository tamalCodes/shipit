"use client";

import { useCallback, useState } from "react";

import TaskTable, {
  type TaskTableDropAction,
  type TaskTableTask,
} from "@/components/tasks/TaskTable";

type TaskBoardTask = Omit<TaskTableTask, "id">;

export type TaskBoardGroup = {
  key: "today" | "up_next";
  title: string;
  description: string;
  tasks: TaskBoardTask[];
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

export default function TaskBoard({
  initialGroups,
  showAssignee,
}: TaskBoardProps) {
  const [taskGroups, setTaskGroups] = useState<ClientTaskGroup[]>(() =>
    initialGroups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({
        ...task,
        id: createTaskId(group.key, task.title),
      })),
    }))
  );
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

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

  return (
    <section className="space-y-8">
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
  );
}
