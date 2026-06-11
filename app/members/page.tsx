import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { DbError } from "@/components/DbError";
import { SubmitButton } from "@/components/SubmitButton";
import { isAdminUnlocked } from "@/lib/admin";
import {
 createMember,
 deactivateMember,
 getAllMembers,
 getCurrentMember,
 updateMember,
} from "@/lib/data";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function MembersPage() {
 const currentMember = await getCurrentMember();

 if (!currentMember) {
  redirect("/login");
 }

 const isAdmin = await isAdminUnlocked();
 let members;

 try {
  members = await getAllMembers();
 } catch (error) {
  return (
   <AppShell>
    <DbError error={error} />
   </AppShell>
  );
 }
 const visibleMembers = isAdmin
  ? members
  : members.filter((member) => member.active);

 return (
  <AppShell>
   {isAdmin ? (
    <section className="card">
     <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-black tracking-tight text-slate-950">
       Thành viên
      </h1>
      <Link className="button-secondary" href="/register">
       Đăng ký thành viên
      </Link>
     </div>
     <form
      action={createMember}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
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
      <div className="flex items-end">
       <SubmitButton className="button-primary w-full">Lưu</SubmitButton>
      </div>
     </form>
    </section>
   ) : null}

   <section className="card">
    {!isAdmin ? (
     <div className="mb-4 flex justify-end">
      <Link className="button-secondary" href="/register">
       Đăng ký thành viên
      </Link>
     </div>
    ) : null}
    <div className="flex flex-col gap-3">
     {visibleMembers.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
       Chưa có thành viên.
      </p>
     ) : (
      visibleMembers.map((member) => (
       <div className="rounded-2xl border border-slate-200 p-4" key={member.id}>
        {isAdmin ? (
         <form
          action={updateMember}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
         >
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
          <label className="field-label">
           Ghi chú
           <input
            className="input"
            defaultValue={member.note ?? ""}
            name="note"
           />
          </label>
          <div className="flex items-end">
           <SubmitButton className="button-secondary w-full">
            Chỉnh sửa
           </SubmitButton>
          </div>
         </form>
        ) : (
         <div>
          <div className="font-black text-slate-950">{member.name}</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">
           {member.phone ?? "Chưa có số điện thoại"}
          </div>
          {member.note ? (
           <div className="mt-2 text-sm text-slate-600">{member.note}</div>
          ) : null}
         </div>
        )}
        {isAdmin ? (
         <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <MemberStatusBadge active={member.active} />
          {member.active ? (
           <form action={deactivateMember}>
            <input name="id" type="hidden" value={member.id} />
            <button className="text-sm font-black text-rose-600" type="submit">
             Xóa
            </button>
           </form>
          ) : null}
         </div>
        ) : null}
       </div>
      ))
     )}
    </div>
   </section>
  </AppShell>
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
