export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function monthInputValue(date = new Date()) {
  return date.toISOString().slice(0, 7);
}
