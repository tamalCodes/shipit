import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import { verifyAuthToken } from "@/lib/auth-server";
import { getTasksCollection } from "@/lib/db";
import {
  type TaskDocument,
  type TaskGroupKey,
  type TaskStatus,
} from "@/lib/schemas/task";

type UpdateTaskRequestBody = {
  title?: unknown;
  status?: unknown;
  focusWindow?: unknown;
  assignedTo?: unknown;
  groupKey?: unknown;
  position?: unknown;
  notes?: unknown;
};

type SerializableTask = {
  id: string;
  title: string;
  status: TaskStatus;
  focusWindow: string;
  assignedTo: string | null;
  groupKey: TaskGroupKey;
  position: number;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
};

const allowedStatuses: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const allowedGroupKeys: TaskGroupKey[] = ["today", "up_next"];

function serializeTask(task: TaskDocument): SerializableTask {
  return {
    id: task._id.toHexString(),
    title: task.title,
    status: task.status,
    focusWindow: task.focusWindow,
    assignedTo: task.assignedTo ?? null,
    groupKey: task.groupKey,
    position: task.position,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    notes: task.notes ?? null,
  };
}

function getAuthPayload(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return null;
  }
  return verifyAuthToken(token);
}

function toObjectIdOrNull(value: string | undefined | null) {
  if (!value) return null;
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function normalizeIdToString(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof ObjectId) {
    return value.toHexString();
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const payload = getAuthPayload(request);

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const rawWorkspaceId = payload.sub?.trim();
    if (!rawWorkspaceId) {
      return NextResponse.json(
        { message: "Invalid task reference." },
        { status: 400 }
      );
    }

    const workspaceObjectId = toObjectIdOrNull(rawWorkspaceId);
    const workspaceIdString = workspaceObjectId
      ? workspaceObjectId.toHexString()
      : rawWorkspaceId;

    const { taskId: paramsTaskId } = await context.params;

    const rawTaskId = paramsTaskId?.trim();
    if (!rawTaskId) {
      return NextResponse.json(
        { message: "Invalid task reference." },
        { status: 400 }
      );
    }

    const taskObjectId = toObjectIdOrNull(rawTaskId);
    if (!taskObjectId) {
      return NextResponse.json(
        { message: "Invalid task reference." },
        { status: 400 }
      );
    }

    const body: UpdateTaskRequestBody = await request
      .json()
      .catch(() => ({}));

    const rawTitle = body.title;
    const rawStatus = body.status;
    const rawFocusWindow = body.focusWindow;
    const rawAssignedTo = body.assignedTo;
    const rawGroupKey = body.groupKey;
    const rawPosition = body.position;
    const rawNotes = body.notes;

    const updateSet: Record<string, unknown> = {};
    const updateUnset: Record<string, true> = {};
    let hasChanges = false;

    if (typeof rawTitle === "string") {
      const normalizedTitle = rawTitle.trim();
      if (normalizedTitle.length === 0) {
        return NextResponse.json(
          { message: "Task title cannot be empty." },
          { status: 400 }
        );
      }
      updateSet.title = normalizedTitle;
      hasChanges = true;
    }

    if (typeof rawStatus === "string") {
      const normalizedStatus = rawStatus.trim() as TaskStatus;
      if (!allowedStatuses.includes(normalizedStatus)) {
        return NextResponse.json(
          { message: "Select a valid task status." },
          { status: 400 }
        );
      }
      updateSet.status = normalizedStatus;
      hasChanges = true;
    }

    if (typeof rawFocusWindow === "string") {
      updateSet.focusWindow = rawFocusWindow.trim();
      hasChanges = true;
    }

    if (typeof rawAssignedTo === "string") {
      const trimmed = rawAssignedTo.trim();
      updateSet.assignedTo = trimmed.length > 0 ? trimmed : null;
      hasChanges = true;
    } else if (rawAssignedTo === null) {
      updateSet.assignedTo = null;
      hasChanges = true;
    }

    if (typeof rawGroupKey === "string") {
      const normalizedGroupKey = rawGroupKey.trim() as TaskGroupKey;
      if (!allowedGroupKeys.includes(normalizedGroupKey)) {
        return NextResponse.json(
          { message: "Choose a valid task group." },
          { status: 400 }
        );
      }
      updateSet.groupKey = normalizedGroupKey;
      hasChanges = true;

      if (normalizedGroupKey === "up_next") {
        updateSet.focusWindow = "Coming up";
      }
    }

    if (typeof rawPosition === "number" && Number.isFinite(rawPosition)) {
      updateSet.position = rawPosition;
      hasChanges = true;
    }

    if (typeof rawNotes === "string") {
      const trimmed = rawNotes.trim();
      if (trimmed.length > 0) {
        updateSet.notes = trimmed;
      } else {
        updateUnset.notes = true;
      }
      hasChanges = true;
    } else if (rawNotes === null) {
      updateUnset.notes = true;
      hasChanges = true;
    }

    if (!hasChanges) {
      return NextResponse.json(
        { message: "Provide at least one field to update." },
        { status: 400 }
      );
    }

    const tasksCollection = await getTasksCollection<TaskDocument>();

    const existingTask = await tasksCollection.findOne({ _id: taskObjectId });

    if (!existingTask) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }

    const existingWorkspaceId = normalizeIdToString(
      existingTask.workspaceId
    );

    if (!existingWorkspaceId) {
      return NextResponse.json(
        { message: "Task reference is corrupted." },
        { status: 500 }
      );
    }

    if (existingWorkspaceId !== workspaceIdString) {
      return NextResponse.json(
        { message: "You do not have access to update this task." },
        { status: 403 }
      );
    }

    updateSet.updatedAt = new Date();

    const updateQuery: {
      $set: Record<string, unknown>;
      $unset?: Record<string, true>;
    } = {
      $set: updateSet,
    };

    if (Object.keys(updateUnset).length > 0) {
      updateQuery.$unset = updateUnset;
    }

    const updatedTask = await tasksCollection.findOneAndUpdate(
      { _id: taskObjectId },
      updateQuery,
      { returnDocument: "after", includeResultMetadata: false }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { message: "Unable to update the task right now." },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: serializeTask(updatedTask) });
  } catch (error) {
    console.error("Failed to update task", error);
    return NextResponse.json(
      { message: "Unable to update the task right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const payload = getAuthPayload(request);

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const rawWorkspaceId = payload.sub?.trim();
    if (!rawWorkspaceId) {
      return NextResponse.json(
        { message: "Invalid task reference." },
        { status: 400 }
      );
    }

    const workspaceObjectId = toObjectIdOrNull(rawWorkspaceId);
    const workspaceIdString = workspaceObjectId
      ? workspaceObjectId.toHexString()
      : rawWorkspaceId;

    const { taskId: paramsTaskId } = await context.params;
    const rawTaskId = paramsTaskId?.trim();

    if (!rawTaskId) {
      return NextResponse.json(
        { message: "Invalid task reference." },
        { status: 400 }
      );
    }

    const taskObjectId = toObjectIdOrNull(rawTaskId);
    if (!taskObjectId) {
      return NextResponse.json(
        { message: "Invalid task reference." },
        { status: 400 }
      );
    }

    const tasksCollection = await getTasksCollection<TaskDocument>();
    const existingTask = await tasksCollection.findOne({ _id: taskObjectId });

    if (!existingTask) {
      return NextResponse.json(
        { message: "Task not found." },
        { status: 404 }
      );
    }

    const existingWorkspaceId = normalizeIdToString(
      existingTask.workspaceId
    );

    if (!existingWorkspaceId) {
      return NextResponse.json(
        { message: "Task reference is corrupted." },
        { status: 500 }
      );
    }

    if (existingWorkspaceId !== workspaceIdString) {
      return NextResponse.json(
        { message: "You do not have access to delete this task." },
        { status: 403 }
      );
    }

    await tasksCollection.deleteOne({ _id: taskObjectId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete task", error);
    return NextResponse.json(
      { message: "Unable to delete the task right now." },
      { status: 500 }
    );
  }
}
