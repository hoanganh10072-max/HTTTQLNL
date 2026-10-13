import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/lib/rules";

const COOKIE_NAME = "vnm_hrm_session";
const MAX_AGE = 60 * 60 * 8;

type SessionPayload = { userId: string; exp: number; version?: number };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET phải được cấu hình với ít nhất 32 ký tự.");
  return value;
}
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function createSessionToken(userId: string, version = 0, maxAge = MAX_AGE) {
  const payload = Buffer.from(JSON.stringify({ userId, version, exp: Math.floor(Date.now() / 1000) + maxAge } satisfies SessionPayload)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    return parsed.exp > Math.floor(Date.now() / 1000) ? parsed : null;
  } catch { return null; }
}

export async function setSession(userId: string, remember = false) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { sessionVersion: true } });
  const store = await cookies();
  const maxAge = remember ? 30 * 24 * 60 * 60 : MAX_AGE;
  store.set(COOKIE_NAME, createSessionToken(userId, user.sessionVersion, maxAge), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge, path: "/" });
}

export async function clearSession() { (await cookies()).delete(COOKIE_NAME); }

export async function getSession() {
  const payload = verifySessionToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!payload) return null;
  const user = await db.user.findFirst({ where: { id: payload.userId, isActive: true }, include: { employee: { include: { department: true, position: true } } } });
  if (!user || (payload.version ?? 0) !== user.sessionVersion || !isRole(user.role) || user.employee?.deletedAt || user.employee?.employmentStatus === "RESIGNED") return null;
  return user;
}

export async function requireUser(roles?: Role[]) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role as Role)) redirect("/forbidden");
  return user;
}

export function isRole(value: string): value is Role { return ["ADMIN", "HR", "MANAGER", "EMPLOYEE"].includes(value); }
