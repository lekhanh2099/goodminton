import { isAdminUnlocked } from "@/lib/admin";
import { lockAdminAction, unlockAdminAction } from "@/lib/data";

export async function AdminBar({ compact = false }: { compact?: boolean }) {
 const isAdmin = await isAdminUnlocked();

 if (isAdmin) {
  return (
   <div
    className={
     compact
      ? "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
      : "card"
    }
   >
    <form
     action={lockAdminAction}
     className="flex items-center justify-between gap-3"
    >
     <span className="text-sm font-black text-emerald-700">
      Đã mở quyền thủ quỹ
     </span>

     <button
      className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
      type="submit"
     >
      Khóa lại
     </button>
    </form>
   </div>
  );
 }

 return (
  <div
   className={
    compact
     ? "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
     : "card"
   }
  >
   <form action={unlockAdminAction} className="flex flex-col gap-2 sm:flex-row">
    <label className="sr-only" htmlFor="admin-pin">
     Mã PIN thủ quỹ
    </label>

    <input
     className="input min-w-0 flex-1"
     id="admin-pin"
     name="pin"
     placeholder="Mã PIN thủ quỹ"
     type="password"
    />

    <button className="button-primary sm:w-auto" type="submit">
     Mở khóa
    </button>
   </form>
  </div>
 );
}
