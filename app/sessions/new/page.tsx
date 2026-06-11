import { AppShell } from "@/components/AppShell";
import { DbError } from "@/components/DbError";
import { SessionForm } from "@/components/SessionForm";
import { isAdminUnlocked } from "@/lib/admin";
import { createSessionWithPlayers, getMembers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const isAdmin = await isAdminUnlocked();
  let members;

  try {
    members = await getMembers();
  } catch (error) {
    return (
      <AppShell>
        <DbError error={error} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {isAdmin ? (
        <SessionForm action={createSessionWithPlayers} members={members} title="Tạo buổi chơi" />
      ) : (
        <section className="card">
          <h1 className="text-xl font-black text-slate-950">Tạo buổi chơi</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Bạn cần mở khóa quyền thủ quỹ trước khi tạo buổi chơi.</p>
        </section>
      )}
    </AppShell>
  );
}
