import "server-only";

import { cookies } from "next/headers";

const ADMIN_COOKIE = "goodminton_admin";
const MAX_AGE_SECONDS = 60 * 60 * 2;

export async function isAdminUnlocked() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "1";
}

export async function requireAdmin() {
  if (!(await isAdminUnlocked())) {
    throw new Error("Bạn cần mở khóa quyền thủ quỹ.");
  }
}

export async function unlockAdmin(pin: string) {
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPin) {
    throw new Error("ADMIN_PIN chưa được cấu hình.");
  }

  if (pin !== adminPin) {
    throw new Error("Mã PIN không đúng.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function lockAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
