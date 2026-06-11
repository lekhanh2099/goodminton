import Link from "next/link";

import { AdminBar } from "@/components/AdminBar";
import { NavTabs } from "@/components/NavTabs";
import { getCurrentMember, logoutMember } from "@/lib/data";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const currentMember = await getCurrentMember();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link className="flex items-center gap-3" href="/">
              <span className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-xl text-white shadow-sm">
                🏸
              </span>
              <span>
                <span className="block text-base font-black uppercase tracking-tight">Goodminton</span>
                <span className="block text-xs font-semibold text-slate-500">Quản lý đội cầu lông</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
              {currentMember ? (
                <>
                  <span className="font-semibold text-slate-600">
                    Xin chào, <span className="font-black text-slate-950">{currentMember.name}</span>
                  </span>
                  <form action={logoutMember}>
                    <button className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-700" type="submit">
                      Đăng xuất
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-700" href="/login">
                    Đăng nhập
                  </Link>
                  <Link className="rounded-xl bg-indigo-600 px-3 py-2 font-bold text-white" href="/register">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
          <NavTabs />
          <AdminBar />
          {process.env.NODE_ENV === "development" ? (
            <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              DB: Supabase
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
