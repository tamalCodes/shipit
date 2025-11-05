import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import { verifyAuthToken } from "@/lib/auth-server";
import { getTasksCollection } from "@/lib/db";
import {
  type CreateTaskInput,
  type TaskDocument,
  type TaskGroupKey,
  type TaskStatus,
} from "@/lib/schemas/task";

type CreateTaskRequestBody = {
  title?: unknown;
  status?: unknown;
  focusWindow?: unknown;
  assignedTo?: unknown;
  groupKey?: unknown;
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

function parseWorkspaceId(userId: string | undefined) {
  if (!userId) {
    return null;
  }

  try {
    return new ObjectId(userId);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request);

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const workspaceId = parseWorkspaceId(payload.sub);

    if (!workspaceId) {
      return NextResponse.json({ message: "Invalid workspace." }, { status: 400 });
    }

    const tasksCollection = await getTasksCollection<TaskDocument>();
    await tasksCollection.createIndex({ workspaceId: 1, groupKey: 1, createdAt: -1 });

    const tasks = await tasksCollection
      .find({ workspaceId })
      .sort({ groupKey: 1, position: 1, createdAt: 1 })
      .limit(500)
      .toArray();

    return NextResponse.json({
      tasks: tasks.map((task) => serializeTask(task)),
    });
  } catch (error) {
    console.error("Failed to list tasks", error);
    return NextResponse.json(
      { message: "Unable to fetch tasks right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = getAuthPayload(request);

    if (!payload) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const workspaceId = parseWorkspaceId(payload.sub);

    if (!workspaceId) {
      return NextResponse.json({ message: "Invalid workspace." }, { status: 400 });
    }

    const body: CreateTaskRequestBody = await request.json().catch(() => ({}));

    const rawTitle = body.title;
    const rawStatus = body.status;
    const rawFocusWindow = body.focusWindow;
    const rawAssignedTo = body.assignedTo;
    const rawGroupKey = body.groupKey;
    const rawNotes = body.notes;

    if (typeof rawTitle !== "string" || rawTitle.trim().length === 0) {
      return NextResponse.json(
        { message: "Task title is required." },
        { status: 400 }
      );
    }

    const normalizedTitle = rawTitle.trim();

    let normalizedStatus: TaskStatus = "todo";
    if (typeof rawStatus === "string") {
      const trimmed = rawStatus.trim() as TaskStatus;
      if (!allowedStatuses.includes(trimmed)) {
        return NextResponse.json(
          { message: "Select a valid task status." },
          { status: 400 }
        );
      }
      normalizedStatus = trimmed;
    }

    if (typeof rawGroupKey !== "string") {
      return NextResponse.json(
        { message: "Choose where the task belongs." },
        { status: 400 }
      );
    }

    const normalizedGroupKey = rawGroupKey.trim() as TaskGroupKey;

    if (!allowedGroupKeys.includes(normalizedGroupKey)) {
      return NextResponse.json(
        { message: "Choose a valid task group." },
        { status: 400 }
      );
    }

    const normalizedFocusWindow =
      typeof rawFocusWindow === "string" ? rawFocusWindow.trim() : "";

    let normalizedAssignedTo: string | null = null;
    if (typeof rawAssignedTo === "string" && rawAssignedTo.trim().length > 0) {
      normalizedAssignedTo = rawAssignedTo.trim();
    }

    const normalizedNotes =
      typeof rawNotes === "string" && rawNotes.trim().length > 0
        ? rawNotes.trim()
        : undefined;

    const tasksCollection = await getTasksCollection<TaskDocument>();
    await tasksCollection.createIndex({ workspaceId: 1, groupKey: 1, createdAt: -1 });

    const [minPositionTask] = await tasksCollection
      .find({ workspaceId, groupKey: normalizedGroupKey })
      .sort({ position: 1 })
      .limit(1)
      .toArray();

    const nextPosition =
      typeof minPositionTask?.position === "number"
        ? minPositionTask.position - 1
        : 0;

    const now = new Date();

    const taskInput: CreateTaskInput = {
      workspaceId,
      title: normalizedTitle,
      status: normalizedStatus,
      focusWindow: normalizedFocusWindow,
      assignedTo: normalizedAssignedTo,
      groupKey: normalizedGroupKey,
      position: nextPosition,
      notes: normalizedNotes,
    };

    const newTaskId = new ObjectId();

    await tasksCollection.insertOne({
      _id: newTaskId,
      ...taskInput,
      assignedTo: taskInput.assignedTo ?? null,
      notes: taskInput.notes,
      createdAt: now,
      updatedAt: now,
    });

    const insertedTask: TaskDocument = {
      _id: newTaskId,
      workspaceId,
      title: taskInput.title,
      status: taskInput.status,
      focusWindow: taskInput.focusWindow,
      assignedTo: taskInput.assignedTo ?? null,
      groupKey: taskInput.groupKey,
      position: taskInput.position,
      createdAt: now,
      updatedAt: now,
      notes: taskInput.notes,
    };

    return NextResponse.json(
      { task: serializeTask(insertedTask) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create task", error);
    return NextResponse.json(
      { message: "Unable to create the task right now." },
      { status: 500 }
    );
  }
}
