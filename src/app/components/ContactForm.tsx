import { useState } from "react";

export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  function send() {
    const body = `Name: ${name}\nFrom: ${from}\n\n${msg}`;
    const mailto = `${email}?subject=${encodeURIComponent(subject || "Hello Hazem")}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="contact-form">
      <div className="contact-row">
        <div className="float-label">
          <input className="contact-input" id="cf-name" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="cf-name">Your name</label>
        </div>
        <div className="float-label">
          <input className="contact-input" id="cf-email" placeholder=" " type="email" value={from} onChange={(e) => setFrom(e.target.value)} />
          <label htmlFor="cf-email">Your email</label>
        </div>
      </div>
      <div className="float-label">
        <input className="contact-input" id="cf-subject" placeholder=" " value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label htmlFor="cf-subject">Subject</label>
      </div>
      <div className="float-label">
        <textarea className="contact-input contact-textarea" id="cf-msg" placeholder=" " value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
        <label htmlFor="cf-msg">Your message…</label>
      </div>
      <button className="btn primary contact-send" onClick={send}>
        {sent ? "✓ Opening your email client…" : "Send message →"}
      </button>
    </div>
  );
}
