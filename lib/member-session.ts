import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const MEMBER_COOKIE = "goodminton_member";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function sessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return secret;
}

function signMemberId(memberId: string) {
  return createHmac("sha256", sessionSecret()).update(memberId).digest("hex");
}

function isValidSignature(memberId: string, signature: string) {
  const expected = Buffer.from(signMemberId(memberId));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function setMemberSession(memberId: string) {
  const cookieStore = await cookies();
  cookieStore.set(MEMBER_COOKIE, `${memberId}.${signMemberId(memberId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getCurrentMemberId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(MEMBER_COOKIE)?.value;

  if (!value) {
    return null;
  }

  const [memberId, signature] = value.split(".");

  if (!memberId || !signature || !isValidSignature(memberId, signature)) {
    return null;
  }

  return memberId;
}

export async function clearMemberSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MEMBER_COOKIE);
}
