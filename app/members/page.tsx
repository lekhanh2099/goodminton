import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { DbError } from "@/components/DbError";
import { SubmitButton } from "@/components/SubmitButton";
import { isAdminUnlocked } from "@/lib/admin";
import {
 createMember,
 deactivateMember,
 getAllMembers,
 getCurrentMember,
 getDashboardData,
 updateMember,
} from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

type MembersPageProps = {
 searchParams?: Promise<{
  q?: string;
  status?: string;
  balance?: string;
 }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
 const currentMember = await getCurrentMember();

 if (!currentMember) {
  redirect("/login");
 }

 const params = searchParams ? await searchParams : {};
 const isAdmin = await isAdminUnlocked();

 let members: Member[];
 let dashboardData: Awaited<ReturnType<typeof getDashboardData>>;

 try {
  [members, dashboardData] = await Promise.all([
   getAllMembers(),
   getDashboardData(),
  ]);
 } catch (error) {
  return (
   <AppShell>
    <DbError error={error} />
   </AppShell>
  );
 }

 const balanceByMemberId = new Map(
  dashboardData.memberBalances.map((member) => [member.key, member.balance]),
 );

 const normalizedQuery = String(params.q ?? "")
  .trim()
  .toLowerCase();
 const statusFilter = params.status ?? "all";
 const balanceFilter = params.balance ?? "all";

 const baseMembers = isAdmin
  ? members
  : members.filter((member) => member.active);

 const filteredMembers = baseMembers.filter((member) => {
  const balance = balanceByMemberId.get(member.id) ?? 0;

  const matchesQuery =
   !normalizedQuery ||
   member.name.toLowerCase().includes(normalizedQuery) ||
   String(member.login_name ?? "")
    .toLowerCase()
    .includes(normalizedQuery) ||
   String(member.phone ?? "")
    .toLowerCase()
    .includes(normalizedQuery) ||
   String(member.note ?? "")
    .toLowerCase()
    .includes(normalizedQuery);

  const matchesStatus =
   statusFilter === "all" ||
   (statusFilter === "active" && member.active) ||
   (statusFilter === "inactive" && !member.active);

  const matchesBalance =
   balanceFilter === "all" ||
   (balanceFilter === "debt" && balance < 0) ||
   (balanceFilter === "credit" && balance > 0) ||
   (balanceFilter === "settled" && balance === 0);

  return matchesQuery && matchesStatus && matchesBalance;
 });

 const activeCount = baseMembers.filter((member) => member.active).length;
 const inactiveCount = baseMembers.filter((member) => !member.active).length;
 const debtCount = baseMembers.filter(
  (member) => (balanceByMemberId.get(member.id) ?? 0) < 0,
 ).length;
 const creditCount = baseMembers.filter(
  (member) => (balanceByMemberId.get(member.id) ?? 0) > 0,
 ).length;

 return (
  <AppShell>
   <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <SummaryCard label="Tổng thành viên" value={String(baseMembers.length)} />
    <SummaryCard label="Đang hoạt động" value={String(activeCount)} />
    <SummaryCard label="Đang nợ" value={String(debtCount)} tone="danger" />
    <SummaryCard label="Đang dư" value={String(creditCount)} tone="success" />
   </section>

   {isAdmin ? (
    <details className="card group">
     <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
      <div>
       <h1 className="text-xl font-black tracking-tight text-slate-950">
        Thành viên
       </h1>
       <p className="mt-1 text-sm font-semibold text-slate-500">
        Thêm thành viên mới hoặc tạo tài khoản đăng nhập đơn giản.
       </p>
      </div>

      <span className="button-primary shrink-0">
       <span className="group-open:hidden">+ Thêm</span>
       <span className="hidden group-open:inline">Đóng</span>
      </span>
     </summary>

     <form
      action={createMember}
      className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
     >
      <label className="field-label">
       Tên
       <input
        className="input"
        name="name"
        placeholder="Tên thành viên"
        required
       />
      </label>

      <label className="field-label">
       Tên đăng nhập
       <input className="input" name="login_name" placeholder="vd: khanh" />
      </label>

      <label className="field-label">
       Mã PIN
       <input
        className="input"
        name="pin_code"
        placeholder="Nếu cần đăng nhập"
        type="password"
       />
      </label>

      <label className="field-label">
       Số điện thoại
       <input className="input" name="phone" placeholder="090..." />
      </label>

      <label className="field-label">
       Ghi chú
       <input
        className="input"
        name="note"
        placeholder="Vai trò, lịch chơi..."
       />
      </label>

      <div className="sm:col-span-2 lg:col-span-5">
       <SubmitButton className="button-primary w-full sm:w-auto">
        Lưu thành viên
       </SubmitButton>
      </div>
     </form>
    </details>
   ) : (
    <section className="card">
     <div className="flex items-center justify-between gap-3">
      <div>
       <h1 className="text-xl font-black tracking-tight text-slate-950">
        Thành viên
       </h1>
       <p className="mt-1 text-sm font-semibold text-slate-500">
        Danh sách thành viên và số dư hiện tại.
       </p>
      </div>

      <Link className="button-secondary shrink-0" href="/register">
       Đăng ký
      </Link>
     </div>
    </section>
   )}

   <section className="card">
    <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto] lg:items-end">
     <label className="field-label">
      Tìm thành viên
      <input
       className="input"
       defaultValue={params.q ?? ""}
       name="q"
       placeholder="Tên, username, SĐT..."
      />
     </label>

     <label className="field-label">
      Trạng thái
      <select className="input" defaultValue={statusFilter} name="status">
       <option value="all">Tất cả</option>
       <option value="active">Đang hoạt động</option>
       {isAdmin ? <option value="inactive">Ngưng hoạt động</option> : null}
      </select>
     </label>

     <label className="field-label">
      Số dư
      <select className="input" defaultValue={balanceFilter} name="balance">
       <option value="all">Tất cả</option>
       <option value="debt">Còn nợ</option>
       <option value="credit">Đang dư</option>
       <option value="settled">Đủ tiền</option>
      </select>
     </label>

     <div className="grid grid-cols-2 gap-2 lg:flex">
      <button className="button-secondary h-11 w-full" type="submit">
       Lọc
      </button>
      <Link className="button-secondary h-11 w-full" href="/members">
       Xóa lọc
      </Link>
     </div>
    </form>
   </section>

   <section className="grid gap-3 lg:grid-cols-2">
    {filteredMembers.length === 0 ? (
     <div className="card lg:col-span-2">
      <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
       Không có thành viên phù hợp.
      </p>
     </div>
    ) : (
     filteredMembers.map((member) => {
      const balance = balanceByMemberId.get(member.id) ?? 0;

      return (
       <MemberCard
        balance={balance}
        isAdmin={isAdmin}
        key={member.id}
        member={member}
       />
      );
     })
    )}
   </section>
  </AppShell>
 );
}

