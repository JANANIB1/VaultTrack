import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar       from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import Dashboard     from "./pages/Dashboard";
import Expenses      from "./pages/Expenses";
import Budgets       from "./pages/Budgets";
import Export        from "./pages/Export";
import AIAssistant   from "./pages/AIAssistant";
import "./index.css";

export default function App() {
  const [dark, setDark]   = useState(() => localStorage.getItem("vt-theme") === "dark");
  const [open, setOpen]   = useState(false); // mobile sidebar open

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vt-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleDark = () => setDark((d) => !d);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-shell">
          <Sidebar
            dark={dark}
            onToggleDark={toggleDark}
            open={open}
            onClose={() => setOpen(false)}
          />
          <div className="main-content">
            <Routes>
              <Route path="/"             element={<Dashboard />}   />
              <Route path="/expenses"     element={<Expenses />}    />
              <Route path="/budgets"      element={<Budgets />}     />
              <Route path="/export"       element={<Export />}      />
              <Route path="/ai-assistant" element={<AIAssistant />} />
            </Routes>
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}