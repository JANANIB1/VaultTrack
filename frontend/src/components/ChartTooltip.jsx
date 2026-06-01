import { fmtINR } from "../lib/utils";

export function ChartTooltip({ active, payload, label, valuePrefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--tx)",
      borderRadius: "var(--r-sm)",
      padding: "9px 13px",
      fontFamily: "var(--mono)",
      fontSize: "0.78rem",
      color: "var(--bg)",
      boxShadow: "var(--sh-md)",
    }}>
      <div style={{ opacity: 0.5, marginBottom: 3, fontSize: "0.7rem" }}>
        {label ?? payload[0]?.payload?.category ?? payload[0]?.payload?.month}
      </div>
      <div style={{ fontWeight: 600 }}>
        {valuePrefix}{fmtINR(payload[0].value)}
      </div>
    </div>
  );
}