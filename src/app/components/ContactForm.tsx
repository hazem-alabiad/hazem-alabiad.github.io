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
        <input className="contact-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="contact-input" placeholder="Your email" type="email" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <input className="contact-input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className="contact-input contact-textarea" placeholder="Your message…" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
      <button className="btn primary contact-send" onClick={send}>
        {sent ? "✓ Opening your email client…" : "Send message →"}
      </button>
    </div>
  );
}
