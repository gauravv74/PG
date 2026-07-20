const symbols: Record<string, string> = { INR: "₹", GBP: "£", USD: "$", AUD: "A$", EUR: "€" };

export function money(amount?: number | null, currency = "INR"): string {
  if (amount == null) return "—";
  const sym = symbols[currency] ?? currency + " ";
  return `${sym}${Math.round(amount).toLocaleString("en-IN")}`;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
