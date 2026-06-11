"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, unlockAdmin, lockAdmin } from "@/lib/admin";
import {
 calculatePlayerFees,
 calculateShuttlecockFee,
 type FeePlayerInput,
} from "@/lib/calculations";
import {
 clearMemberSession,
 getCurrentMemberId,
 setMemberSession,
} from "@/lib/member-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
 Member,
 Session,
 SessionFormState,
 SessionSummary,
 SessionWithPlayers,
} from "@/lib/types";
import { summarizePlayers } from "@/lib/calculations";

const memberSelect =
 "id,name,login_name,phone,note,active,created_at,updated_at";
const sessionSelect =
 "id,date,court_fee,shuttlecock_unit_price,shuttlecock_quantity,shuttlecock_fee,drink_fee,other_fee,note,created_at,updated_at,session_players(*)";

function toNumber(value: FormDataEntryValue | null) {
 if (value === null || value === "") {
  return 0;
 }

 const numberValue = Number(value);
 return Number.isFinite(numberValue) ? numberValue : 0;
}

function toString(value: FormDataEntryValue | null) {
 const text = String(value ?? "").trim();
 return text.length > 0 ? text : null;
}

function assertNonNegativeFees(fees: number[]) {
 if (fees.some((fee) => fee < 0)) {
  throw new Error("Chi phí không được âm.");
 }
}

function normalizeLoginName(value: FormDataEntryValue | null) {
 return String(value ?? "")
  .trim()
  .toLowerCase();
}

function buildSummaries(sessions: SessionWithPlayers[]): SessionSummary[] {
 return sessions.map((session) => {
  const players = session.session_players ?? [];
  return {
   ...session,
   players,
   ...summarizePlayers(players),
  };
 });
}

export async function unlockAdminAction(formData: FormData) {
 await unlockAdmin(String(formData.get("pin") ?? ""));
 revalidatePath("/", "layout");
}

export async function lockAdminAction() {
 await lockAdmin();
 revalidatePath("/", "layout");
}

export async function getCurrentMember() {
 const memberId = await getCurrentMemberId();

 if (!memberId) {
  return null;
 }

 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("members")
  .select(memberSelect)
  .eq("id", memberId)
  .eq("active", true)
  .single();

 if (error || !data) {
  return null;
 }

 return data as Member;
}

export async function loginMember(
 _: { ok: boolean; message: string },
 formData: FormData,
) {
 const loginName = normalizeLoginName(formData.get("login_name"));
 const pinCode = String(formData.get("pin_code") ?? "");

 if (!loginName || !pinCode) {
  return { ok: false, message: "Tên đăng nhập và mã PIN là bắt buộc." };
 }

 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("members")
  .select("id,name,active,pin_code")
  .eq("login_name", loginName)
  .single();

 if (error || !data || !data.active || data.pin_code !== pinCode) {
  return {
   ok: false,
   message: "Thông tin đăng nhập không đúng hoặc tài khoản đã ngưng hoạt động.",
  };
 }

 await setMemberSession(data.id);
 revalidatePath("/", "layout");
 redirect("/");
}

export async function registerMember(
 _: { ok: boolean; message: string },
 formData: FormData,
) {
 const name = toString(formData.get("name"));
 const loginName = normalizeLoginName(formData.get("login_name"));
 const pinCode = String(formData.get("pin_code") ?? "").trim();

 if (!name || !loginName || !pinCode) {
  return { ok: false, message: "Tên, tên đăng nhập và mã PIN là bắt buộc." };
 }

 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("members")
  .insert({
   name,
   login_name: loginName,
   pin_code: pinCode,
   phone: toString(formData.get("phone")),
  })
  .select("id")
  .single();

 if (error) {
  return {
   ok: false,
   message:
    error.code === "23505" ? "Tên đăng nhập đã tồn tại." : error.message,
  };
 }

 await setMemberSession(data.id);
 revalidatePath("/", "layout");
 redirect("/");
}

export async function logoutMember() {
 await clearMemberSession();
 revalidatePath("/", "layout");
 redirect("/login");
}

export async function getMembers() {
 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("members")
  .select(memberSelect)
  .eq("active", true)
  .order("name", { ascending: true });

 if (error) throw new Error(error.message);
 return (data ?? []) as Member[];
}

export async function getAllMembers() {
 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("members")
  .select(memberSelect)
  .order("active", { ascending: false })
  .order("name", { ascending: true });

 if (error) throw new Error(error.message);
 return (data ?? []) as Member[];
}

export async function createMember(formData: FormData) {
 await requireAdmin();
 const name = toString(formData.get("name"));

 if (!name) {
  throw new Error("Tên thành viên là bắt buộc.");
 }

 const supabase = createSupabaseServerClient();
 const { error } = await supabase.from("members").insert({
  name,
  login_name: toString(formData.get("login_name"))
   ? normalizeLoginName(formData.get("login_name"))
   : null,
  pin_code: toString(formData.get("pin_code")),
  phone: toString(formData.get("phone")),
  note: toString(formData.get("note")),
 });

 if (error) throw new Error(error.message);
 revalidatePath("/members");
}

