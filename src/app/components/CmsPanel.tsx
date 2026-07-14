import { useState, useRef } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader2, LogIn, LogOut } from "lucide-react";

const OWNER = "hazem-alabiad";
const REPO = "hazem-alabiad.github.io";
const CV_PATH = "src/imports/Hazem-Alabiad-CV.pdf";
const TOKEN_KEY = "cms_gh_token";

interface Props {
  onClose: () => void;
}

export default function CmsPanel({ onClose }: Props) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [isOwner, setIsOwner] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [authError, setAuthError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogin() {
    if (!token.trim()) { setAuthError("Please enter your GitHub Personal Access Token."); return; }
    setAuthChecking(true);
    setAuthError("");
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token.trim()}`, Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error("Invalid token or GitHub API error.");
      const user = await res.json();
      if (user.login !== OWNER) {
        setAuthError(`Access denied. Logged in as '${user.login}', not '${OWNER}'.`);
        setIsOwner(false);
      } else {
        localStorage.setItem(TOKEN_KEY, token.trim());
        setIsOwner(true);
        setAuthError("");
      }
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setAuthChecking(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setIsOwner(false);
    setUploadStatus("idle");
    setUploadMessage("");
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadMessage("Please select a PDF file."); setUploadStatus("error"); return; }
    if (!file.name.endsWith(".pdf")) { setUploadMessage("Only PDF files are allowed."); setUploadStatus("error"); return; }

    setUploadStatus("uploading");
    setUploadMessage("Reading file...");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadMessage("Checking existing file SHA...");
      const storedToken = localStorage.getItem(TOKEN_KEY) || token;
      const headers = { Authorization: `Bearer ${storedToken}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };

      let sha: string | undefined;
      const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${CV_PATH}`, { headers });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      setUploadMessage("Uploading CV to GitHub...");
      const body: Record<string, string> = {
        message: `cv: update CV PDF via CMS panel [${new Date().toISOString()}]`,
        content: base64,
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${CV_PATH}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || "Upload failed.");
      }

      setUploadStatus("success");
      setUploadMessage("✅ CV uploaded! GitHub Actions will rebuild the site in ~1 min.");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) {
      setUploadStatus("error");
      setUploadMessage(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  const PANEL: React.CSSProperties = {
    position: "fixed", bottom: 80, right: 24, zIndex: 9999,
    width: 340, background: "#111119",
    border: "1px solid rgba(94,234,212,0.22)",
    borderRadius: 16, padding: 24,
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    fontFamily: "'DM Sans', sans-serif",
    color: "#d4d4e0",
  };

  return (
    <div style={PANEL}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5eead4", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          CMS Panel
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b6b82", padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      {!isOwner ? (
        /* ── Login ── */
        <div>
          <p style={{ fontSize: 12, color: "#8f8fa8", marginBottom: 12, lineHeight: 1.6 }}>
            Enter your GitHub PAT (Personal Access Token) with <code style={{ color: "#5eead4" }}>repo</code> scope to authenticate.
          </p>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              background: "#09090f", border: "1px solid rgba(94,234,212,0.15)",
              color: "#eeeef5", fontSize: 13, outline: "none",
              boxSizing: "border-box", marginBottom: 10,
            }}
          />
          {authError && (
            <p style={{ fontSize: 12, color: "#f87171", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={13} /> {authError}
            </p>
          )}
          <button
            onClick={handleLogin}
            disabled={authChecking}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 8,
              background: authChecking ? "#2a2a3a" : "#5eead4",
              color: authChecking ? "#6b6b82" : "#09090f",
              border: "none", cursor: authChecking ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {authChecking ? <><Loader2 size={14} className="animate-spin" /> Checking...</> : <><LogIn size={14} /> Sign in with Token</>}
          </button>
        </div>
      ) : (
        /* ── Owner Panel ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#5eead4", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={13} /> Signed in as {OWNER}
            </span>
            <button
              onClick={handleLogout}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b6b82", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>

          {/* CV Upload */}
          <div style={{ background: "#09090f", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 12, color: "#8f8fa8", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Update CV (PDF)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={() => { setUploadStatus("idle"); setUploadMessage(""); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", padding: "8px 0", borderRadius: 8,
                background: "transparent", border: "1px dashed rgba(94,234,212,0.3)",
                color: "#5eead4", cursor: "pointer", fontSize: 12, marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Upload size={13} />
              {fileRef.current?.files?.[0]?.name || "Choose PDF file"}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadStatus === "uploading"}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 8,
                background: uploadStatus === "uploading" ? "#2a2a3a" : "#5eead4",
                color: uploadStatus === "uploading" ? "#6b6b82" : "#09090f",
                border: "none", cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {uploadStatus === "uploading"
                ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                : <><Upload size={14} /> Upload CV</>}
            </button>
            {uploadMessage && (
              <p style={{
                marginTop: 10, fontSize: 12, lineHeight: 1.6,
                color: uploadStatus === "success" ? "#5eead4" : uploadStatus === "error" ? "#f87171" : "#8f8fa8",
                display: "flex", alignItems: "flex-start", gap: 6,
              }}>
                {uploadStatus === "success" && <CheckCircle size={13} style={{ marginTop: 2, flexShrink: 0 }} />}
                {uploadStatus === "error" && <AlertCircle size={13} style={{ marginTop: 2, flexShrink: 0 }} />}
                {uploadMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
