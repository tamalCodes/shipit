import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DEFAULT_SALT_ROUNDS = 12;
const DEFAULT_JWT_EXPIRES_IN = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "Missing JWT_SECRET environment variable. Set it in your .env file."
    );
  }

  return secret;
}

function getSaltRounds(): number {
  const configured = process.env.BCRYPT_SALT_ROUNDS;

  if (!configured) {
    return DEFAULT_SALT_ROUNDS;
  }

  const parsed = Number.parseInt(configured, 10);

  if (!Number.isFinite(parsed) || parsed < 4) {
    throw new Error(
      "Invalid BCRYPT_SALT_ROUNDS value. Use a number greater than or equal to 4."
    );
  }

  return parsed;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, getSaltRounds());
}

export async function verifyPassword(
  plainText: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export type TokenPayload = {
  sub: string;
  email: string;
  name: string;
};

export function createAuthToken(payload: TokenPayload): string {
  const expiresIn =
    process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_JWT_EXPIRES_IN;

  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded as TokenPayload;
  } catch (error) {
    console.error("Failed to verify auth token", error);
    return null;
  }
}
