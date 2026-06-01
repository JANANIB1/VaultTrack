import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { api } from "../api";
import { fmtINR, fmtDate, catEmoji, expenseDate } from "../lib/utils";
import { Skeleton, SkeletonRow } from "../components/Skeleton";

const ALL_CATS = "all";

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
  return sortDir === "asc"
    ? <ArrowUp size={12} style={{ color: "var(--green-7)" }} />
    : <ArrowDown size={12} style={{ color: "var(--green-7)" }} />;
}

/** Mobile-friendly card for a single expense */
function ExpenseCard({ tx, i }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-md)",
      padding: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "var(--r-sm)",
          background: "var(--border-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", flexShrink: 0,
        }}>
          {catEmoji(tx.category)}
        </div>
        <div>
          <div className="capitalize" style={{ fontSize: "0.86rem", fontWeight: 600 }}>
            {tx.category}
          </div>
          {tx.description && (
            <div style={{ fontSize: "0.76rem", color: "var(--tx-muted)", marginTop: 2 }}>
              {tx.description}
            </div>
          )}
          <div style={{ fontSize: "0.74rem", color: "var(--tx-muted)", marginTop: 2, fontFamily: "var(--mono)" }}>
            {fmtDate(expenseDate(tx))}
          </div>
        </div>
      </div>
      <div className="td-amount" style={{ fontSize: "0.95rem", flexShrink: 0 }}>
        {fmtINR(tx.amount)}
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [search,   setSearch]   = useState("");
  const [cat,      setCat]      = useState(ALL_CATS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [sortKey,  setSortKey]  = useState("date");
  const [sortDir,  setSortDir]  = useState("desc");
  const [view,     setView]     = useState("table"); // "table" | "card"

  useEffect(() => {
    api.getExpenses()
      .then(setExpenses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => [...new Set(expenses.map((e) => e.category).filter(Boolean))], [expenses]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        (e.category ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q)
      );
    }

    if (cat !== ALL_CATS) list = list.filter((e) => e.category === cat);

    if (dateFrom) list = list.filter((e) => {
      const d = new Date(expenseDate(e));
      return !isNaN(d) && d >= new Date(dateFrom);
    });

    if (dateTo) list = list.filter((e) => {
      const d = new Date(expenseDate(e));
      return !isNaN(d) && d <= new Date(dateTo + "T23:59:59");
    });

    list.sort((a, b) => {
      let va = sortKey === "amount" ? Number(a.amount ?? 0) : (expenseDate(a) ?? "");
      let vb = sortKey === "amount" ? Number(b.amount ?? 0) : (expenseDate(b) ?? "");
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [expenses, search, cat, dateFrom, dateTo, sortKey, sortDir]);

  const total   = filtered.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const highest = filtered.length ? Math.max(...filtered.map((e) => Number(e.amount ?? 0))) : 0;
  const average = filtered.length ? Math.round(total / filtered.length) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">All transactions</p>
          <h1 className="page-title">Expenses</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`btn ${view === "table" ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            className={`btn ${view === "card" ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            onClick={() => setView("card")}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Stats header */}
      <div className="stat-grid mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {loading ? (
          [1,2,3].map((i) => (
            <div key={i} className="stat-card">
              <Skeleton width={80} height={12} style={{ marginBottom: 10 }} />
              <Skeleton width={100} height={28} />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value green">{fmtINR(total)}</div>
              <div className="stat-sub">{filtered.length} transactions shown</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Highest Expense</div>
              <div className="stat-value">{fmtINR(highest)}</div>
              <div className="stat-sub">Single transaction</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Expense</div>
              <div className="stat-value">{fmtINR(average)}</div>
              <div className="stat-sub">Per transaction</div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body" style={{ padding: "16px 20px" }}>
          <div className="controls-row">
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: "var(--tx-muted)", pointerEvents: "none",
              }} />
              <input
                className="input"
                style={{ paddingLeft: 32 }}
                placeholder="Search category or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select className="select" style={{ width: "auto", flex: "0 0 160px" }}
              value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value={ALL_CATS}>All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{catEmoji(c)} {c}</option>
              ))}
            </select>

            <input
              className="input"
              type="date"
              style={{ width: "auto", flex: "0 0 148px" }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From date"
            />
            <input
              className="input"
              type="date"
              style={{ width: "auto", flex: "0 0 148px" }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To date"
            />

            {(search || cat !== ALL_CATS || dateFrom || dateTo) && (
              <button
                className="btn btn-ghost"
                style={{ flexShrink: 0 }}
                onClick={() => { setSearch(""); setCat(ALL_CATS); setDateFrom(""); setDateTo(""); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="empty">
          <div className="empty-icon">⚠</div>
          <p className="empty-title">Failed to load</p>
          <p className="empty-sub">{error}</p>
        </div>
      )}

      {/* Table view */}
      {!error && view === "table" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Transactions</h2>
            <span className="badge badge-muted">{filtered.length} results</span>
          </div>
          <div className="table-wrap">
            {loading ? (
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Category</th><th>Amount</th><th>Date</th><th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5].map((i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔍</div>
                <p className="empty-title">No results</p>
                <p className="empty-sub">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Category</th>
                    <th
                      className="th-sortable"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center gap-2">
                        Amount <SortIcon col="amount" sortKey={sortKey} sortDir={sortDir} />
                      </div>
                    </th>
                    <th
                      className="th-sortable"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        Date <SortIcon col="date" sortKey={sortKey} sortDir={sortDir} />
                      </div>
                    </th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={item.id ?? i}>
                      <td><span className="td-idx">{String(i + 1).padStart(2, "0")}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{catEmoji(item.category)}</span>
                          <span className="chip">{item.category}</span>
                        </div>
                      </td>
                      <td><span className="td-amount">{fmtINR(item.amount)}</span></td>
                      <td><span className="td-muted">{fmtDate(expenseDate(item))}</span></td>
                      <td style={{ color: "var(--tx-3)", fontSize: "0.8rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.description || <span style={{ color: "var(--tx-muted)" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Card view */}
      {!error && view === "card" && (
        <>
          {loading ? (
            <div className="grid-auto">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16 }}>
                  <Skeleton height={60} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <p className="empty-title">No results</p>
              <p className="empty-sub">Try adjusting your filters.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((tx, i) => <ExpenseCard key={tx.id ?? i} tx={tx} i={i} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}