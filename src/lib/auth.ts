import { createHash } from "crypto";
import { getDb } from "./db";
import { NextRequest } from "next/server";
import { getSession } from "./session";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function validateApiKeyFromRequest(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const key = authHeader.slice(7).trim();
  if (!key) return false;

  const hash = hashApiKey(key);
  const db = getDb();
  const row = db.prepare("SELECT id FROM api_keys WHERE key_hash = ?").get(hash);
  return !!row;
}

export async function isAdminFromSession(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

export async function requireAdminAuth(request: NextRequest): Promise<boolean> {
  // Check session first
  if (await isAdminFromSession()) return true;
  // Then check API key
  return validateApiKeyFromRequest(request);
}

export async function requireAdminSessionOnly(): Promise<boolean> {
  return isAdminFromSession();
}