export async function updateMember(formData: FormData) {
 await requireAdmin();
 const id = String(formData.get("id") ?? "");
 const name = toString(formData.get("name"));

 if (!id || !name) {
  throw new Error("Thiếu thông tin thành viên.");
 }

 const supabase = createSupabaseServerClient();
 const pinCode = toString(formData.get("pin_code"));
 const updatePayload: {
  name: string;
  login_name: string | null;
  phone: string | null;
  note: string | null;
  pin_code?: string;
 } = {
  name,
  login_name: toString(formData.get("login_name"))
   ? normalizeLoginName(formData.get("login_name"))
   : null,
  phone: toString(formData.get("phone")),
  note: toString(formData.get("note")),
 };

 if (pinCode) {
  updatePayload.pin_code = pinCode;
 }

 const { error } = await supabase
  .from("members")
  .update(updatePayload)
  .eq("id", id);

 if (error) throw new Error(error.message);
 revalidatePath("/members");
}

export async function deactivateMember(formData: FormData) {
 await requireAdmin();
 const id = String(formData.get("id") ?? "");

 if (!id) {
  throw new Error("Thiếu thành viên cần xóa.");
 }

 const supabase = createSupabaseServerClient();
 const { error } = await supabase
  .from("members")
  .update({ active: false })
  .eq("id", id);

 if (error) throw new Error(error.message);
 revalidatePath("/members");
}

export async function getSessions(filters?: {
 memberName?: string | null;
 month?: string | null;
 unpaidOnly?: boolean;
}) {
 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("sessions")
  .select(sessionSelect)
  .order("date", { ascending: false });

 if (error) throw new Error(error.message);

 let sessions = buildSummaries((data ?? []) as SessionWithPlayers[]);

 if (filters?.month) {
  sessions = sessions.filter((session) =>
   session.date.startsWith(filters.month ?? ""),
  );
 }

 if (filters?.memberName) {
  const query = filters.memberName.toLowerCase();
  sessions = sessions.filter((session) =>
   session.players.some((player) =>
    player.member_name_snapshot.toLowerCase().includes(query),
   ),
  );
 }

 if (filters?.unpaidOnly) {
  sessions = sessions.filter((session) => session.unpaidAmount > 0);
 }

 return sessions;
}

export async function getDashboardData() {
 const sessions = await getSessions();
 const unpaidPlayers = sessions
  .flatMap((session) =>
   session.players
    .filter((player) => !player.paid)
    .map((player) => ({
     ...player,
     sessionDate: session.date,
     sessionId: session.id,
    })),
  )
  .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

 return {
  sessions,
  recentSessions: sessions.slice(0, 5),
  unpaidPlayers,
  totalSessions: sessions.length,
  totalAmount: sessions.reduce((sum, session) => sum + session.totalAmount, 0),
  totalPaid: sessions.reduce((sum, session) => sum + session.paidAmount, 0),
  totalUnpaid: sessions.reduce((sum, session) => sum + session.unpaidAmount, 0),
 };
}

export async function getSessionDetail(id: string) {
 const supabase = createSupabaseServerClient();
 const { data, error } = await supabase
  .from("sessions")
  .select(sessionSelect)
  .eq("id", id)
  .single();

 if (error) throw new Error(error.message);
 const session = data as SessionWithPlayers;

 return {
  ...session,
  players: session.session_players ?? [],
  ...summarizePlayers(session.session_players ?? []),
 };
}

function parseSessionPayload(formData: FormData) {
 const date = toString(formData.get("date"));
 const courtFee = toNumber(formData.get("court_fee"));
 const shuttlecockUnitPrice = toNumber(formData.get("shuttlecock_unit_price"));
 const shuttlecockQuantity = toNumber(formData.get("shuttlecock_quantity"));
 const shuttlecockFee = calculateShuttlecockFee(
  shuttlecockUnitPrice,
  shuttlecockQuantity,
 );
 const drinkFee = toNumber(formData.get("drink_fee"));
 const otherFee = toNumber(formData.get("other_fee"));
 const playerIndexes = formData.getAll("player_index").map(String);

 if (!date) throw new Error("Ngày chơi là bắt buộc.");
 assertNonNegativeFees([
  courtFee,
  shuttlecockUnitPrice,
  shuttlecockQuantity,
  drinkFee,
  otherFee,
 ]);

 const players: FeePlayerInput[] = playerIndexes.map((index) => ({
  memberId: toString(formData.get(`member_id_${index}`)),
  memberName: String(formData.get(`member_name_${index}`) ?? "").trim(),
  shareCount: toNumber(formData.get(`share_count_${index}`)),
  drinkShared: formData.get(`drink_shared_${index}`) === "on",
  adjustment: toNumber(formData.get(`adjustment_${index}`)),
  note: toString(formData.get(`note_${index}`)),
 }));

 if (players.length === 0) throw new Error("Cần ít nhất một người chơi.");
 if (players.some((player) => !player.memberName))
  throw new Error("Tên người chơi là bắt buộc.");
 if (players.some((player) => player.shareCount <= 0))
  throw new Error("Tập suất phải lớn hơn 0.");

 const calculatedPlayers = calculatePlayerFees({
  courtFee,
  shuttlecockFee,
  drinkFee,
  otherFee,
  players,
 });

 return {
  session: {
   date,
   court_fee: courtFee,
   shuttlecock_unit_price: shuttlecockUnitPrice,
   shuttlecock_quantity: shuttlecockQuantity,
   shuttlecock_fee: shuttlecockFee,
   drink_fee: drinkFee,
   other_fee: otherFee,
   note: toString(formData.get("note")),
  },
  calculatedPlayers,
 };
}

