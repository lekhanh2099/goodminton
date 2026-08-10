"use client";

import Link from "next/link";
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
 clearLocalData,
 exportLocalBackup,
 exportMembersCsv,
 exportSessionsCsv,
 importLocalData,
 LOCAL_DATA_UPDATED_EVENT,
 readLocalData,
 type LocalDataSnapshot,
} from "@/lib/local-data";
import type { PlayerPaymentStatus, SessionSummary } from "@/lib/types";

type LocalView = "dashboard" | "sessions" | "members" | "backup";

type MemberBalance = {
 key: string;
 name: string;
 balance: number;
};

function formatCurrency(value: number) {
 return new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
 }).format(value);
}

function formatDate(value: string) {
 const [year, month, day] = value.split("-").map(Number);
 if (!year || !month || !day) return value;
 return new Intl.DateTimeFormat("vi-VN").format(new Date(year, month - 1, day));
}

function formatUpdatedAt(value: string) {
 const date = new Date(value);
 if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Chưa có snapshot";

 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
 }).format(date);
}

function buildBalances(snapshot: LocalDataSnapshot): MemberBalance[] {
 const balances = new Map<string, MemberBalance>();

 for (const session of snapshot.sessions) {
  for (const player of session.players) {
   const key = player.member_id ?? `guest:${player.member_name_snapshot}`;
   const current = balances.get(key) ?? {
    key,
    name: player.member_name_snapshot,
    balance: 0,
   };

   current.balance += player.paid_amount - player.amount;
   balances.set(key, current);
  }
 }

 return Array.from(balances.values()).sort((a, b) => a.balance - b.balance);
}

function paymentLabel(status: PlayerPaymentStatus) {
 const labels: Record<PlayerPaymentStatus, string> = {
  unpaid: "Chưa đóng",
  partial: "Đóng một phần",
  paid: "Đã đủ",
  overpaid: "Đóng dư",
 };
 return labels[status];
}

