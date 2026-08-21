import { useState, useEffect } from "react";

const CMS_TOKEN_KEY = "hazem-cms-token";

export function CMSButton({ onUnlock, enabled, onDisable, onOpenEditor }: {
  onUnlock: () => void; enabled: boolean; onDisable: () => void; onOpenEditor: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function verify(value: string) {
    const token = value.replace(/[^\x20-\x7E]/g, "").trim();
    if (!token) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("https://api.github.com/user", { headers: { Authorization: `token ${token}`, "User-Agent": "hazem-portfolio" } });
      const data = await res.json();
      if (data.login === "hazem-alabiad") {
        try { localStorage.setItem(CMS_TOKEN_KEY, token); } catch { /* storage unavailable */ }
        setOpen(false); onUnlock();
      } else setErr("Token does not match owner.");
    } catch { setErr("Verification failed."); }
    finally { setBusy(false); }
    setTimeout(() => setToken(""), 4000);
  }

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem(CMS_TOKEN_KEY) || ""; } catch { /* noop */ }
    if (saved) verify(saved).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function lock() {
    try { localStorage.removeItem(CMS_TOKEN_KEY); } catch { /* noop */ }
    onDisable();
  }

  if (enabled) {
    return (
      <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60, display: "flex", gap: 8 }}>
        <button onClick={onOpenEditor} className="cms-unlock" style={{ position: "static" }}>EDIT CV</button>
        <button onClick={lock} className="cms-unlock" style={{ position: "static" }}>LOCK</button>
      </div>
    );
  }
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60 }}>
      {!open && <button className="cms-unlock" onClick={() => setOpen(true)}>CMS</button>}
      {open && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule)", borderRadius: 4, padding: 14, width: 240 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.1em", marginBottom: 8 }}>UNLOCK CMS</div>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="GitHub PAT" type="password" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--rule)", color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 12, padding: "7px 9px", borderRadius: 3, outline: "none" }} />
          {err && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--red)", marginTop: 6 }}>{err}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button onClick={() => verify(token)} disabled={busy} className="btn primary" style={{ flex: 1, padding: "7px 10px" }}>{busy ? "..." : "UNLOCK"}</button>
            <button onClick={() => setOpen(false)} className="btn" style={{ padding: "7px 10px" }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}
