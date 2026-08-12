import { useState } from "react";
import { Github, Loader2, Send, X } from "lucide-react";

const GH_REPO = "hazem-alabiad/hazem-alabiad.github.io";

interface GhUser {
  login: string;
  name: string | null;
  avatar: string;
}

export function PitchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState("");
  const [user, setUser] = useState<GhUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifyErr, setVerifyErr] = useState("");

  if (!open) return null;

  async function verify() {
    const login = username.trim().replace(/^@/, "");
    if (!login) return;
    setBusy(true); setVerifyErr("");
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`);
      const data = await res.json();
      if (!res.ok || data.login) {
        setUser({ login: data.login || login, name: data.name || null, avatar: data.avatar_url || "" });
      } else {
        setUser(null);
        setVerifyErr(`No GitHub account "@${login}" found.`);
      }
    } catch {
      setVerifyErr("Could not reach GitHub — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const login = user?.login || username.trim().replace(/^@/, "") || "yourusername";
    const body = [
      "## Post pitch",
      "",
      `**Author:** @${login}`,
      title.trim() ? `**Title:** ${title.trim()}` : "",
      desc.trim() ? `**One-line description:** ${desc.trim()}` : "",
      "",
      "### Outline / draft (markdown ok)",
      draft.trim() || "_…_",
      "",
      "---",
      "Pitched via the blog. Suggested frontmatter for the owner:",
      "```yaml",
      "---",
      `title: "${(title.trim() || "Post title").replace(/"/g, '\\"')}"`,
      'date: "YYYY-MM-DD"',
      `description: "${(desc.trim() || "Short description.").replace(/"/g, '\\"')}"`,
      "tags: [\"NLP\"]",
      "---",
      "```",
    ]
      .filter((l) => l !== "")
      .join("\n");
    const url = `https://github.com/${GH_REPO}/issues/new?title=${encodeURIComponent(title.trim() || "Blog post pitch")}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="sc-overlay-dimmer" onClick={onClose}>
      <div className="sc-panel pitch-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pitch-head">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0 }}>Pitch a post</h2>
          <button className="pitch-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <p className="pitch-note">
          Want to write on this blog? Sign in with GitHub below — submitting opens GitHub where you log in once and your pitch
          lands as an issue in the repo. No tokens needed to contribute.
        </p>

        <div className="pitch-field">
          <label className="pitch-label">GITHUB USERNAME</label>
          <div className="pitch-verify-row">
            <input
              className="pitch-input"
              placeholder="@yourhandle"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUser(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
            />
            <button className="btn" onClick={verify} disabled={busy} style={{ whiteSpace: "nowrap" }}>
              {busy ? <Loader2 size={13} className="spin" /> : <Github size={13} />} Verify
            </button>
          </div>
          {user && (
            <div className="pitch-verified">
              {user.avatar && <img className="pitch-avatar" src={user.avatar} alt="" />}
              <span>✓ recognized <b>@{user.login}</b>{user.name ? ` — ${user.name}` : ""}. Submit to log in with GitHub.</span>
            </div>
          )}
          {verifyErr && <div className="pitch-err">✗ {verifyErr}</div>}
        </div>

        <div className="pitch-field">
          <label className="pitch-label">SUGGESTED TITLE</label>
          <input className="pitch-input" placeholder="Catchy, specific, honest" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="pitch-field">
          <label className="pitch-label">ONE-LINE DESCRIPTION</label>
          <input className="pitch-input" placeholder="What will readers learn?" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="pitch-field">
          <label className="pitch-label">OUTLINE / DRAFT — MARKDOWN OK</label>
          <textarea className="pitch-input pitch-textarea" rows={5} placeholder="3–6 bullet points of what you'll cover…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>

        <div className="pitch-actions">
          <button className="btn primary pitch-submit" onClick={submit} disabled={!user && !username.trim()}>
            <Send size={13} /> {user ? `Pitch as @${user.login}` : "Continue with GitHub"}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
        <p className="pitch-note pitch-note--fine">
          Pitches go only to the owner via a GitHub issue — nothing is published without an invitation and review.
        </p>
      </div>
    </div>
  );
}