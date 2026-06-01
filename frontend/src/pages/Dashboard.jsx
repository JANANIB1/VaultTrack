import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
  PieChart, Pie,
} from "recharts";
import { TrendingUp, Layers, Hash, BarChart2 } from "lucide-react";
import { api } from "../api";
import { fmtINR, fmtDate, catEmoji, buildMonthlyTrend, expenseDate } from "../lib/utils";
import { Skeleton, SkeletonStatCard, SkeletonRow } from "../components/Skeleton";
import { ChartTooltip } from "../components/ChartTooltip";

const GREEN_SCALE = ["#14532d","#166534","#15803d","#16a34a","#22c55e","#4ade80"];

const now = new Date();
const periodStr = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
const dateStr   = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** Animated counter */
function Counter({ target, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const steps = 40;
    const step  = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.round(cur));
      if (cur >= target) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [target]);
  return <>{prefix}{val.toLocaleString("en-IN")}{suffix}</>;
}

export default function Dashboard() {
  const [summary,  setSummary]  = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getExpenses()])
      .then(([s, e]) => { setSummary(s); setExpenses(e); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalSpent     = useMemo(() => summary.reduce((s, i) => s + Number(i.amount ?? 0), 0), [summary]);
  const txCount        = expenses.length;
  const catCount       = summary.length;
  const avgTx          = txCount > 0 ? Math.round(totalSpent / txCount) : 0;
  const topCat         = summary.length ? summary.reduce((mx, i) => i.amount > mx.amount ? i : mx) : null;
  const trend          = useMemo(() => buildMonthlyTrend(expenses), [expenses]);
  const recent         = useMemo(() => [...expenses].sort((a, b) => new Date(expenseDate(b)) - new Date(expenseDate(a))).slice(0, 8), [expenses]);

  const isEmpty = !loading && summary.length === 0;

  if (error) return (
    <div className="page">
      <div className="empty" style={{ marginTop: 64 }}>
        <div className="empty-icon">⚠</div>
        <p className="empty-title">Failed to load data</p>
        <p className="empty-sub">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Overview · {periodStr}</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "0.75rem", color: "var(--tx-muted)", fontFamily: "var(--mono)" }}>
            {dateStr}
          </span>
          <div className="live-pill"><span className="pulse-dot" />Live</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="empty" style={{ marginTop: 64 }}>
          <div className="empty-icon">₹</div>
          <p className="empty-title">No expense data yet</p>
          <p className="empty-sub">Use the AI Assistant to log your first expense via Dialogflow.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-grid mb-6">
            {loading ? (
              [1,2,3,4].map((i) => <SkeletonStatCard key={i} />)
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-label">
                    <TrendingUp size={13} /> Total Spending
                  </div>
                  <div className="stat-value green">
                    <Counter target={totalSpent} prefix="₹" />
                  </div>
                  <div className="stat-sub">{catCount} categories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">
                    <Hash size={13} /> Transactions
                  </div>
                  <div className="stat-value">
                    <Counter target={txCount} />
                  </div>
                  <div className="stat-sub">All recorded entries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">
                    <Layers size={13} /> Categories
                  </div>
                  <div className="stat-value">
                    <Counter target={catCount} />
                  </div>
                  <div className="stat-sub">Unique spending areas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">
                    <BarChart2 size={13} /> Avg Transaction
                  </div>
                  <div className="stat-value">
                    <Counter target={avgTx} prefix="₹" />
                  </div>
                  <div className="stat-sub">Per transaction</div>
                </div>
              </>
            )}
          </div>

          {/* Charts row */}
          <div className="grid-2 mb-6">
            {/* Pie chart */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Expense Breakdown</h2>
                {topCat && (
                  <span className="badge badge-green capitalize">
                    Top: {topCat.category}
                  </span>
                )}
              </div>
              <div className="card-body">
                {loading ? <Skeleton height={220} /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={summary}
                        dataKey="amount"
                        nameKey="category"
                        outerRadius={88}
                        innerRadius={48}
                        paddingAngle={3}
                      >
                        {summary.map((_, i) => (
                          <Cell key={i} fill={GREEN_SCALE[i % GREEN_SCALE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {!loading && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
                    {summary.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem" }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: GREEN_SCALE[i % GREEN_SCALE.length], flexShrink: 0,
                        }} />
                        <span className="capitalize" style={{ color: "var(--tx-3)" }}>{item.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Line chart */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Monthly Trend</h2>
              </div>
              <div className="card-body">
                {loading ? <Skeleton height={220} /> :
                  trend.length > 1 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={trend} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "var(--tx-muted)", fontFamily: "var(--mono)" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--tx-muted)", fontFamily: "var(--mono)" }}
                          tickFormatter={(v) => `₹${v}`}
                          width={60}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="var(--green-7)"
                          strokeWidth={2}
                          dot={{ fill: "var(--green-7)", r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty" style={{ padding: "40px 16px" }}>
                      <p className="empty-sub">Log expenses across multiple months to see a trend.</p>
                    </div>
                  )
                }
              </div>
            </div>
          </div>

          {/* Category bar + recent transactions */}
          <div className="grid-2">
            {/* Category bar */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">By Category</h2>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="flex flex-col" style={{ gap: 16 }}>
                    {[1,2,3].map((i) => <Skeleton key={i} height={42} />)}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {summary.map((item, i) => {
                      const pct = totalSpent > 0 ? ((item.amount / totalSpent) * 100).toFixed(1) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span>{catEmoji(item.category)}</span>
                              <span className="capitalize" style={{ fontSize: "0.84rem", fontWeight: 500 }}>{item.category}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div className="text-mono font-600" style={{ fontSize: "0.82rem" }}>{fmtINR(item.amount)}</div>
                              <div className="text-muted">{pct}%</div>
                            </div>
                          </div>
                          <div className="progress-bg" style={{ height: 5 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: GREEN_SCALE[i % GREEN_SCALE.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="card" style={{ padding: 0 }}>
              <div className="card-header">
                <h2 className="card-title">Recent Transactions</h2>
                <span className="badge badge-muted">{recent.length} entries</span>
              </div>
              {loading ? (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3,4].map((i) => <Skeleton key={i} height={18} />)}
                </div>
              ) : recent.length === 0 ? (
                <div className="empty"><p className="empty-sub">No transactions yet.</p></div>
              ) : (
                <div style={{ overflowY: "auto", maxHeight: 340 }}>
                  {recent.map((tx, i) => (
                    <div
                      key={tx.id ?? i}
                      className="flex items-center justify-between"
                      style={{
                        padding: "12px 20px",
                        borderBottom: i < recent.length - 1 ? "1px solid var(--border-soft)" : "none",
                        transition: "background var(--dur) var(--ease)",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = ""}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 32, height: 32, borderRadius: "var(--r-sm)",
                          background: "var(--border-soft)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.9rem", flexShrink: 0,
                        }}>
                          {catEmoji(tx.category)}
                        </div>
                        <div>
                          <div className="capitalize" style={{ fontSize: "0.83rem", fontWeight: 500 }}>
                            {tx.category}
                          </div>
                          <div className="text-muted">{fmtDate(expenseDate(tx))}</div>
                        </div>
                      </div>
                      <div className="td-amount">{fmtINR(tx.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}