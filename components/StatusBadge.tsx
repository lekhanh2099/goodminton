const labels = {
  paid: "Đã thu đủ",
  unpaid: "Còn nợ",
  partial: "Thu một phần",
};

const classes = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  unpaid: "bg-rose-50 text-rose-700 ring-rose-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function StatusBadge({ status }: { status: keyof typeof labels }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
