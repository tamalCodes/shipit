import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import { createAuthToken, hashPassword } from "@/lib/auth-server";
import { getUsersCollection } from "@/lib/db";

type UserDocument = {
  _id?: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email: unknown = body?.email;
    const password: unknown = body?.password;
    const name: unknown = body?.name;

    if (typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.trim().length === 0) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Name is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedName = name.trim();

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Provide a valid email address." },
        { status: 400 }
      );
    }

    if (normalizedPassword.length < 8) {
      return NextResponse.json(
        { message: "Use a password with at least 8 characters." },
        { status: 400 }
      );
    }

    if (normalizedName.length < 2) {
      return NextResponse.json(
        { message: "Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    const users = await getUsersCollection<UserDocument>();
    await users.createIndex({ email: 1 }, { unique: true });

    const existing = await users.findOne(
      { email: normalizedEmail },
      { projection: { _id: 1 } }
    );

    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(normalizedPassword);
    const now = new Date();

    const insertResult = await users.insertOne({
      email: normalizedEmail,
      name: normalizedName,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const insertedId = insertResult.insertedId;

    const token = createAuthToken({
      sub: insertedId.toHexString(),
      email: normalizedEmail,
      name: normalizedName,
    });

    return NextResponse.json({
      token,
      user: {
        id: insertedId.toHexString(),
        email: normalizedEmail,
        name: normalizedName,
      },
    });
  } catch (error) {
    console.error("Failed to sign up", error);
    return NextResponse.json(
      { message: "Unable to create your account right now." },
      { status: 500 }
    );
  }
}
