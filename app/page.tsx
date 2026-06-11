import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { DbError } from "@/components/DbError";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentMember, getDashboardData } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { redirect } from "next/navigation";
import { getFunQuote } from "@/lib/fun-quote";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
 const funQuote = await getFunQuote();

 const currentMember = await getCurrentMember();

 if (!currentMember) {
  redirect("/login");
 }
 let data;

 try {
  data = await getDashboardData();
 } catch (error) {
  return (
   <AppShell>
    <DbError error={error} />
   </AppShell>
  );
 }

 return (
  <AppShell>
   <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
    <p className="mt-2 text-sm font-bold leading-relaxed text-indigo-950">
     “{funQuote.text}”
    </p>
   </section>
   <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <MetricCard label="Tổng buổi chơi" value={String(data.totalSessions)} />
    <MetricCard label="Tổng tiền" value={formatCurrency(data.totalAmount)} />
    <MetricCard label="Đã đóng" value={formatCurrency(data.totalPaid)} />
    <MetricCard
     label="Còn nợ"
     value={formatCurrency(data.totalUnpaid)}
     tone="danger"
    />
   </section>

   <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
    <div className="card">
     <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-lg font-black text-slate-950">Buổi chơi gần đây</h1>
      <Link className="text-sm font-black text-indigo-600" href="/sessions">
       Xem tất cả
      </Link>
     </div>
     <div className="flex flex-col gap-3">
      {data.recentSessions.length === 0 ? (
       <EmptyState text="Chưa có buổi chơi nào." />
      ) : (
       data.recentSessions.map((session) => (
        <Link
         className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
         href={`/sessions/${session.id}`}
         key={session.id}
        >
         <div className="flex items-start justify-between gap-3">
          <div>
           <div className="font-black text-slate-950">
            {formatDate(session.date)}
           </div>
           <div className="mt-1 text-sm font-semibold text-slate-500">
            {session.playerCount} người chơi
           </div>
          </div>
          <StatusBadge status={session.status} />
         </div>
         <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <Amount label="Tổng tiền" value={session.totalAmount} />
          <Amount label="Đã đóng" value={session.paidAmount} />
          <Amount label="Còn nợ" value={session.unpaidAmount} />
         </div>
        </Link>
       ))
      )}
     </div>
    </div>

    <div className="card">
     <h2 className="mb-4 text-lg font-black text-slate-950">
      Người chơi còn nợ
     </h2>
     <div className="flex flex-col gap-3">
      {data.unpaidPlayers.length === 0 ? (
       <EmptyState text="Không có khoản nợ nào." />
      ) : (
       data.unpaidPlayers.slice(0, 10).map((player) => (
        <Link
         className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 hover:bg-slate-50"
         href={`/sessions/${player.sessionId}`}
         key={player.id}
        >
         <span>
          <span className="block font-black text-slate-950">
           {player.member_name_snapshot}
          </span>
          <span className="block text-xs font-semibold text-slate-500">
           {formatDate(player.sessionDate)}
          </span>
         </span>
         <span className="font-black text-rose-600">
          {formatCurrency(player.amount)}
         </span>
        </Link>
       ))
      )}
     </div>
    </div>
   </section>
  </AppShell>
 );
}

function MetricCard({
 label,
 value,
 tone = "default",
}: {
 label: string;
 value: string;
 tone?: "default" | "danger";
}) {
 return (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
    {label}
   </div>
   <div
    className={`mt-2 break-words text-xl font-black tracking-tight sm:text-2xl ${tone === "danger" ? "text-rose-600" : "text-slate-950"}`}
   >
    {value}
   </div>
  </div>
 );
}
function Amount({ label, value }: { label: string; value: number }) {
 return (
  <div>
   <div className="text-xs font-bold text-slate-400">{label}</div>
   <div className="font-black text-slate-900">{formatCurrency(value)}</div>
  </div>
 );
}

function EmptyState({ text }: { text: string }) {
 return (
  <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
   {text}
  </p>
 );
}
