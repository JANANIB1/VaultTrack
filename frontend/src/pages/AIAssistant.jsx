import { useEffect, useState } from "react";
import { MessageSquare, Zap, Database, RefreshCw, CheckCircle, Clock, ArrowDown } from "lucide-react";
import { api } from "../api";

const EXAMPLE_PROMPTS = [
  { text: "Spent 500 on food",              desc: "Log a food expense of ₹500" },
  { text: "Spent 250 on transport",          desc: "Log a transport expense of ₹250" },
  { text: "Show my expenses",               desc: "View a summary of all expenses" },
  { text: "How much budget is left?",        desc: "Check remaining budget across categories" },
  { text: "Budget status",                   desc: "See which categories are near their limit" },
  { text: "How much did I spend on food?",   desc: "Query spending for a specific category" },
];

const WORKFLOW = [
  { label: "You type a message",        icon: MessageSquare, highlight: false },
  { label: "Dialogflow parses intent",  icon: Zap,           highlight: false },
  { label: "FastAPI webhook fires",     icon: RefreshCw,     highlight: false },
  { label: "SQLite DB updated",         icon: Database,      highlight: true  },
  { label: "Dashboard reflects change", icon: CheckCircle,   highlight: true  },
];

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        width: 38, height: 38, borderRadius: "var(--r-sm)",
        background: "var(--green-1)", color: "var(--green-8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={17} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.87rem", marginBottom: 5 }}>{title}</div>
        <p className="text-muted" style={{ lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [status, setStatus] = useState("checking"); // "online" | "offline" | "checking"


  // Ping the backend to report integration status
  useEffect(() => {
    api.getSummary()
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));
  }, []);

  const statusBadge = {
    checking: <span className="badge badge-muted"><Clock size={11} /> Checking…</span>,
    online:   <span className="badge badge-green"><CheckCircle size={11} /> Backend online</span>,
    offline:  <span className="badge badge-red">Backend offline</span>,
  }[status];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Natural language expense tracking</p>
          <h1 className="page-title">AI Assistant</h1>
        </div>
        {statusBadge}
      </div>

      {/* Hero overview */}
      <div className="card mb-6">
        <div className="card-body" style={{ display: "flex", gap: 36, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Illustration area */}
          <div style={{
            flex: "0 0 220px",
            height: 180,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
          }}>
            {/* Simple chat illustration */}
            {[
              { text: "Spent 500 on food", align: "flex-end", bg: "var(--green-7)", color: "#fff" },
              { text: "✓ Logged ₹500 — Food", align: "flex-start", bg: "var(--border-soft)", color: "var(--tx-2)" },
              { text: "Budget status", align: "flex-end", bg: "var(--green-7)", color: "#fff" },
              { text: "Food: 33% used", align: "flex-start", bg: "var(--border-soft)", color: "var(--tx-2)" },
            ].map((bubble, i) => (
              <div key={i} style={{ display: "flex", width: "100%", justifyContent: bubble.align }}>
                <div style={{
                  background: bubble.bg,
                  color: bubble.color,
                  padding: "6px 11px",
                  borderRadius: 10,
                  fontSize: "0.68rem",
                  maxWidth: "80%",
                  fontWeight: 500,
                }}>
                  {bubble.text}
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{
              fontFamily: "var(--serif)",
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 10,
            }}>
              Log expenses with natural language
            </h2>
            <p style={{ fontSize: "0.87rem", color: "var(--tx-3)", lineHeight: 1.65, marginBottom: 16 }}>
              VaultTrack uses <strong>Google Dialogflow</strong> to understand natural language messages.
              Instead of filling out forms, you simply tell the assistant what you spent — and it
              automatically records the expense in your SQLite database and updates your dashboard in real time.
            </p>
            <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
              <span className="badge badge-blue">Dialogflow NLP</span>
              <span className="badge badge-muted">FastAPI Webhook</span>
              <span className="badge badge-muted">SQLite</span>
              <span className="badge badge-muted">Intent Detection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: prompts + workflow */}
      <div className="grid-2 mb-6">
        {/* Example prompts */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Example Commands</h2>
            <span className="badge badge-muted">{EXAMPLE_PROMPTS.length} examples</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {EXAMPLE_PROMPTS.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < EXAMPLE_PROMPTS.length - 1 ? "1px solid var(--border-soft)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  transition: "background var(--dur) var(--ease)",
                  cursor: "default",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = ""}
              >
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.82rem",
                  color: "var(--green-8)",
                  background: "var(--green-1)",
                  display: "inline-block",
                  padding: "3px 9px",
                  borderRadius: "var(--r-full)",
                  alignSelf: "flex-start",
                }}>
                  "{p.text}"
                </div>
                <div className="text-muted" style={{ paddingLeft: 2 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">How It Works</h2>
          </div>
          <div className="card-body">
            <div className="workflow">
              {WORKFLOW.map(({ label, icon: Icon, highlight }, i) => (
                <div key={i} className="workflow-step">
                  <div className={`workflow-node${highlight ? " highlight" : ""}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      {label}
                    </div>
                  </div>
                  {i < WORKFLOW.length - 1 && <div className="workflow-arrow" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid-3">
        <FeatureCard
          icon={MessageSquare}
          title="Natural Language Input"
          desc="No forms, no dropdowns. Just type what you spent in plain English or your native language."
        />
        <FeatureCard
          icon={Zap}
          title="Instant Intent Detection"
          desc="Dialogflow identifies the expense amount, category, and date from your message in milliseconds."
        />
        <FeatureCard
          icon={Database}
          title="Real-Time Dashboard Updates"
          desc="Every logged expense immediately appears in your dashboard, charts, and budget trackers."
        />
      </div>

      {/* Integration status card */}
      <div className="card mt-6" style={{ padding: 22 }}>
        <div className="flex items-center justify-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.87rem", marginBottom: 4 }}>
              Integration Status
            </div>
            <p className="text-muted">
              Dialogflow → FastAPI webhook at{" "}
              <code style={{ fontSize: "0.78rem", background: "var(--border-soft)", padding: "2px 6px", borderRadius: 4 }}>
                POST /webhook
              </code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-muted">GET /summary ✓</span>
            <span className="badge badge-muted">GET /expenses ✓</span>
            <span className="badge badge-muted">GET /budgets ✓</span>
            {statusBadge}
          </div>
        </div>
      </div>
    

    {/* Dialogflow Chat Widget */}
<div style={{ height: 0, overflow: "hidden" }}>
  <df-messenger
    intent="WELCOME"
    chat-title="VaultTrack"
    agent-id="6cc0294a-c912-4e46-a0b5-ec19bbb1fea1"
    language-code="en"
  ></df-messenger>
</div>
</div>



 );
}