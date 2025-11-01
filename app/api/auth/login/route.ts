import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import { createAuthToken, verifyPassword } from "@/lib/auth-server";
import { getUsersCollection } from "@/lib/db";

type UserDocument = {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email: unknown = body?.email;
    const password: unknown = body?.password;

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedEmail.length === 0 || normalizedPassword.length === 0) {
      return NextResponse.json(
        { message: "Email and password must not be empty." },
        { status: 400 }
      );
    }

    const users = await getUsersCollection<UserDocument>();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(
      normalizedPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = createAuthToken({
      sub: user._id.toHexString(),
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      token,
      user: {
        id: user._id.toHexString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Failed to log in", error);
    return NextResponse.json(
      { message: "Unable to log in right now." },
      { status: 500 }
    );
  }
}
