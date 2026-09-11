import './FeaturedWorks.css';

// The part recruiters actually came for. Replace these with real projects,
// real links and real images before you send anyone the URL.
const WORKS = [
  { title: 'Project One', year: '2026', role: 'Design + build', href: '#' },
  { title: 'Project Two', year: '2025', role: 'Frontend', href: '#' },
  { title: 'Project Three', year: '2025', role: 'Motion', href: '#' },
];

export default function FeaturedWorks() {
  return (
    <section className="works" id="work">
      <h2 className="works__heading">Selected work</h2>

      <ul className="works__grid">
        {WORKS.map((work) => (
          <li className="works__item" key={work.title}>
            <a className="works__link" href={work.href}>
              <div className="works__thumb" aria-hidden="true" />
              <div className="works__meta">
                <span className="works__title">{work.title}</span>
                <span className="works__role">{work.role}</span>
                <span className="works__year">{work.year}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