function MemberCard({
 member,
 balance,
 isAdmin,
}: {
 member: Member;
 balance: number;
 isAdmin: boolean;
}) {
 return (
  <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
   <div className="flex items-start gap-3">
    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-base font-black text-indigo-700 ring-1 ring-indigo-100">
     {member.name.slice(0, 1).toUpperCase()}
    </div>

    <div className="min-w-0 flex-1">
     <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
       <h2 className="truncate text-base font-black text-slate-950">
        {member.name}
       </h2>

       <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <MemberStatusBadge active={member.active} />
        <BalanceBadge balance={balance} />
       </div>
      </div>

      <Link
       className="shrink-0 text-sm font-black text-indigo-600"
       href={`/sessions?q=${encodeURIComponent(member.name)}`}
      >
       Xem buổi chơi
      </Link>
     </div>

     <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <InfoLine label="Tên đăng nhập" value={member.login_name ?? "—"} />
      <InfoLine label="Số điện thoại" value={member.phone ?? "—"} />
      {member.note ? (
       <div className="rounded-2xl bg-slate-50 p-3 sm:col-span-2">
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
         Ghi chú
        </div>
        <div className="mt-1 font-semibold text-slate-700">{member.note}</div>
       </div>
      ) : null}
     </div>
    </div>
   </div>

   {isAdmin ? (
    <div className="mt-4 border-t border-slate-100 pt-3">
     <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 [&::-webkit-details-marker]:hidden">
       <span>Chỉnh sửa</span>
       <span className="text-xs text-slate-400 group-open:hidden">Mở</span>
       <span className="hidden text-xs text-slate-400 group-open:inline">
        Đóng
       </span>
      </summary>

      <form action={updateMember} className="mt-3 grid gap-3 sm:grid-cols-2">
       <input name="id" type="hidden" value={member.id} />

       <label className="field-label">
        Tên
        <input
         className="input"
         defaultValue={member.name}
         name="name"
         required
        />
       </label>

       <label className="field-label">
        Tên đăng nhập
        <input
         className="input"
         defaultValue={member.login_name ?? ""}
         name="login_name"
        />
       </label>

       <label className="field-label">
        Mã PIN mới
        <input
         className="input"
         name="pin_code"
         placeholder="Để trống nếu không đổi"
         type="password"
        />
       </label>

       <label className="field-label">
        Số điện thoại
        <input
         className="input"
         defaultValue={member.phone ?? ""}
         name="phone"
        />
       </label>

       <label className="field-label sm:col-span-2">
        Ghi chú
        <input className="input" defaultValue={member.note ?? ""} name="note" />
       </label>

       <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton className="button-primary w-full sm:w-auto">
         Lưu chỉnh sửa
        </SubmitButton>

        {member.active ? (
         <form action={deactivateMember}>
          <input name="id" type="hidden" value={member.id} />
          <button
           className="button-secondary w-full text-rose-600 sm:w-auto"
           type="submit"
          >
           Ngưng hoạt động
          </button>
         </form>
        ) : null}
       </div>
      </form>
     </details>
    </div>
   ) : null}
  </article>
 );
}

function SummaryCard({
 label,
 value,
 tone = "default",
}: {
 label: string;
 value: string;
 tone?: "default" | "danger" | "success";
}) {
 const valueClass =
  tone === "danger"
   ? "text-rose-600"
   : tone === "success"
     ? "text-emerald-700"
     : "text-slate-950";

 return (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
    {label}
   </div>
   <div className={`mt-2 text-xl font-black tracking-tight ${valueClass}`}>
    {value}
   </div>
  </div>
 );
}

function InfoLine({ label, value }: { label: string; value: string }) {
 return (
  <div className="rounded-2xl bg-slate-50 p-3">
   <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
    {label}
   </div>
   <div className="mt-1 truncate font-semibold text-slate-700">{value}</div>
  </div>
 );
}

function BalanceBadge({ balance }: { balance: number }) {
 if (balance > 0) {
  return (
   <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
    Dư {formatCurrency(balance)}
   </span>
  );
 }

 if (balance < 0) {
  return (
   <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-200">
    Còn nợ {formatCurrency(Math.abs(balance))}
   </span>
  );
 }

 return (
  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
   Đủ tiền
  </span>
 );
}

function MemberStatusBadge({ active }: { active: boolean }) {
 return (
  <span
   className={
    active
     ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200"
     : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200"
   }
  >
   {active ? "Đang hoạt động" : "Ngưng hoạt động"}
  </span>
 );
}
