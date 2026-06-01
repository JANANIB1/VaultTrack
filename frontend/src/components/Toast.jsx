import { createContext, useCallback, useContext, useState } from "react";

const Ctx = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = "default", duration = 3500) => {
    const id = ++_id;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {toasts.map(({ id, msg, type }) => (
          <div
            key={id}
            style={{
              padding: "11px 17px",
              borderRadius: "var(--r-md)",
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "#fff",
              background:
                type === "success" ? "var(--green-8)"
                : type === "error" ? "var(--red-6)"
                : "var(--tx)",
              boxShadow: "var(--sh-lg)",
              maxWidth: 320,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "slide-toast 0.2s ease",
              fontFamily: "var(--sans)",
            }}
          >
            {type === "success" && "✓ "}
            {type === "error"   && "✕ "}
            {msg}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-toast {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);