import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getUsersCollection } from "@/lib/db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FindUserResult = {
  _id: ObjectId;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email: unknown = body?.email;

    if (typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Provide a valid email address." },
        { status: 400 }
      );
    }

    const users = await getUsersCollection<FindUserResult>();
    const existing = await users.findOne(
      { email: normalizedEmail },
      { projection: { _id: 1 } }
    );

    return NextResponse.json({ exists: Boolean(existing) });
  } catch (error) {
    console.error("Failed to check auth status", error);
    return NextResponse.json(
      { message: "Unable to check email status right now." },
      { status: 500 }
    );
  }
}
