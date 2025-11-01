import { createHash } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { hashPassword } from "@/lib/auth-server";
import { getPasswordResetTokensCollection, getUsersCollection } from "@/lib/db";
import { isPasswordStrong, MIN_PASSWORD_LENGTH } from "@/lib/password";

type PasswordResetTokenDocument = {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

type UserDocument = {
  _id: ObjectId;
  passwordHash: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token: unknown = body?.token;
    const password: unknown = body?.password;
    const confirmPassword: unknown = body?.confirmPassword;

    if (typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { message: "Reset token is required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.trim().length === 0) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 }
      );
    }

    if (typeof confirmPassword !== "string") {
      return NextResponse.json(
        { message: "Confirmation password is required." },
        { status: 400 }
      );
    }

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          message: `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    if (!isPasswordStrong(trimmedPassword)) {
      return NextResponse.json(
        { message: "Please meet all password requirements." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token.trim()).digest("hex");
    const tokens =
      await getPasswordResetTokensCollection<PasswordResetTokenDocument>();

    const storedToken = await tokens.findOne({ tokenHash });

    if (!storedToken) {
      return NextResponse.json(
        { message: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      await tokens.deleteOne({ _id: storedToken._id });
      return NextResponse.json(
        { message: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const users = await getUsersCollection<UserDocument>();
    const passwordHash = await hashPassword(trimmedPassword);

    await users.updateOne(
      { _id: storedToken.userId },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
      }
    );

    await tokens.deleteMany({ userId: storedToken.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset password", error);
    return NextResponse.json(
      { message: "Unable to reset your password right now." },
      { status: 500 }
    );
  }
}
