import { AppShell } from "@/components/AppShell";
import { RegisterForm } from "@/components/AuthForms";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AppShell>
      <RegisterForm />
    </AppShell>
  );
}
