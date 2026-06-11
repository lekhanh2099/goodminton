import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { DbError } from "@/components/DbError";
import { StatusBadge } from "@/components/StatusBadge";
import { getSessions } from "@/lib/data";
import { formatCurrency, formatDate, monthInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; month?: string; unpaid?: string }>;
}) {
  const params = await searchParams;
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-black tracking-tight text-slate-950">Buổi chơi</h1>
          <Link className="button-primary" href="/sessions/new">
            Tạo buổi chơi
          </Link>
        </div>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <label className="field-label">
            Tìm người chơi
            <input className="input" defaultValue={params.q ?? ""} name="q" placeholder="Tên thành viên" />
          </label>
          <label className="field-label">
            Tháng
            <input className="input" defaultValue={params.month ?? monthInputValue()} name="month" type="month" />
          </label>
          <label className="flex items-end gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
            <input defaultChecked={params.unpaid === "1"} name="unpaid" type="checkbox" value="1" />
            Chỉ còn nợ
          </label>
          <div className="flex items-end">
            <button className="button-secondary w-full" type="submit">
              Lọc
            </button>
          </div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_0.7fr_0.8fr] gap-3 border-b border-slate-100 px-2 pb-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
          <span>Ngày</span>
          <span>Tổng tiền</span>
          <span>Đã đóng</span>
          <span>Còn nợ</span>
          <span>Người chơi</span>
          <span>Trạng thái</span>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {sessions.length === 0 ? (
            <p className="p-5 text-center text-sm font-semibold text-slate-500">Không có buổi chơi phù hợp.</p>
          ) : (
            sessions.map((session) => (
              <Link className="grid gap-2 px-2 py-4 hover:bg-slate-50 md:grid-cols-[1fr_1fr_1fr_1fr_0.7fr_0.8fr] md:items-center md:gap-3" href={`/sessions/${session.id}`} key={session.id}>
                <span className="font-black text-slate-950">{formatDate(session.date)}</span>
                <span className="font-semibold text-slate-700">{formatCurrency(session.totalAmount)}</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(session.paidAmount)}</span>
                <span className="font-semibold text-rose-700">{formatCurrency(session.unpaidAmount)}</span>
                <span className="text-sm font-semibold text-slate-600">{session.playerCount}</span>
                <span>
                  <StatusBadge status={session.status} />
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
