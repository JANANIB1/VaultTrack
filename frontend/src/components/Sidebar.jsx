import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowUpDown,
  Target,
  Download,
  Bot,
  Moon,
  Sun,
} from "lucide-react";

const NAV = [
  { to: "/",             label: "Dashboard",      Icon: LayoutDashboard },
  { to: "/expenses",     label: "Expenses",        Icon: ArrowUpDown },
  { to: "/budgets",      label: "Budgets",         Icon: Target },
  { to: "/export",       label: "Export Reports",  Icon: Download },
  { to: "/ai-assistant", label: "AI Assistant",    Icon: Bot },
];

export default function Sidebar({ dark, onToggleDark, open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 49, display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-inner">
          <div className="sidebar-brand">
            Vault<span>Track</span>
          </div>

          <div className="nav-section-label">Menu</div>

          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={onClose}
            >
              <Icon size={16} className="nav-link-icon" />
              {label}
            </NavLink>
          ))}

          <div className="sidebar-footer">
            <button className="theme-btn" onClick={onToggleDark}>
              {dark
                ? <><Sun size={14} /> Light mode</>
                : <><Moon size={14} /> Dark mode</>
              }
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}