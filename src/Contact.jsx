import './Contact.css';

// Read your own email out loud, character by character, before you ship.
const EMAIL = 'you@example.com';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Read.cv', href: 'https://read.cv/' },
];

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <h2 className="contact__heading">Let's talk</h2>

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
