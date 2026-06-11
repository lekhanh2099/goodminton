import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { DbError } from "@/components/DbError";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdminUnlocked } from "@/lib/admin";
import { getSessions } from "@/lib/data";
import { formatCurrency, formatDate, monthInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
 searchParams,
}: {
 searchParams: Promise<{ q?: string; month?: string; unpaid?: string }>;
}) {
 const params = await searchParams;
 const isAdmin = await isAdminUnlocked();
 let sessions;

 try {
  sessions = await getSessions({
   memberName: params.q,
   month: params.month,
   unpaidOnly: params.unpaid === "1",
  });
 } catch (error) {
  return (
   <AppShell>
    <DbError error={error} />
   </AppShell>
  );
 }

 return (
  <AppShell>
   <section className="card">
    <div className="mb-4 flex items-start justify-between gap-3">
     <div>
      <h1 className="text-xl font-black tracking-tight text-slate-950">
       Buổi chơi
      </h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">
       Lọc theo người chơi, tháng hoặc khoản còn nợ.
      </p>
     </div>

     {isAdmin ? (
      <Link className="button-primary shrink-0 px-4" href="/sessions/new">
       Tạo buổi
      </Link>
     ) : null}
    </div>

    <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto] lg:items-end">
     <label className="field-label">
      Tìm người chơi
      <input
       className="input"
       defaultValue={params.q ?? ""}
       name="q"
       placeholder="Tên thành viên"
      />
     </label>

     <label className="field-label">
      Tháng
      <input
       className="input w-full"
       defaultValue={params.month ?? monthInputValue()}
       name="month"
       type="month"
      />
     </label>

     <div className="field-label">
      Trạng thái
      <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case tracking-normal text-slate-700 hover:bg-slate-50">
       <input
        className="size-4 rounded border-slate-300 accent-indigo-600"
        defaultChecked={params.unpaid === "1"}
        name="unpaid"
        type="checkbox"
        value="1"
       />
       Chỉ còn nợ
      </label>
     </div>

     <button className="button-secondary h-11 w-full" type="submit">
      Lọc
     </button>
    </form>
   </section>

   <section className="card">
    {sessions.length === 0 ? (
     <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
      Không có buổi chơi phù hợp.
     </p>
    ) : (
     <>
      <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_0.7fr_0.8fr] gap-3 border-b border-slate-100 px-2 pb-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
       <span>Ngày</span>
       <span>Tổng tiền</span>
       <span>Đã đóng</span>
       <span>Còn nợ</span>
       <span>Người chơi</span>
       <span>Trạng thái</span>
      </div>

      <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
       {sessions.map((session) => (
        <Link
         className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 md:grid md:rounded-none md:border-0 md:px-2 md:py-4 md:grid-cols-[1fr_1fr_1fr_1fr_0.7fr_0.8fr] md:items-center md:gap-3"
         href={`/sessions/${session.id}`}
         key={session.id}
        >
         <div className="mb-3 flex items-start justify-between gap-3 md:mb-0 md:block">
          <div>
           <div className="font-black text-slate-950">
            {formatDate(session.date)}
           </div>
           <div className="mt-1 text-sm font-semibold text-slate-500 md:hidden">
            {session.playerCount} người chơi
           </div>
          </div>

          <span className="md:hidden">
           <StatusBadge status={session.status} />
          </span>
         </div>

         <MobileAmount label="Tổng tiền" value={session.totalAmount} />
         <MobileAmount label="Đã đóng" value={session.paidAmount} tone="paid" />
         <MobileAmount
          label="Còn nợ"
          value={session.unpaidAmount}
          tone="debt"
         />

         <span className="hidden text-sm font-semibold text-slate-600 md:block">
          {session.playerCount}
         </span>

         <span className="hidden md:block">
          <StatusBadge status={session.status} />
         </span>
        </Link>
       ))}
      </div>
     </>
    )}
   </section>
  </AppShell>
 );
}

function MobileAmount({
 label,
 value,
 tone = "default",
}: {
 label: string;
 value: number;
 tone?: "default" | "paid" | "debt";
}) {
 const colorClass =
  tone === "paid"
   ? "text-emerald-700"
   : tone === "debt"
     ? "text-rose-700"
     : "text-slate-800";

 return (
  <div className="mt-2 flex items-center justify-between gap-3 md:mt-0 md:block">
   <span className="text-xs font-black uppercase tracking-wide text-slate-400 md:hidden">
    {label}
   </span>
   <span className={`font-black ${colorClass}`}>{formatCurrency(value)}</span>
  </div>
 );
}
