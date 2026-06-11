export function DbError({ error }: { error: unknown }) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm sm:p-6">
      <h1 className="text-lg font-black">Không thể tải dữ liệu từ Supabase</h1>
      <p className="mt-2 text-sm font-semibold">
        {error instanceof Error ? error.message : "Vui lòng kiểm tra cấu hình Supabase và thử lại."}
      </p>
    </section>
  );
}
