import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdminUnlocked } from "@/lib/admin";
import {
 deleteSession,
 getCurrentMember,
 getSessionDetail,
 updatePlayerPaidStatus,
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const currentMember = await getCurrentMember();

 if (!currentMember) {
  redirect("/login");
 }
 const { id } = await params;
 const isAdmin = await isAdminUnlocked();
 let session;

 try {
  session = await getSessionDetail(id);
 } catch {
  notFound();
 }

 return (
  <AppShell>
   <section className="card">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
     <div>
      <h1 className="text-xl font-black tracking-tight text-slate-950">
       Buổi chơi {formatDate(session.date)}
      </h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">
       {session.note ?? "Không có ghi chú"}
      </p>
     </div>
     <StatusBadge status={session.status} />
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-4">
     <Cost label="Tiền sân" value={session.court_fee} />
     <Cost
      helper={
       session.shuttlecock_unit_price > 0 || session.shuttlecock_quantity > 0
        ? `${formatCurrency(session.shuttlecock_unit_price)} x ${session.shuttlecock_quantity}`
        : "Dữ liệu cũ"
      }
      label="Tiền cầu"
      value={session.shuttlecock_fee}
     />
     <Cost label="Tiền nước" value={session.drink_fee} />
     <Cost label="Phụ phí" value={session.other_fee} />
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
     <Cost label="Tổng tiền" value={session.totalAmount} strong />
     <Cost label="Đã đóng" value={session.paidAmount} />
     <Cost label="Còn nợ" value={session.unpaidAmount} />
    </div>
    {isAdmin ? (
     <div className="mt-5 flex flex-wrap gap-3">
      <Link className="button-secondary" href={`/sessions/${session.id}/edit`}>
       Chỉnh sửa
      </Link>
      <form action={deleteSession}>
       <input name="id" type="hidden" value={session.id} />
       <button className="button-secondary text-rose-600" type="submit">
        Xóa
       </button>
      </form>
     </div>
    ) : null}
   </section>

   <section className="card">
    <h2 className="mb-4 text-lg font-black text-slate-950">Người chơi</h2>
    <div className="flex flex-col gap-3">
     {session.players.map((player) => (
      <div className="rounded-2xl border border-slate-200 p-4" key={player.id}>
       <div className="flex items-start justify-between gap-3">
        <div>
         <div className="font-black text-slate-950">
          {player.member_name_snapshot}
         </div>
         <div className="mt-1 text-xs font-bold text-slate-500">
          Tập suất {Number(player.share_count)} ·{" "}
          {player.drink_shared ? "Có chia nước" : "Không chia nước"} · Phụ thu{" "}
          {formatCurrency(player.adjustment)}
         </div>
         {player.note ? (
          <div className="mt-2 text-sm font-medium text-slate-600">
           {player.note}
          </div>
         ) : null}
        </div>
        <div className="text-right">
         <div className="font-black text-slate-950">
          {formatCurrency(player.amount)}
         </div>
         <div
          className={`mt-1 text-xs font-black ${player.paid ? "text-emerald-700" : "text-rose-600"}`}
         >
          {player.paid ? "Đã đóng" : "Chưa đóng"}
         </div>
        </div>
       </div>
       {isAdmin ? (
        <form action={updatePlayerPaidStatus} className="mt-3">
         <input name="session_id" type="hidden" value={session.id} />
         <input name="player_id" type="hidden" value={player.id} />
         <input
          name="paid"
          type="hidden"
          value={player.paid ? "false" : "true"}
         />
         <button className="button-secondary w-full sm:w-auto" type="submit">
          {player.paid ? "Đánh dấu chưa đóng" : "Đánh dấu đã đóng"}
         </button>
        </form>
       ) : null}
      </div>
     ))}
    </div>
   </section>
  </AppShell>
 );
}

function Cost({
 label,
 value,
 strong = false,
 helper,
}: {
 label: string;
 value: number;
 strong?: boolean;
 helper?: string;
}) {
 return (
  <div className="rounded-2xl bg-slate-50 p-4">
   <div className="text-xs font-black uppercase tracking-wide text-slate-500">
    {label}
   </div>
   <div
    className={`mt-1 font-black ${strong ? "text-xl text-indigo-700" : "text-slate-950"}`}
   >
    {formatCurrency(value)}
   </div>
   {helper ? (
    <div className="mt-1 text-xs font-bold text-slate-400">{helper}</div>
   ) : null}
  </div>
 );
}
