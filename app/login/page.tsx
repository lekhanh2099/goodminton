import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentMember } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
 const currentMember = await getCurrentMember();

 if (currentMember) {
  redirect("/");
 }

 return (
  <AppShell>
   <LoginForm />
   <section className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
    <p className="text-sm font-semibold text-slate-500">
     Không vào được Supabase nhưng cần lấy dữ liệu đã lưu trên máy?
    </p>
    <Link className="mt-3 inline-flex text-sm font-black text-indigo-600" href="/backup">
     Mở dữ liệu local
    </Link>
   </section>
  </AppShell>
 );
}
