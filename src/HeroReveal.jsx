import { useEffect, useRef, useState } from 'react';
import './HeroReveal.css';

import portrait from './assets/portrait-standing.jpg';
// Transparency mask for the photo: opaque over Hamza, clear over the studio
// backdrop. It lets the giant name show on both sides and pass behind him.
// Replace this file (same size as the photo, white with alpha) to refine
// the cutout without touching any code.
import portraitMask from './assets/portrait-standing-mask.png';

const EMAIL = 'devhamzay@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/hamza-afzal-42a962373';
const FIRST = 'HAMZA';
const LAST = 'AFZAL';

export default function HeroReveal({ paused = false }) {
  const rootRef = useRef(null);
  const [entered, setEntered] = useState(false);

  // Hold the entrance until the intro loader has lifted, so the name rises
  // while it can actually be seen.
  useEffect(() => {
    if (paused) return;
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [paused]);

  // Depth: the name drifts against the mouse and the photo drifts with it,
  // and scrolling splits the two halves of the name apart. JavaScript only
  // writes CSS variables, at most once per frame.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let raf = 0;
    let px = 0;
    let py = 0;
    const write = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const sp = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      el.style.setProperty('--px', px.toFixed(3));
      el.style.setProperty('--py', py.toFixed(3));
      el.style.setProperty('--sp', sp.toFixed(3));
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(write);
    };
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      request();
    };
    const onLeave = () => {
      px = 0;
      py = 0;
      request();
    };

    window.addEventListener('scroll', request, { passive: true });
    if (fine) {
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
    }
    write();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', request);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const letters = (word, offset) =>
    [...word].map((ch, i) => (
      <span className="hn__char" key={i} style={{ '--i': i + offset }}>
        {ch}
      </span>
    ));

  return (
    <section id="home" className={`hn${entered ? ' is-in' : ''}`} ref={rootRef}>
      <p className="hn__status">
        <span className="hn__dot" aria-hidden="true" />
        Available for new projects
      </p>

      {/* Painted first, so the photo that follows sits in front of it. */}
      <h1 className="hn__name" aria-label="Hamza Afzal">
        <span className="hn__first" aria-hidden="true">
          {letters(FIRST, 0)}
        </span>
        <span className="hn__last" aria-hidden="true">
          {letters(LAST, FIRST.length + 1)}
        </span>
      </h1>

      <div className="hn__person">
        <img
          className="hn__photo"
          src={portrait}
          alt="Hamza Afzal"
          draggable="false"
          style={{ '--mask': `url(${portraitMask})` }}
        />
      </div>

      <div className="hn__fade" aria-hidden="true" />

      <div className="hn__intro">
        <h2 className="hn__role">Software Engineer</h2>
        <p className="hn__tagline">
          Mobile apps, UI/UX design and cloud-integrated systems.
        </p>
        <a className="hn__cta" href="#contact">
          Let's collaborate <span aria-hidden="true">↗</span>
        </a>
      </div>

      <ul className="hn__social">
        <li>
          <a href={LINKEDIN} target="_blank" rel="noreferrer noopener">
            LinkedIn
          </a>
        </li>
        <li>
          <a href={`mailto:${EMAIL}`}>Email</a>
        </li>
        <li>
          <a href="#work">Work</a>
        </li>
      </ul>
    </section>
  );
}
