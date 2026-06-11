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
  </AppShell>
 );
}
