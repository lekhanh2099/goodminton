import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/AuthForms";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AppShell>
      <LoginForm />
    </AppShell>
  );
}
