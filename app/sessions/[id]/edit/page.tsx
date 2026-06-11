import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { SessionForm } from "@/components/SessionForm";
import { isAdminUnlocked } from "@/lib/admin";
import { getMembers, getSessionDetail, updateSessionWithPlayers } from "@/lib/data";
import type { SessionFormState } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isAdmin = await isAdminUnlocked();
  const members = await getMembers();
  let session;

  try {
    session = await getSessionDetail(id);
  } catch {
    notFound();
  }

  async function updateAction(_: SessionFormState, formData: FormData): Promise<SessionFormState> {
    "use server";

    try {
      await updateSessionWithPlayers(formData);
      return { ok: true, message: "" };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Không thể cập nhật buổi chơi.",
      };
    }
  }

  return (
    <AppShell>
      {isAdmin ? (
        <SessionForm action={updateAction} members={members} session={session} title="Chỉnh sửa buổi chơi" />
      ) : (
        <section className="card">
          <h1 className="text-xl font-black text-slate-950">Chỉnh sửa buổi chơi</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Bạn cần mở khóa quyền thủ quỹ trước khi chỉnh sửa.</p>
        </section>
      )}
    </AppShell>
  );
}