export function LocalWorkspace({ offline = false }: { offline?: boolean }) {
 const [snapshot, setSnapshot] = useState<LocalDataSnapshot | null>(null);
 const [view, setView] = useState<LocalView>("dashboard");
 const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
 const [sessionQuery, setSessionQuery] = useState("");
 const [sessionMonth, setSessionMonth] = useState("");
 const [memberQuery, setMemberQuery] = useState("");
 const [message, setMessage] = useState("");

 const refresh = useCallback(() => {
  setSnapshot(readLocalData());
 }, []);

 useEffect(() => {
  refresh();
  window.addEventListener("storage", refresh);
  window.addEventListener(LOCAL_DATA_UPDATED_EVENT, refresh);

  return () => {
   window.removeEventListener("storage", refresh);
   window.removeEventListener(LOCAL_DATA_UPDATED_EVENT, refresh);
  };
 }, [refresh]);

 const balances = useMemo(() => (snapshot ? buildBalances(snapshot) : []), [snapshot]);

 if (!snapshot) {
  return (
   <section className="card">
    <p className="text-sm font-semibold text-slate-500">Đang đọc dữ liệu trên thiết bị...</p>
   </section>
  );
 }

 const hasData = snapshot.members.length > 0 || snapshot.sessions.length > 0;
 const selectedSession = selectedSessionId
  ? snapshot.sessions.find((session) => session.id === selectedSessionId) ?? null
  : null;

 const totalAmount = snapshot.sessions.reduce((sum, session) => sum + session.totalAmount, 0);
 const totalPaid = snapshot.sessions.reduce((sum, session) => sum + session.paidAmount, 0);
 const totalUnpaid = snapshot.sessions.reduce((sum, session) => sum + session.unpaidAmount, 0);

 const normalizedSessionQuery = sessionQuery.trim().toLowerCase();
 const filteredSessions = [...snapshot.sessions]
  .filter((session) => !sessionMonth || session.date.startsWith(sessionMonth))
  .filter(
   (session) =>
    !normalizedSessionQuery ||
    session.players.some((player) =>
     player.member_name_snapshot.toLowerCase().includes(normalizedSessionQuery),
    ),
  )
  .sort((a, b) => b.date.localeCompare(a.date));

 const normalizedMemberQuery = memberQuery.trim().toLowerCase();
 const balanceByMemberId = new Map(balances.map((item) => [item.key, item.balance]));
 const filteredMembers = [...snapshot.members]
  .filter((member) => {
   if (!normalizedMemberQuery) return true;
   return [member.name, member.login_name, member.phone, member.note]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(normalizedMemberQuery));
  })
  .sort((a, b) => a.name.localeCompare(b.name, "vi"));

 async function handleImport(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
   const imported = importLocalData(await file.text());
   setSnapshot(imported);
   setMessage("Đã nhập backup vào thiết bị này. Supabase không bị thay đổi.");
  } catch (error) {
   setMessage(error instanceof Error ? error.message : "Không thể đọc file backup.");
  }
 }

 function handleClear() {
  if (!window.confirm("Xóa toàn bộ snapshot local trên thiết bị này? Dữ liệu Supabase không bị ảnh hưởng.")) {
   return;
  }

  clearLocalData();
  setSelectedSessionId(null);
  setSnapshot(readLocalData());
  setMessage("Đã xóa dữ liệu local.");
 }

 return (
  <div className="flex flex-col gap-5">
   <section
    className={
     offline
      ? "rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-6"
      : "rounded-3xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm sm:p-6"
    }
   >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
     <div>
      <p className={`text-xs font-black uppercase tracking-wide ${offline ? "text-amber-700" : "text-indigo-600"}`}>
       {offline ? "Supabase unavailable · Local mode" : "Local snapshot"}
      </p>
      <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950">
       {offline ? "Đang dùng dữ liệu trên thiết bị" : "Dữ liệu trên thiết bị"}
      </h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-600">
       {offline
        ? "App đang ở chế độ chỉ đọc vì backend không phản hồi. Bạn vẫn xem được tổng quan, buổi chơi, thành viên và xuất backup. Các thao tác ghi bị khóa để tránh tạo hai nguồn dữ liệu khác nhau."
        : "Đây là bản sao local gần nhất lấy từ Supabase. Supabase vẫn là nguồn dữ liệu chính; local dùng để xem lại, cứu dữ liệu và xuất file khi backend tạm ngưng."}
      </p>
     </div>

     <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">Snapshot gần nhất</div>
      <div className="mt-1 font-black text-slate-800">{formatUpdatedAt(snapshot.updatedAt)}</div>
      {offline ? (
       <button
        className="mt-2 text-xs font-black text-indigo-600"
        onClick={() => window.location.reload()}
        type="button"
       >
        Thử kết nối lại
       </button>
      ) : null}
     </div>
    </div>
   </section>

   {!hasData ? (
    <section className="card">
     <h2 className="text-lg font-black text-slate-950">Chưa có dữ liệu local</h2>
     <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
      Thiết bị này chưa từng lưu snapshot. Khi Supabase hoạt động lại, mở Tổng quan một lần để app tạo bản local. Nếu có file JSON từ thiết bị khác, bạn vẫn có thể nhập ở mục Sao lưu.
     </p>
     <button className="button-secondary mt-4" onClick={() => setView("backup")} type="button">
      Mở Sao lưu
     </button>
    </section>
   ) : null}

   <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
    <LocalTab active={view === "dashboard"} label="Tổng quan" onClick={() => { setView("dashboard"); setSelectedSessionId(null); }} />
    <LocalTab active={view === "sessions"} label="Buổi chơi" onClick={() => { setView("sessions"); setSelectedSessionId(null); }} />
    <LocalTab active={view === "members"} label="Thành viên" onClick={() => { setView("members"); setSelectedSessionId(null); }} />
    <LocalTab active={view === "backup"} label="Sao lưu" onClick={() => { setView("backup"); setSelectedSessionId(null); }} />
   </nav>

   {selectedSession ? (
    <SessionDetail
     session={selectedSession}
     onBack={() => setSelectedSessionId(null)}
    />
   ) : null}

   {!selectedSession && view === "dashboard" ? (
    <>
     <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Tổng buổi chơi" value={String(snapshot.sessions.length)} />
      <Metric label="Tổng tiền" value={formatCurrency(totalAmount)} />
      <Metric label="Đã nhận" value={formatCurrency(totalPaid)} />
      <Metric label="Còn nợ" value={formatCurrency(totalUnpaid)} tone="danger" />
     </section>

     <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="card">
       <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">Buổi chơi gần đây</h2>
        <button className="text-sm font-black text-indigo-600" onClick={() => setView("sessions")} type="button">
         Xem tất cả
        </button>
       </div>
       <div className="flex flex-col gap-3">
        {[...snapshot.sessions]
         .sort((a, b) => b.date.localeCompare(a.date))
         .slice(0, 6)
         .map((session) => (
          <SessionRow key={session.id} session={session} onOpen={() => setSelectedSessionId(session.id)} />
         ))}
        {snapshot.sessions.length === 0 ? <EmptyState text="Chưa có buổi chơi trong snapshot." /> : null}
       </div>
      </div>

      <div className="card">
       <h2 className="mb-4 text-lg font-black text-slate-950">Số dư thành viên</h2>
       <div className="flex flex-col gap-2">
        {balances.slice(0, 10).map((item) => (
         <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3" key={item.key}>
          <span className="font-black text-slate-900">{item.name}</span>
          <BalanceValue balance={item.balance} />
         </div>
        ))}
        {balances.length === 0 ? <EmptyState text="Chưa có số dư phát sinh." /> : null}
       </div>
      </div>
     </section>
    </>
   ) : null}

   {!selectedSession && view === "sessions" ? (
    <section className="card">
     <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
       <h2 className="text-lg font-black text-slate-950">Buổi chơi</h2>
       <p className="mt-1 text-sm font-semibold text-slate-500">Dữ liệu read-only từ snapshot gần nhất.</p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{filteredSessions.length} buổi</span>
     </div>

     <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="field-label">
       Tìm người chơi
       <input className="input" onChange={(event) => setSessionQuery(event.target.value)} placeholder="Tên người chơi" value={sessionQuery} />
      </label>
      <label className="field-label">
       Tháng
       <input className="input" onChange={(event) => setSessionMonth(event.target.value)} type="month" value={sessionMonth} />
      </label>
     </div>

     <div className="mt-4 flex flex-col gap-3">
      {filteredSessions.map((session) => (
       <SessionRow key={session.id} session={session} onOpen={() => setSelectedSessionId(session.id)} />
      ))}
      {filteredSessions.length === 0 ? <EmptyState text="Không có buổi chơi phù hợp." /> : null}
     </div>
    </section>
   ) : null}

   {!selectedSession && view === "members" ? (
    <section className="card">
     <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
       <h2 className="text-lg font-black text-slate-950">Thành viên</h2>
       <p className="mt-1 text-sm font-semibold text-slate-500">Thông tin snapshot, không chứa mã PIN.</p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{filteredMembers.length} người</span>
     </div>

     <label className="field-label mt-4">
      Tìm thành viên
      <input className="input" onChange={(event) => setMemberQuery(event.target.value)} placeholder="Tên, username, SĐT..." value={memberQuery} />
     </label>

     <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {filteredMembers.map((member) => {
       const balance = balanceByMemberId.get(member.id) ?? 0;
       return (
        <article className="rounded-2xl border border-slate-200 p-4" key={member.id}>
         <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
           <h3 className="truncate font-black text-slate-950">{member.name}</h3>
           <div className="mt-1 text-xs font-bold text-slate-500">
            {member.active ? "Đang hoạt động" : "Ngưng hoạt động"}
            {member.login_name ? ` · @${member.login_name}` : ""}
           </div>
          </div>
          <BalanceValue balance={balance} />
         </div>
         <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Số điện thoại" value={member.phone ?? "—"} />
          <Info label="Ghi chú" value={member.note ?? "—"} />
         </div>
        </article>
       );
      })}
      {filteredMembers.length === 0 ? <EmptyState text="Không có thành viên phù hợp." /> : null}
     </div>
    </section>
   ) : null}

   {!selectedSession && view === "backup" ? (
    <section className="card">
     <h2 className="text-lg font-black text-slate-950">Sao lưu và xuất dữ liệu</h2>
     <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
      CSV có BOM UTF-8 để mở bằng Excel. JSON dùng để backup/khôi phục snapshot local. Import không ghi lên Supabase.
     </p>

     <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <button className="button-primary" disabled={snapshot.members.length === 0} onClick={() => exportMembersCsv(snapshot)} type="button">
       Xuất thành viên CSV
      </button>
      <button className="button-primary" disabled={snapshot.sessions.length === 0} onClick={() => exportSessionsCsv(snapshot)} type="button">
       Xuất buổi chơi CSV
      </button>
      <button className="button-secondary" disabled={!hasData} onClick={() => exportLocalBackup(snapshot)} type="button">
       Backup JSON
      </button>
     </div>

     <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
      <label className="button-secondary cursor-pointer text-center">
       Nhập backup JSON
       <input accept="application/json,.json" className="sr-only" onChange={handleImport} type="file" />
      </label>
      <button className="button-secondary text-rose-600" disabled={!hasData} onClick={handleClear} type="button">
       Xóa snapshot local
      </button>
      {!offline ? (
       <Link className="button-secondary text-center" href="/">
        Về app online
       </Link>
      ) : null}
     </div>

     {message ? <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</p> : null}
    </section>
   ) : null}
  </div>
 );
}

function LocalTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
 return (
  <button
   className={
    active
     ? "min-h-10 rounded-full border border-indigo-300 bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-sm"
     : "min-h-10 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
   }
   onClick={onClick}
   type="button"
  >
   {label}
  </button>
 );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
 return (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{label}</div>
   <div className={`mt-2 break-words text-xl font-black tracking-tight ${tone === "danger" ? "text-rose-600" : "text-slate-950"}`}>
    {value}
   </div>
  </div>
 );
}

function SessionRow({ session, onOpen }: { session: SessionSummary; onOpen: () => void }) {
 return (
  <button className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50" onClick={onOpen} type="button">
   <div className="flex items-start justify-between gap-3">
    <div>
     <div className="font-black text-slate-950">{formatDate(session.date)}</div>
     <div className="mt-1 text-xs font-bold text-slate-500">{session.playerCount} người chơi</div>
    </div>
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${session.unpaidAmount > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
     {session.unpaidAmount > 0 ? "Còn nợ" : "Đã đủ"}
    </span>
   </div>
   <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
    <Amount label="Tổng" value={session.totalAmount} />
    <Amount label="Đã nhận" value={session.paidAmount} />
    <Amount label="Còn nợ" value={session.unpaidAmount} danger={session.unpaidAmount > 0} />
   </div>
  </button>
 );
}

function SessionDetail({ session, onBack }: { session: SessionSummary; onBack: () => void }) {
 return (
  <div className="flex flex-col gap-5">
   <section className="card">
    <div className="flex items-start justify-between gap-3">
     <div>
      <button className="text-sm font-black text-indigo-600" onClick={onBack} type="button">← Quay lại</button>
      <h2 className="mt-2 text-xl font-black text-slate-950">Buổi chơi {formatDate(session.date)}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{session.note ?? "Không có ghi chú"}</p>
     </div>
     <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Chỉ đọc</span>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
     <AmountBox label="Tiền sân" value={session.court_fee} />
     <AmountBox label="Tiền cầu" value={session.shuttlecock_fee} />
     <AmountBox label="Tiền nước" value={session.drink_fee} />
     <AmountBox label="Phụ phí" value={session.other_fee} />
    </div>
   </section>

   <section className="card">
    <h3 className="mb-4 text-lg font-black text-slate-950">Người chơi</h3>
    <div className="flex flex-col gap-3">
     {session.players.map((player) => (
      <div className="rounded-2xl border border-slate-200 p-4" key={player.id}>
       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
         <div className="font-black text-slate-950">{player.member_name_snapshot}</div>
         <div className="mt-1 text-xs font-bold text-slate-500">
          Tập suất {player.share_count} · {player.drink_shared ? "Có chia nước" : "Không chia nước"} · {paymentLabel(player.paymentStatus)}
         </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm sm:min-w-[330px]">
         <Amount label="Phải đóng" value={player.amount} />
         <Amount label="Đã nhận" value={player.paid_amount} />
         <Amount label="Còn nợ" value={player.remainingAmount} danger={player.remainingAmount > 0} />
        </div>
       </div>
      </div>
     ))}
    </div>
   </section>
  </div>
 );
}

function Amount({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
 return (
  <div>
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</div>
   <div className={`mt-1 font-black ${danger ? "text-rose-600" : "text-slate-800"}`}>{formatCurrency(value)}</div>
  </div>
 );
}

function AmountBox({ label, value }: { label: string; value: number }) {
 return (
  <div className="rounded-2xl bg-slate-50 p-3">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
   <div className="mt-1 font-black text-slate-950">{formatCurrency(value)}</div>
  </div>
 );
}

function BalanceValue({ balance }: { balance: number }) {
 if (balance < 0) return <span className="font-black text-rose-600">Nợ {formatCurrency(Math.abs(balance))}</span>;
 if (balance > 0) return <span className="font-black text-emerald-700">Dư {formatCurrency(balance)}</span>;
 return <span className="font-black text-slate-400">Đủ tiền</span>;
}

function Info({ label, value }: { label: string; value: string }) {
 return (
  <div className="rounded-xl bg-slate-50 p-3">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</div>
   <div className="mt-1 break-words font-semibold text-slate-700">{value}</div>
  </div>
 );
}

function EmptyState({ text }: { text: string }) {
 return <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">{text}</p>;
}