export async function createSessionWithPlayers(
 _: SessionFormState,
 formData: FormData,
): Promise<SessionFormState> {
 let sessionId: string | null = null;

 try {
  await requireAdmin();
  const payload = parseSessionPayload(formData);
  const supabase = createSupabaseServerClient();

  const { data: session, error: sessionError } = await supabase
   .from("sessions")
   .insert(payload.session)
   .select("id")
   .single();

  if (sessionError) throw new Error(sessionError.message);
  sessionId = (session as Pick<Session, "id">).id;

  const { error: playersError } = await supabase.from("session_players").insert(
   payload.calculatedPlayers.map((player) => ({
    session_id: sessionId,
    member_id: player.memberId,
    member_name_snapshot: player.memberName,
    share_count: player.shareCount,
    drink_shared: player.drinkShared,
    adjustment: player.adjustment,
    amount: player.amount,
    note: player.note,
   })),
  );

  if (playersError) throw new Error(playersError.message);
 } catch (error) {
  return {
   ok: false,
   message: error instanceof Error ? error.message : "Không thể lưu buổi chơi.",
  };
 }

 revalidatePath("/");
 revalidatePath("/sessions");
 redirect(`/sessions/${sessionId}`);
}

export async function updateSessionWithPlayers(formData: FormData) {
 await requireAdmin();
 const sessionId = String(formData.get("session_id") ?? "");

 if (!sessionId) throw new Error("Thiếu buổi chơi cần chỉnh sửa.");

 const payload = parseSessionPayload(formData);
 const supabase = createSupabaseServerClient();
 const { data: existingPlayers, error: existingError } = await supabase
  .from("session_players")
  .select("*")
  .eq("session_id", sessionId);

 if (existingError) throw new Error(existingError.message);

 const paidByMember = new Map(
  (
   (existingPlayers ?? []) as {
    member_id: string | null;
    paid: boolean;
    paid_at: string | null;
   }[]
  )
   .filter((player) => player.member_id)
   .map((player) => [
    player.member_id,
    { paid: player.paid, paid_at: player.paid_at },
   ]),
 );

 const { error: updateError } = await supabase
  .from("sessions")
  .update(payload.session)
  .eq("id", sessionId);
 if (updateError) throw new Error(updateError.message);

 const { error: deleteError } = await supabase
  .from("session_players")
  .delete()
  .eq("session_id", sessionId);
 if (deleteError) throw new Error(deleteError.message);

 const { error: insertError } = await supabase.from("session_players").insert(
  payload.calculatedPlayers.map((player) => {
   const paidState = player.memberId
    ? paidByMember.get(player.memberId)
    : undefined;
   return {
    session_id: sessionId,
    member_id: player.memberId,
    member_name_snapshot: player.memberName,
    share_count: player.shareCount,
    drink_shared: player.drinkShared,
    adjustment: player.adjustment,
    amount: player.amount,
    paid: paidState?.paid ?? false,
    paid_at: paidState?.paid_at ?? null,
    note: player.note,
   };
  }),
 );

 if (insertError) throw new Error(insertError.message);

 revalidatePath("/");
 revalidatePath("/sessions");
 revalidatePath(`/sessions/${sessionId}`);

 return sessionId;
}

export async function deleteSession(formData: FormData) {
 await requireAdmin();
 const id = String(formData.get("id") ?? "");
 if (!id) throw new Error("Thiếu buổi chơi cần xóa.");

 const supabase = createSupabaseServerClient();
 const { error } = await supabase.from("sessions").delete().eq("id", id);

 if (error) throw new Error(error.message);
 revalidatePath("/");
 revalidatePath("/sessions");
 redirect("/sessions");
}

export async function updatePlayerPaidStatus(formData: FormData) {
 await requireAdmin();
 const playerId = String(formData.get("player_id") ?? "");
 const sessionId = String(formData.get("session_id") ?? "");
 const paid = formData.get("paid") === "true";

 if (!playerId || !sessionId) {
  throw new Error("Thiếu người chơi cần cập nhật.");
 }

 const supabase = createSupabaseServerClient();
 const { error } = await supabase
  .from("session_players")
  .update({
   paid,
   paid_at: paid ? new Date().toISOString() : null,
  })
  .eq("id", playerId);

 if (error) throw new Error(error.message);
 revalidatePath("/");
 revalidatePath("/sessions");
 revalidatePath(`/sessions/${sessionId}`);
}
