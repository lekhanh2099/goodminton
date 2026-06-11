import { isAdminUnlocked } from "@/lib/admin";
import { lockAdminAction, unlockAdminAction } from "@/lib/data";

export async function AdminBar() {
  const isAdmin = await isAdminUnlocked();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {isAdmin ? (
        <form action={lockAdminAction} className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-emerald-700">Đã mở quyền thủ quỹ</span>
          <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" type="submit">
            Khóa lại
          </button>
        </form>
      ) : (
        <form action={unlockAdminAction} className="flex gap-2">
          <label className="sr-only" htmlFor="admin-pin">
            Mã PIN thủ quỹ
          </label>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            id="admin-pin"
            name="pin"
            placeholder="Mã PIN thủ quỹ"
            type="password"
          />
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" type="submit">
            Mở khóa
          </button>
        </form>
      )}
    </div>
  );
}
