import './Contact.css';

const EMAIL = 'devhamzay@gmail.com';

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hamza-afzal-42a962373' },
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
