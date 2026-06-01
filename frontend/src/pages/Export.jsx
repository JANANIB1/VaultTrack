import { useEffect, useState } from "react";
import { FileText, Download, Printer, FileJson } from "lucide-react";
import { api } from "../api";
import { fmtINR, fmtDate, catEmoji, expenseDate } from "../lib/utils";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";

/* ── helpers ─────────────────────────────────────────────── */
function download(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(expenses) {
  const header = ["ID", "Category", "Amount (INR)", "Date", "Description"];
  const rows   = expenses.map((e) => [
    e.id ?? "",
    e.category ?? "",
    e.amount ?? "",
    expenseDate(e) ?? "",
    `"${(e.description ?? "").replace(/"/g, '""')}"`,
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\r\n");
}

function toJSON(expenses, summary) {
  return JSON.stringify(
    { generated_at: new Date().toISOString(), summary, expenses },
    null,
    2
  );
}

/* ── Export card component ───────────────────────────────── */
function ExportCard({ icon: Icon, title, desc, action, btnLabel, variant = "btn-primary" }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", padding: 24, gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: "var(--r-sm)",
        background: variant === "btn-primary" ? "var(--green-1)" : "var(--border-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: variant === "btn-primary" ? "var(--green-8)" : "var(--tx-3)",
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 5 }}>{title}</div>
        <p className="text-muted" style={{ lineHeight: 1.55 }}>{desc}</p>
      </div>
      <button className={`btn ${variant} w-full`} onClick={action}>
        {btnLabel}
      </button>
    </div>
  );
}

export default function Export() {
  const toast = useToast();

  const [expenses, setExpenses] = useState([]);
  const [summary,  setSummary]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([api.getExpenses(), api.getSummary()])
      .then(([e, s]) => { setExpenses(e); setSummary(s); })
      .catch(() => toast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, []);

  const totalSpent  = summary.reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const txCount     = expenses.length;
  const catCount    = summary.length;
  const stamp       = new Date().toISOString().slice(0, 10);

  const handleCSV = () => {
    if (!expenses.length) { toast("No data to export", "error"); return; }
    download(toCSV(expenses), `vaulttrack-expenses-${stamp}.csv`, "text/csv");
    toast("CSV downloaded", "success");
  };

  const handleJSON = () => {
    if (!expenses.length) { toast("No data to export", "error"); return; }
    download(toJSON(expenses, summary), `vaulttrack-report-${stamp}.json`, "application/json");
    toast("JSON report downloaded", "success");
  };

  const handlePrint = () => {
    if (!expenses.length) { toast("No data to print", "error"); return; }
    window.print();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Download your data</p>
          <h1 className="page-title">Export Reports</h1>
        </div>
      </div>

      {/* Summary strip */}
      <div className="stat-grid mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {loading ? (
          [1,2,3].map((i) => (
            <div key={i} className="stat-card">
              <Skeleton width={90} height={12} style={{ marginBottom: 10 }} />
              <Skeleton width={110} height={28} />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-label">Total Spending</div>
              <div className="stat-value green">{fmtINR(totalSpent)}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{txCount}</div>
              <div className="stat-sub">Recorded entries</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Categories</div>
              <div className="stat-value">{catCount}</div>
              <div className="stat-sub">Unique areas</div>
            </div>
          </>
        )}
      </div>

      {/* Export options */}
      <div className="grid-3 mb-6">
        <ExportCard
          icon={FileText}
          title="Export CSV"
          desc="All transactions in a spreadsheet-ready format. Opens in Excel, Google Sheets, or Numbers."
          action={handleCSV}
          btnLabel="↓ Download CSV"
          variant="btn-primary"
        />
        <ExportCard
          icon={FileJson}
          title="Export JSON"
          desc="Full data dump including summary and all transactions. Useful for backups or further processing."
          action={handleJSON}
          btnLabel="↓ Download JSON"
          variant="btn-secondary"
        />
        <ExportCard
          icon={Printer}
          title="Print Report"
          desc="Generate a printable report view of your expense summary and transaction history."
          action={handlePrint}
          btnLabel="Print / Save PDF"
          variant="btn-ghost"
        />
      </div>

      {/* Data preview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Data Preview</h2>
          <div className="flex items-center gap-2">
            <span className="badge badge-muted">{txCount} rows total</span>
            <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem" }} onClick={handleCSV}>
              <Download size={13} /> CSV
            </button>
          </div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {[1,2,3].map((i) => <Skeleton key={i} height={16} />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <p className="empty-title">Nothing to preview</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 6).map((e, i) => (
                  <tr key={e.id ?? i}>
                    <td><span className="td-idx">{e.id ?? i + 1}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{catEmoji(e.category)}</span>
                        <span className="chip capitalize">{e.category}</span>
                      </div>
                    </td>
                    <td><span className="td-amount">{fmtINR(e.amount)}</span></td>
                    <td><span className="td-muted">{fmtDate(expenseDate(e))}</span></td>
                    <td style={{ color: "var(--tx-3)", fontSize: "0.8rem" }}>
                      {e.description || <span style={{ color: "var(--tx-muted)" }}>—</span>}
                    </td>
                  </tr>
                ))}
                {expenses.length > 6 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "12px 20px" }}>
                      <span className="text-muted">…and {expenses.length - 6} more rows in the downloaded file</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          .sidebar, .page-header .btn, .card-header .btn,
          button, .controls-row { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .page { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}