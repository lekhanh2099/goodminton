import Link from "next/link";

import { AdminBar } from "@/components/AdminBar";
import { NavTabs } from "@/components/NavTabs";
import { isAdminUnlocked } from "@/lib/admin";
import { getCurrentMember, logoutMember } from "@/lib/data";

export async function AppShell({ children }: { children: React.ReactNode }) {
 const currentMember = await getCurrentMember();
 const isAdmin = currentMember ? await isAdminUnlocked() : false;

 return (
  <div className="min-h-screen bg-slate-50 text-slate-950">
   <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
     <div className="flex items-start justify-between gap-3">
      <Link
       className="flex min-w-0 items-center gap-3"
       href={currentMember ? "/" : "/login"}
      >
       <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-xl text-white shadow-sm">
        🏸
       </span>

       <span className="min-w-0">
        <span className="block truncate text-base font-black uppercase tracking-tight">
         Goodminton
        </span>
        <span className="block max-w-[120px] text-xs font-semibold leading-snug text-slate-500 sm:max-w-none">
         Quản lý đội cầu lông
        </span>
       </span>
      </Link>

      <div className="flex shrink-0 flex-col items-end gap-2 text-sm sm:flex-row sm:items-center">
       {currentMember ? (
        <>
         <span className="max-w-[150px] truncate text-right text-sm font-semibold text-slate-600">
          Xin chào,{" "}
          <span className="font-black text-slate-950">
           {currentMember.name}
          </span>
         </span>

         <form action={logoutMember}>
          <button
           className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
           type="submit"
          >
           Đăng xuất
          </button>
         </form>
        </>
       ) : (
        <>
         <Link
          className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
          href="/login"
         >
          Đăng nhập
         </Link>

         <Link
          className="min-h-10 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"
          href="/register"
         >
          Đăng ký
         </Link>
        </>
       )}
      </div>
     </div>

     {currentMember ? <NavTabs isAdmin={isAdmin} /> : null}
     {currentMember ? <AdminBar compact /> : null}

     {process.env.NODE_ENV === "development" && currentMember ? (
      <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
       DB: Supabase
      </div>
     ) : null}
    </div>
   </header>

   <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:py-6">
    {children}
   </main>
  </div>
 );
}
