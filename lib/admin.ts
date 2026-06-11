import "server-only";

import { cookies } from "next/headers";

import { getCurrentMemberId } from "@/lib/member-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_COOKIE = "goodminton_admin";
const MAX_AGE_SECONDS = 60 * 60 * 2;

export async function isAdminUnlocked() {
 const cookieStore = await cookies();

 if (cookieStore.get(ADMIN_COOKIE)?.value === "1") {
  return true;
 }

 const memberId = await getCurrentMemberId();

 if (!memberId) {
  return false;
 }

 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("members")
  .select("name, login_name, active")
  .eq("id", memberId)
  .eq("active", true)
  .single();

 if (error || !data) {
  return false;
 }

 const loginName = String(data.login_name ?? "")
  .trim()
  .toLowerCase();
 const name = String(data.name ?? "")
  .trim()
  .toLowerCase();

 return (
  loginName === "gina" ||
  name === "gina" ||
  loginName === "hagen" ||
  name === "hagen"
 );
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
