import './FeaturedWorks.css';

// The part recruiters actually came for. Add an `href` to any project that has
// a live demo, repository or case study, and its card becomes a link. Cards
// without one render as plain cards instead of links that go nowhere.
const WORKS = [
  {
    title: 'TaskPoint',
    role: 'Developer',
    year: '2026',
    description:
      'AI-assisted labour marketplace. A cross-platform mobile application connecting workers with job seekers.',
    href: null,
  },
  {
    title: 'Stock Market Prediction',
    role: 'Researcher',
    year: '2026',
    description:
      'Comprehensive research using Python and machine learning to predict stock market trends.',
    href: null,
  },
  {
    title: 'AI Desktop Assistant',
    role: 'Developer',
    year: '2026',
    description:
      'A voice-activated, Jarvis-style desktop assistant with built-in speech-to-text, written in Python.',
    href: null,
  },
];

function Card({ work }) {
  const body = (
    <>
      <div className="works__thumb" aria-hidden="true">
        <span className="works__initial">{work.title.charAt(0)}</span>
      </div>
      <div className="works__meta">
        <h3 className="works__title">{work.title}</h3>
        <span className="works__year">{work.year}</span>
      </div>
      <p className="works__role">{work.role}</p>
      <p className="works__desc">{work.description}</p>
    </>
  );

  return work.href ? (
    <a className="works__card is-link" href={work.href} target="_blank" rel="noreferrer noopener">
      {body}
    </a>
  ) : (
    <div className="works__card">{body}</div>
  );
}

export default function FeaturedWorks() {
  return (
    <section className="works" id="work">
      <h2 className="works__heading">Selected work</h2>

      <ul className="works__grid">
        {WORKS.map((work) => (
          <li className="works__item" key={work.title}>
            <Card work={work} />
          </li>
        ))}
      </ul>
    </section>
  );
}
