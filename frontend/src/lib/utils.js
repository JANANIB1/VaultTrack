export const CATEGORY_EMOJI = {
  food:          "🍽",
  transport:     "🚌",
  entertainment: "🎬",
  shopping:      "🛍",
  health:        "💊",
  utilities:     "⚡",
  education:     "📚",
  travel:        "✈",
  other:         "📌",
};

export const catEmoji = (cat) =>
  CATEGORY_EMOJI[(cat ?? "").toLowerCase()] ?? "📌";

export const fmtINR = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

export const fmtDate = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const expenseDate = (e) => e.date ?? e.created_at ?? null;

/** Build a {month → total} map from a list of expenses */
export const buildMonthlyTrend = (expenses) => {
  const map = {};
  expenses.forEach((e) => {
    const d = new Date(expenseDate(e));
    if (isNaN(d)) return;
    const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    map[key] = (map[key] ?? 0) + Number(e.amount ?? 0);
  });
  return Object.entries(map).map(([month, amount]) => ({ month, amount }));
};