import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { LocalDataSync } from "@/components/LocalDataSync";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdminUnlocked } from "@/lib/admin";
import {
 deleteSession,
 getCurrentMember,
 getSessionDetail,
 updatePlayerPaidAmount,
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PlayerPaymentStatus } from "@/lib/types";

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
   <LocalDataSync sessions={[session]} />

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
        ? `${formatCurrency(session.shuttlecock_unit_price)} × ${session.shuttlecock_quantity}`
        : "Dữ liệu cũ"
      }
      label="Tiền cầu"
      value={session.shuttlecock_fee}
     />
     <Cost label="Tiền nước" value={session.drink_fee} />
     <Cost label="Phụ phí" value={session.other_fee} />
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-4">
     <Cost label="Tổng tiền" value={session.totalAmount} strong />
     <Cost label="Đã nhận" value={session.paidAmount} />
     <Cost
      label="Còn nợ"
      value={session.unpaidAmount}
      danger={session.unpaidAmount > 0}
     />
     <Cost
      label="Tiền dư"
      value={session.creditAmount}
      success={session.creditAmount > 0}
     />
    </div>

    {isAdmin ? (
     <div className="mt-5 flex flex-wrap gap-3">
      <Link className="button-secondary" href={`/sessions/${session.id}/edit`}>
       Chỉnh sửa
      </Link>

      <form action={deleteSession}>
       <input name="id" type="hidden" value={session.id} />
       <ConfirmSubmitButton
        className="button-secondary text-rose-600"
        message={`Xóa buổi chơi ${formatDate(session.date)}? Hành động này sẽ xóa toàn bộ người chơi và dữ liệu đóng tiền của buổi này.`}
       >
        Xóa
       </ConfirmSubmitButton>
      </form>
     </div>
    ) : null}
   </section>

   <section className="card">
    <h2 className="mb-4 text-lg font-black text-slate-950">Người chơi</h2>

    <div className="flex flex-col gap-3">
     {session.players.map((player) => {
      const remainingAmount = Math.max(player.amount - player.paid_amount, 0);
      const creditAmount = Math.max(player.paid_amount - player.amount, 0);

      return (
       <div className="rounded-2xl border border-slate-200 p-4" key={player.id}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
         <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
           <div className="font-black text-slate-950">
            {player.member_name_snapshot}
           </div>
           <PlayerPaymentBadge status={player.paymentStatus} />
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

         <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[320px]">
          <PaymentAmount label="Phải đóng" value={player.amount} />
          <PaymentAmount label="Đã nhận" value={player.paid_amount} />
          <PaymentAmount
           label="Còn nợ"
           value={remainingAmount}
           tone={remainingAmount > 0 ? "danger" : "muted"}
          />
          <PaymentAmount
           label="Dư"
           value={creditAmount}
           tone={creditAmount > 0 ? "success" : "muted"}
          />
         </div>
        </div>

        {isAdmin ? (
         <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <form
           action={updatePlayerPaidAmount}
           className="grid gap-2 sm:grid-cols-[1fr_auto]"
          >
           <input name="session_id" type="hidden" value={session.id} />
           <input name="player_id" type="hidden" value={player.id} />

           <label className="field-label">
            Đã nhận
            <input
             className="input bg-white"
             defaultValue={player.paid_amount}
             inputMode="numeric"
             min={0}
             name="paid_amount"
             type="number"
            />
           </label>

           <div className="flex items-end">
            <button
             className="button-primary h-11 w-full sm:w-auto"
             type="submit"
            >
             Lưu
            </button>
           </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
           <QuickPaymentButton
            label="0 đ"
            paidAmount={0}
            playerId={player.id}
            sessionId={session.id}
           />
           <QuickPaymentButton
            label="Đủ"
            paidAmount={player.amount}
            playerId={player.id}
            sessionId={session.id}
           />
           <QuickPaymentButton
            label="+50k"
            paidAmount={player.paid_amount + 50_000}
            playerId={player.id}
            sessionId={session.id}
           />
           <QuickPaymentButton
            label="+100k"
            paidAmount={player.paid_amount + 100_000}
            playerId={player.id}
            sessionId={session.id}
           />
          </div>
         </div>
        ) : null}
       </div>
      );
     })}
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
 danger = false,
 success = false,
}: {
 label: string;
 value: number;
 strong?: boolean;
 helper?: string;
 danger?: boolean;
 success?: boolean;
}) {
 const valueClass = danger
  ? "text-rose-600"
  : success
    ? "text-emerald-700"
    : strong
      ? "text-indigo-700"
      : "text-slate-950";

 return (
  <div className="rounded-2xl bg-slate-50 p-4">
   <div className="text-xs font-black uppercase tracking-wide text-slate-500">
    {label}
   </div>
   <div className={`mt-1 font-black ${strong ? "text-xl" : ""} ${valueClass}`}>
    {formatCurrency(value)}
   </div>
   {helper ? (
    <div className="mt-1 text-xs font-bold text-slate-400">{helper}</div>
   ) : null}
  </div>
 );
}

function PaymentAmount({
 label,
 value,
 tone = "default",
}: {
 label: string;
 value: number;
 tone?: "default" | "danger" | "success" | "muted";
}) {
 const colorClass =
  tone === "danger"
   ? "text-rose-600"
   : tone === "success"
     ? "text-emerald-700"
     : tone === "muted"
       ? "text-slate-400"
       : "text-slate-950";

 return (
  <div className="rounded-xl bg-slate-50 p-3">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
    {label}
   </div>
   <div className={`mt-1 font-black ${colorClass}`}>
    {formatCurrency(value)}
   </div>
  </div>
 );
}

function PlayerPaymentBadge({ status }: { status: PlayerPaymentStatus }) {
 const config = {
  unpaid: {
   label: "Chưa đóng",
   className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  partial: {
   label: "Đóng một phần",
   className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  paid: {
   label: "Đã đóng đủ",
   className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  overpaid: {
   label: "Đóng dư",
   className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
 } satisfies Record<PlayerPaymentStatus, { label: string; className: string }>;

 return (
  <span
   className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${config[status].className}`}
  >
   {config[status].label}
  </span>
 );
}

function QuickPaymentButton({
 label,
 paidAmount,
 playerId,
 sessionId,
}: {
 label: string;
 paidAmount: number;
 playerId: string;
 sessionId: string;
}) {
 return (
  <form action={updatePlayerPaidAmount}>
   <input name="session_id" type="hidden" value={sessionId} />
   <input name="player_id" type="hidden" value={playerId} />
   <input name="paid_amount" type="hidden" value={paidAmount} />
   <button
    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100"
    type="submit"
   >
    {label}
   </button>
  </form>
 );
}
