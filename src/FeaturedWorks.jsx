import { useEffect, useRef } from 'react';
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

// 3D tilt toward the pointer, with a glare that follows it. JavaScript only
// writes CSS variables, once per frame at most; CSS does the rotation, depth
// and glare. Skipped on touch screens and for reduced motion.
function useTilt() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduce) return;

    let raf = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    // Position BEFORE switching the tilt on, or the card snaps from flat to
    // the pointer angle on the first frame.
    const onEnter = (e) => {
      onMove(e);
      el.classList.add('is-tilting');
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}

function Card({ work }) {
  const tiltRef = useTilt();

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
    <a
      className="works__card is-link"
      ref={tiltRef}
      href={work.href}
      target="_blank"
      rel="noreferrer noopener"
    >
      {body}
    </a>
  ) : (
    <div className="works__card" ref={tiltRef}>
      {body}
    </div>
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
