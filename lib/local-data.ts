import type {
 Member,
 PlayerPaymentStatus,
 SessionPlayerWithPayment,
 SessionSummary,
} from "@/lib/types";

export const LOCAL_DATA_SCHEMA_VERSION = 1 as const;
export const LOCAL_DATA_STORAGE_KEY = "goodminton:local-data:v1";
export const LOCAL_DATA_UPDATED_EVENT = "goodminton:local-data-updated";

export type LocalDataSnapshot = {
 schemaVersion: typeof LOCAL_DATA_SCHEMA_VERSION;
 updatedAt: string;
 members: Member[];
 sessions: SessionSummary[];
};

type SaveLocalSnapshotInput = {
 members?: Member[];
 sessions?: SessionSummary[];
 replaceMembers?: boolean;
 replaceSessions?: boolean;
};

type CsvValue = string | number | boolean | null | undefined;

function emptySnapshot(): LocalDataSnapshot {
 return {
  schemaVersion: LOCAL_DATA_SCHEMA_VERSION,
  updatedAt: new Date(0).toISOString(),
  members: [],
  sessions: [],
 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
 return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
 return value === null || isString(value);
}

function isNumber(value: unknown): value is number {
 return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
 return typeof value === "boolean";
}

function isPlayerPaymentStatus(value: unknown): value is PlayerPaymentStatus {
 return (
  value === "unpaid" ||
  value === "partial" ||
  value === "paid" ||
  value === "overpaid"
 );
}

function isMember(value: unknown): value is Member {
 if (!isRecord(value)) return false;

 return (
  isString(value.id) &&
  isString(value.name) &&
  isNullableString(value.login_name) &&
  isNullableString(value.phone) &&
  isNullableString(value.note) &&
  isBoolean(value.active) &&
  isString(value.created_at) &&
  isString(value.updated_at)
 );
}

function isSessionPlayer(value: unknown): value is SessionPlayerWithPayment {
 if (!isRecord(value)) return false;

 return (
  isString(value.id) &&
  isString(value.session_id) &&
  isNullableString(value.member_id) &&
  isString(value.member_name_snapshot) &&
  isNumber(value.share_count) &&
  isBoolean(value.drink_shared) &&
  isNumber(value.adjustment) &&
  isNumber(value.amount) &&
  isNumber(value.paid_amount) &&
  isBoolean(value.paid) &&
  isNullableString(value.paid_at) &&
  isNullableString(value.note) &&
  isString(value.created_at) &&
  isString(value.updated_at) &&
  isNumber(value.remainingAmount) &&
  isNumber(value.balanceAmount) &&
  isPlayerPaymentStatus(value.paymentStatus)
 );
}

function isSessionSummary(value: unknown): value is SessionSummary {
 if (!isRecord(value)) return false;

 return (
  isString(value.id) &&
  isString(value.date) &&
  isNumber(value.court_fee) &&
  isNumber(value.shuttlecock_unit_price) &&
  isNumber(value.shuttlecock_quantity) &&
  isNumber(value.shuttlecock_fee) &&
  isNumber(value.drink_fee) &&
  isNumber(value.other_fee) &&
  isNullableString(value.note) &&
  isString(value.created_at) &&
  isString(value.updated_at) &&
  Array.isArray(value.players) &&
  value.players.every(isSessionPlayer) &&
  isNumber(value.totalAmount) &&
  isNumber(value.paidAmount) &&
  isNumber(value.unpaidAmount) &&
  isNumber(value.creditAmount) &&
  isNumber(value.playerCount) &&
  (value.status === "paid" || value.status === "unpaid" || value.status === "partial")
 );
}

function parseSnapshotValue(value: unknown): LocalDataSnapshot {
 if (!isRecord(value)) {
  throw new Error("File backup không đúng định dạng.");
 }

 if (value.schemaVersion !== LOCAL_DATA_SCHEMA_VERSION) {
  throw new Error("Phiên bản file backup chưa được hỗ trợ.");
 }

 if (!isString(value.updatedAt)) {
  throw new Error("File backup thiếu thời điểm cập nhật.");
 }

 if (!Array.isArray(value.members) || !value.members.every(isMember)) {
  throw new Error("Danh sách thành viên trong file backup không hợp lệ.");
 }

 if (!Array.isArray(value.sessions) || !value.sessions.every(isSessionSummary)) {
  throw new Error("Danh sách buổi chơi trong file backup không hợp lệ.");
 }

 return {
  schemaVersion: LOCAL_DATA_SCHEMA_VERSION,
  updatedAt: value.updatedAt,
  members: value.members,
  sessions: value.sessions,
 };
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
 const items = new Map(current.map((item) => [item.id, item]));

 for (const item of incoming) {
  items.set(item.id, item);
 }

 return Array.from(items.values());
}

function writeSnapshot(snapshot: LocalDataSnapshot) {
 if (typeof window === "undefined") return;

 window.localStorage.setItem(LOCAL_DATA_STORAGE_KEY, JSON.stringify(snapshot));
 window.dispatchEvent(new Event(LOCAL_DATA_UPDATED_EVENT));
}

export function readLocalData(): LocalDataSnapshot {
 if (typeof window === "undefined") {
  return emptySnapshot();
 }

 const raw = window.localStorage.getItem(LOCAL_DATA_STORAGE_KEY);
 if (!raw) return emptySnapshot();

 try {
  return parseSnapshotValue(JSON.parse(raw));
 } catch {
  return emptySnapshot();
 }
}

export function saveLocalSnapshot({
 members,
 sessions,
 replaceMembers = false,
 replaceSessions = false,
}: SaveLocalSnapshotInput): LocalDataSnapshot {
 const current = readLocalData();
 const snapshot: LocalDataSnapshot = {
  schemaVersion: LOCAL_DATA_SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
  members:
   members === undefined
    ? current.members
    : replaceMembers
      ? members
      : mergeById(current.members, members),
  sessions:
   sessions === undefined
    ? current.sessions
    : replaceSessions
      ? sessions
      : mergeById(current.sessions, sessions),
 };

 writeSnapshot(snapshot);
 return snapshot;
}

export function importLocalData(text: string): LocalDataSnapshot {
 const snapshot = parseSnapshotValue(JSON.parse(text));
 const imported: LocalDataSnapshot = {
  ...snapshot,
  updatedAt: new Date().toISOString(),
 };

 writeSnapshot(imported);
 return imported;
}

export function clearLocalData() {
 if (typeof window === "undefined") return;

 window.localStorage.removeItem(LOCAL_DATA_STORAGE_KEY);
 window.dispatchEvent(new Event(LOCAL_DATA_UPDATED_EVENT));
}

function csvCell(value: CsvValue) {
 const text = value === null || value === undefined ? "" : String(value);
 return `"${text.replaceAll('"', '""')}"`;
}

function buildCsv(headers: string[], rows: CsvValue[][]) {
 return `\ufeff${[headers, ...rows]
  .map((row) => row.map(csvCell).join(","))
  .join("\r\n")}`;
}

function downloadTextFile(fileName: string, content: string, type: string) {
 const blob = new Blob([content], { type });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = fileName;
 document.body.appendChild(link);
 link.click();
 link.remove();
 URL.revokeObjectURL(url);
}

function fileDate() {
 return new Date().toISOString().slice(0, 10);
}

function paymentStatusLabel(status: PlayerPaymentStatus) {
 const labels: Record<PlayerPaymentStatus, string> = {
  unpaid: "Chưa đóng",
  partial: "Đóng một phần",
  paid: "Đã đóng đủ",
  overpaid: "Đóng dư",
 };

 return labels[status];
}

export function exportMembersCsv(snapshot: LocalDataSnapshot) {
 const balances = new Map<string, number>();

 for (const session of snapshot.sessions) {
  for (const player of session.players) {
   if (!player.member_id) continue;
   balances.set(
    player.member_id,
    (balances.get(player.member_id) ?? 0) + player.paid_amount - player.amount,
   );
  }
 }

 const rows = [...snapshot.members]
  .sort((a, b) => a.name.localeCompare(b.name, "vi"))
  .map((member) => [
   member.id,
   member.name,
   member.login_name,
   member.phone,
   member.note,
   member.active ? "Đang hoạt động" : "Ngưng hoạt động",
   balances.get(member.id) ?? 0,
   member.created_at,
   member.updated_at,
  ]);

 downloadTextFile(
  `goodminton-thanh-vien-${fileDate()}.csv`,
  buildCsv(
   [
    "ID",
    "Tên",
    "Tên đăng nhập",
    "Số điện thoại",
    "Ghi chú",
    "Trạng thái",
    "Số dư",
    "Ngày tạo",
    "Ngày cập nhật",
   ],
   rows,
  ),
  "text/csv;charset=utf-8",
 );
}

export function exportSessionsCsv(snapshot: LocalDataSnapshot) {
 const rows = [...snapshot.sessions]
  .sort((a, b) => b.date.localeCompare(a.date))
  .flatMap((session) =>
   session.players.map((player) => [
    session.id,
    session.date,
    player.id,
    player.member_id,
    player.member_name_snapshot,
    player.share_count,
    player.drink_shared ? "Có" : "Không",
    player.adjustment,
    player.amount,
    player.paid_amount,
    player.remainingAmount,
    player.balanceAmount,
    paymentStatusLabel(player.paymentStatus),
    session.court_fee,
    session.shuttlecock_unit_price,
    session.shuttlecock_quantity,
    session.shuttlecock_fee,
    session.drink_fee,
    session.other_fee,
    session.totalAmount,
    session.paidAmount,
    session.unpaidAmount,
    session.creditAmount,
    session.note,
    player.note,
   ]),
  );

 downloadTextFile(
  `goodminton-buoi-choi-${fileDate()}.csv`,
  buildCsv(
   [
    "Session ID",
    "Ngày",
    "Player ID",
    "Member ID",
    "Người chơi",
    "Tập suất",
    "Chia nước",
    "Điều chỉnh",
    "Phải đóng",
    "Đã nhận",
    "Còn nợ",
    "Dư",
    "Trạng thái đóng tiền",
    "Tiền sân",
    "Đơn giá cầu",
    "Số trái cầu",
    "Tiền cầu",
    "Tiền nước",
    "Phụ phí",
    "Tổng tiền buổi",
    "Đã nhận buổi",
    "Còn nợ buổi",
    "Dư buổi",
    "Ghi chú buổi",
    "Ghi chú người chơi",
   ],
   rows,
  ),
  "text/csv;charset=utf-8",
 );
}

export function exportLocalBackup(snapshot: LocalDataSnapshot) {
 downloadTextFile(
  `goodminton-backup-${fileDate()}.json`,
  JSON.stringify(snapshot, null, 2),
  "application/json;charset=utf-8",
 );
}
