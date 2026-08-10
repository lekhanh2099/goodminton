import Link from "next/link";

import { LocalDataCenter } from "@/components/LocalDataCenter";

export default function BackupPage() {
 return (
  <div className="min-h-screen bg-slate-50 text-slate-950">
   <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
     <Link className="flex min-w-0 items-center gap-3" href="/">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-xl text-white shadow-sm">
       🏸
      </span>
      <span className="min-w-0">
       <span className="block truncate text-base font-black uppercase tracking-tight">
        Goodminton
       </span>
       <span className="block text-xs font-semibold text-slate-500">
        Dữ liệu trên thiết bị
       </span>
      </span>
     </Link>

     <Link className="button-secondary" href="/">
      Về ứng dụng
     </Link>
    </div>
   </header>

   <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:py-6">
    <LocalDataCenter />
   </main>
  </div>
 );
}
