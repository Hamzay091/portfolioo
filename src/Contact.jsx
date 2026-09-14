import { useState } from 'react';
import './Contact.css';

// Read your own email out loud, character by character, before you ship.
const EMAIL = 'devhamzay@gmail.com';

// FormSubmit relays the form to EMAIL with no backend and no account. The very
// first message sent triggers a one-time activation email to that inbox;
// messages are only delivered after the link in it is clicked.
const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hamza-afzal-42a962373' },
];

const EMPTY = { name: '', email: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    // Honeypot: a field people never see, so only bots fill it in.
    if (new FormData(e.currentTarget).get('_honey')) return;

    setStatus('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _replyto: form.email,
          _subject: `Portfolio message from ${form.name}`,
          _template: 'table',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.status);
      setStatus('sent');
      setForm(EMPTY);
    } catch {
      setStatus('error');
    }
  };

  // Fallback if the relay is down: open the visitor's own mail app with the
  // message already filled in, so nothing they typed is lost.
  const mailto =
    `mailto:${EMAIL}?subject=${encodeURIComponent(`Portfolio message from ${form.name || 'a visitor'}`)}` +
    `&body=${encodeURIComponent(form.message)}`;

  const sending = status === 'sending';

  return (
    <section className="contact" id="contact">
      <h2 className="contact__heading">Let's talk</h2>
      <p className="contact__lede">
        Have a project, a role or an idea? Send a message and it lands straight in my inbox.
      </p>

      <form className="contact__form" onSubmit={onSubmit} noValidate={false}>
        <div className="contact__row">
          <label className="contact__field">
            <span className="contact__label">Name</span>
            <input
              name="name"
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              value={form.name}
              onChange={update}
              disabled={sending}
            />
          </label>
          <label className="contact__field">
            <span className="contact__label">Email</span>
            <input
              name="email"
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              value={form.email}
              onChange={update}
              disabled={sending}
            />
          </label>
        </div>

        <label className="contact__field">
          <span className="contact__label">Message</span>
          <textarea
            name="message"
            required
            rows={5}
            maxLength={3000}
            value={form.message}
            onChange={update}
            disabled={sending}
          />
        </label>

        <input
          className="contact__honey"
          type="text"
          name="_honey"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className="contact__actions">
          <button className="contact__submit" type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send message'}
          </button>
          <p className={`contact__status is-${status}`} role="status" aria-live="polite">
            {status === 'sent' && 'Thanks, your message is on its way. I will reply soon.'}
            {status === 'error' && (
              <>
                That did not go through. <a href={mailto}>Send it from your email app instead</a>.
              </>
            )}
          </p>
        </div>
      </form>

      <p className="contact__or">or write to me directly</p>
      <a className="contact__email" href={`mailto:${EMAIL}`}>
        {EMAIL}
      </a>

      <ul className="contact__socials">
        {SOCIALS.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noreferrer noopener">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
