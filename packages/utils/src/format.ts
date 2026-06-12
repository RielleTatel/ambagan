export function formatCurrency(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(date));
}
