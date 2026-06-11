import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentMember } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
 const currentMember = await getCurrentMember();

 if (currentMember) {
  redirect("/");
 }

 return (
  <AppShell>
   <RegisterForm />
  </AppShell>
 );
}
