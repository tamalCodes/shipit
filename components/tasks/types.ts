import type { TaskGroupKey, TaskStatus } from "@/lib/schemas/task";

export type TaskModel = {
  id: string;
  title: string;
  status: TaskStatus;
  focusWindow: string;
  position: number;
  assignedTo?: string | null;
  groupKey: TaskGroupKey;
};

export type TaskBoardGroup = {
  key: TaskGroupKey;
  title: string;
  description: string;
  tasks: TaskModel[];
};

export type TaskTableDropAction = {
  taskId: string;
  sourceGroupKey: TaskGroupKey;
  sourceIndex: number;
  targetGroupKey: TaskGroupKey;
  targetIndex: number;
};
