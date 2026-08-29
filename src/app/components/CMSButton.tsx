import { useState } from "react";

export function CMSButton({ onUnlock, enabled, onDisable, onOpenEditor }: {
  onUnlock: (token: string) => void | Promise<void>; enabled: boolean; onDisable: () => void; onOpenEditor: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function verify(value: string) {
    const raw = value.replace(/[^\x20-\x7E]/g, "").trim();
    if (!raw) return;
    setBusy(true); setErr("");
    try {
      await onUnlock(raw);
      setOpen(false);
    } catch (e) { setErr((e as Error).message || "Verification failed."); }
    finally { setBusy(false); }
    setTimeout(() => setToken(""), 4000);
  }

  function lock() {
    onDisable();
  }

  if (enabled) {
    return (
      <div className="cms-fixed-wrap">
        <button onClick={onOpenEditor} className="cms-unlock">EDIT CV</button>
        <button onClick={lock} className="cms-unlock">LOCK</button>
      </div>
    );
  }
  return (
    <div className="cms-fixed-wrap">
      {!open && <button className="cms-unlock" onClick={() => setOpen(true)}>CMS</button>}
      {open && (
        <div className="cms-panel">
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
