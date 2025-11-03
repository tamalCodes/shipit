import { ObjectId } from "mongodb";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type TaskGroupKey = "today" | "up_next";

export interface TaskDocument {
  _id: ObjectId;
  workspaceId: ObjectId;
  title: string;
  status: TaskStatus;
  focusWindow: string;
  assignedTo?: string | null;
  groupKey: TaskGroupKey;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface CreateTaskInput {
  workspaceId: ObjectId;
  title: string;
  status: TaskStatus;
  focusWindow: string;
  assignedTo?: string | null;
  groupKey: TaskGroupKey;
  notes?: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};
