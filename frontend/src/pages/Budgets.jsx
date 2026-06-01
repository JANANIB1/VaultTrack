import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { api } from "../api";
import { fmtINR, catEmoji } from "../lib/utils";
import { Skeleton } from "../components/Skeleton";

function barColor(pct) {
  if (pct >= 100) return "var(--red-6)";
  if (pct >= 80)  return "var(--orange-6)";
  return "var(--green-7)";
}

function StatusBadge({ pct }) {
  if (pct >= 100) return (
    <span className="badge badge-red">
      <XCircle size={11} /> Over budget
    </span>
  );
  if (pct >= 80) return (
    <span className="badge badge-orange">
      <AlertTriangle size={11} /> Near limit
    </span>
  );
  return (
    <span className="badge badge-green">
      <CheckCircle size={11} /> On track
    </span>
  );
}

function BudgetCard({ budget, spent }) {
  const limit     = Number(budget.monthly_limit ?? 0);
  const rawPct    = limit > 0 ? (spent / limit) * 100 : 0;
  const clampPct  = Math.min(rawPct, 100);
  const remaining = Math.max(limit - spent, 0);
  const overBy    = rawPct >= 100 ? spent - limit : 0;
  const alertPct  = Math.round((budget.alert_threshold ?? 0.8) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div style={{
            width: 38, height: 38, borderRadius: "var(--r-sm)",
            background: "var(--border-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", flexShrink: 0,
          }}>
            {catEmoji(budget.category)}
          </div>
          <div>
            <div className="capitalize font-600" style={{ fontSize: "0.9rem" }}>
              {budget.category}
            </div>
            <div className="text-muted">Alert at {alertPct}%</div>
          </div>
        </div>
        <StatusBadge pct={rawPct} />
      </div>

      <div className="card-body">
        {/* Progress bar */}
        <div className="progress-bg mb-2" style={{ height: 8 }}>
          <div
            className="progress-fill"
            style={{ width: `${clampPct}%`, background: barColor(rawPct) }}
          />
        </div>

        {/* Labels under bar */}
        <div className="flex justify-between mb-5">
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--tx-muted)" }}>
            {fmtINR(spent)}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: barColor(rawPct), fontWeight: 600 }}>
            {rawPct.toFixed(1)}%
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--tx-muted)" }}>
            {fmtINR(limit)}
          </span>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          background: "var(--border)",
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
        }}>
          {[
            { label: "Spent",      value: fmtINR(spent),   color: "var(--tx)" },
            {
              label: rawPct >= 100 ? "Over by" : "Remaining",
              value: rawPct >= 100 ? fmtINR(overBy) : fmtINR(remaining),
              color: barColor(rawPct),
            },
            { label: "Limit",      value: fmtINR(limit),   color: "var(--tx)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--surface-2)", padding: "10px 12px", textAlign: "center" }}>
              <div className="text-muted" style={{ marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.84rem", fontWeight: 600, color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBudgets(), api.getSummary()])
      .then(([b, s]) => { setBudgets(b); setSummary(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const spendMap = Object.fromEntries(summary.map((s) => [s.category, Number(s.amount ?? 0)]));

  const totalLimit = budgets.reduce((s, b) => s + Number(b.monthly_limit ?? 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendMap[b.category] ?? 0), 0);
  const over       = budgets.filter((b) => (spendMap[b.category] ?? 0) > (b.monthly_limit ?? 0));
  const near       = budgets.filter((b) => {
    const pct = b.monthly_limit ? (spendMap[b.category] ?? 0) / b.monthly_limit : 0;
    return pct >= (b.alert_threshold ?? 0.8) && pct < 1;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Monthly limits</p>
          <h1 className="page-title">Budgets</h1>
        </div>
        <div className="flex items-center gap-2">
          {!loading && over.length > 0 && (
            <span className="badge badge-red"><XCircle size={11} /> {over.length} over</span>
          )}
          {!loading && near.length > 0 && (
            <span className="badge badge-orange"><AlertTriangle size={11} /> {near.length} near limit</span>
          )}
          {!loading && over.length === 0 && near.length === 0 && budgets.length > 0 && (
            <span className="badge badge-green"><CheckCircle size={11} /> All on track</span>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="stat-grid mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {loading ? (
          [1,2,3].map((i) => (
            <div key={i} className="stat-card">
              <Skeleton width={80} height={12} style={{ marginBottom: 10 }} />
              <Skeleton width={110} height={28} />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-label">Total Monthly Limit</div>
              <div className="stat-value">{fmtINR(totalLimit)}</div>
              <div className="stat-sub">{budgets.length} categories budgeted</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Spent So Far</div>
              <div className="stat-value green">{fmtINR(totalSpent)}</div>
              <div className="stat-sub">
                {totalLimit > 0 ? `${((totalSpent / totalLimit) * 100).toFixed(1)}% of limit used` : "—"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Remaining</div>
              <div className="stat-value">{fmtINR(Math.max(totalLimit - totalSpent, 0))}</div>
              <div className="stat-sub">
                {over.length > 0
                  ? `${over.length} categor${over.length > 1 ? "ies" : "y"} exceeded`
                  : "Within all limits"}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Budget cards */}
      {loading ? (
        <div className="grid-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card">
              <div className="card-body">
                <Skeleton height={130} />
              </div>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="empty-icon">◎</div>
          <p className="empty-title">No budgets configured</p>
          <p className="empty-sub">
            Add budget records via the{" "}
            <code style={{ fontSize: "0.8rem", background: "var(--border-soft)", padding: "2px 6px", borderRadius: 4 }}>
              /budgets
            </code>{" "}
            endpoint on your FastAPI backend.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {budgets.map((b) => (
            <BudgetCard key={b.category} budget={b} spent={spendMap[b.category] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}