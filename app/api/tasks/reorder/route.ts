import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import { verifyAuthToken } from "@/lib/auth-server";
import { getTasksCollection } from "@/lib/db";
import {
  type TaskDocument,
  type TaskGroupKey,
} from "@/lib/schemas/task";

type ReorderTaskEntry = {
  id?: unknown;
  position?: unknown;
};

type ReorderGroupEntry = {
  groupKey?: unknown;
  tasks?: unknown;
};

const allowedGroupKeys: TaskGroupKey[] = ["today", "up_next"];

function toObjectIdOrNull(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value ?? null;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload?.sub) {
      return NextResponse.json(
        { message: "Invalid workspace reference." },
        { status: 400 }
      );
    }

    const workspaceObjectId = toObjectIdOrNull(payload.sub);
    if (!workspaceObjectId) {
      return NextResponse.json(
        { message: "Invalid workspace reference." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      groups?: ReorderGroupEntry[];
    } | null;

    if (!body || !Array.isArray(body.groups)) {
      return NextResponse.json(
        { message: "Provide a valid reorder payload." },
        { status: 400 }
      );
    }

    const tasksCollection = await getTasksCollection<TaskDocument>();

    const bulkOperations = [];

    for (const groupEntry of body.groups) {
      const groupKey = groupEntry?.groupKey;
      if (typeof groupKey !== "string") continue;
      if (!allowedGroupKeys.includes(groupKey as TaskGroupKey)) continue;

      const tasks = groupEntry?.tasks;
      if (!Array.isArray(tasks)) continue;

      for (const taskEntry of tasks) {
        const id = (taskEntry as ReorderTaskEntry)?.id;
        const position = (taskEntry as ReorderTaskEntry)?.position;

        if (typeof position !== "number" || !Number.isFinite(position)) {
          continue;
        }

        const taskObjectId = toObjectIdOrNull(id);
        if (!taskObjectId) continue;

        const update: Record<string, unknown> = {
          position,
          groupKey,
        };

        if (groupKey === "up_next") {
          update.focusWindow = "Coming up";
        }

        bulkOperations.push({
          updateOne: {
            filter: {
              _id: taskObjectId,
              workspaceId: workspaceObjectId,
            },
            update: {
              $set: update,
            },
          },
        });
      }
    }

    if (bulkOperations.length === 0) {
      return NextResponse.json({ ok: true });
    }

    await tasksCollection.bulkWrite(bulkOperations, { ordered: false });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reorder tasks", error);
    return NextResponse.json(
      { message: "Unable to reorder tasks right now." },
      { status: 500 }
    );
  }
}
