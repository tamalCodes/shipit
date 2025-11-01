import { createHash, randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import {
  getPasswordResetTokensCollection,
  getUsersCollection,
} from "@/lib/db";

type UserDocument = {
  _id: ObjectId;
  email: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getTokenTtlMinutes(): number {
  const raw = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES;

  if (!raw) {
    return 60;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      "Invalid PASSWORD_RESET_TOKEN_TTL_MINUTES value. Provide a positive integer."
    );
  }

  return parsed;
}

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

    const users = await getUsersCollection<UserDocument>();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      // Respond with success to avoid disclosing whether the email exists.
      return NextResponse.json({ success: true });
    }

    const tokens = await getPasswordResetTokensCollection<{
      _id: ObjectId;
      userId: ObjectId;
      tokenHash: string;
      expiresAt: Date;
      createdAt: Date;
    }>();

    await tokens.createIndex({ tokenHash: 1 }, { unique: true });
    await tokens.createIndex({ userId: 1 });

    await tokens.deleteMany({ userId: user._id });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(
      Date.now() + getTokenTtlMinutes() * 60 * 1000
    );

    await tokens.insertOne({
      userId: user._id,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
    });

    const responsePayload: Record<string, unknown> = { success: true };

    if (process.env.NODE_ENV !== "production") {
      responsePayload.token = token;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Failed to create password reset request", error);
    return NextResponse.json(
      { message: "Unable to start the password reset process right now." },
      { status: 500 }
    );
  }
}
