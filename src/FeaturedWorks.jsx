import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import taskpointImg from './assets/projects/taskpoint.jpg';
import stockImg from './assets/projects/stock-market-prediction.jpg';
import assistantImg from './assets/projects/ai-desktop-assistant.jpg';
import payrollImg from './assets/projects/employee-payroll-system.jpg';
import './FeaturedWorks.css';

const EMAIL = 'devhamzay@gmail.com';

// The part recruiters actually came for. Every card opens a case study panel
// with the full story; `links` puts real buttons in that panel, so a live demo
// or repository is one click away. An empty `links` falls back to an email
// button, which is better than a dead link.
//
// image: thumbnail. fit: 'cover' fills the frame and crops, 'contain' shows
// the whole image on `thumbBg` (use it for logos). year: null hides it.
const WORKS = [
  {
    title: 'TaskPoint',
    role: 'Developer',
    year: '2026',
    description:
      'AI-assisted labour marketplace. A cross-platform mobile application connecting workers with job seekers.',
    // Logo pre-composed onto its own background at the card's 11:6 shape, so
    // it fills the frame like the others and no image edge can show.
    image: taskpointImg,
    fit: 'cover',
    overview:
      'A cross-platform mobile marketplace for day labour. Workers create a profile with their skills and availability, employers post jobs, and an AI-assisted matching step puts the right people in front of each job instead of leaving both sides to search.',
    highlights: [
      'Profiles for workers and employers, each with their own flow through the app',
      'Job posting, browsing and matching driven by skills, location and availability',
      'One codebase running on both Android and iOS',
      'Interface designed before development, so the layout and flow were tested first',
    ],
    tech: ['Flutter & Dart', 'Mobile development', 'Figma (UI/UX design)'],
    links: [],
  },
  {
    title: 'Stock Market Prediction',
    role: 'Researcher',
    year: '2026',
    description:
      'Comprehensive research using Python and machine learning to predict stock market trends.',
    image: stockImg,
    fit: 'cover',
    overview:
      'A research project on forecasting stock market trends from historical price data. Data was collected and cleaned, features were engineered from it, and several machine learning models were trained and compared to see which predicted movement most reliably.',
    highlights: [
      'Historical market data collected, cleaned and prepared for training',
      'Several models trained and compared against the same test data',
      'Results measured with accuracy and error scores rather than eyeballed',
      'Findings written up as a full research report',
    ],
    tech: ['Python', 'Machine learning', 'Data analysis'],
    links: [],
  },
  {
    title: 'AI Desktop Assistant',
    role: 'Developer',
    year: '2026',
    description:
      'A voice-activated, Jarvis-style desktop assistant with built-in speech-to-text, written in Python.',
    image: assistantImg,
    fit: 'cover',
    overview:
      'A desktop assistant that listens for spoken commands and carries them out, in the spirit of Jarvis. Speech is converted to text, the command is interpreted, the task runs on the computer, and the assistant answers out loud.',
    highlights: [
      'Speech-to-text so the assistant is driven entirely by voice',
      'Spoken replies, so a task can be finished without touching the keyboard',
      'Runs everyday desktop tasks such as opening programs and searching the web',
      'Built as separate modules, so a new command is added without touching the rest',
    ],
    tech: ['Python', 'Speech-to-text', 'AI prompt engineering'],
    links: [],
  },
  {
    title: 'Employee Payroll System',
    role: 'Microsoft Access',
    year: null,
    description:
      'Ensures efficient, accurate and organised payroll processing for an organisation by managing employee records, calculating salaries, processing payroll, handling deductions and automating data entry.',
    image: payrollImg,
    fit: 'cover',
    overview:
      'A database system that takes payroll off spreadsheets and paper. Employee records, salaries and deductions live in one place, and the monthly payroll run becomes a few clicks instead of a day of manual entry.',
    highlights: [
      'Employee records kept in one structured database',
      'Salaries calculated automatically, including deductions',
      'Forms for data entry, so staff never type into raw tables',
      'Reports for each payroll run, ready to print or file',
    ],
    tech: ['Microsoft Access', 'SQL', 'Database design'],
    links: [],
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

function Card({ work, onOpen }) {
  const tiltRef = useTilt();

  return (
    <button className="works__card" type="button" ref={tiltRef} onClick={() => onOpen(work)}>
      <div
        className={`works__thumb${work.image ? ' has-image' : ''}`}
        style={work.thumbBg ? { background: work.thumbBg } : undefined}
        aria-hidden="true"
      >
        {work.image ? (
          <img
            className={`works__img is-${work.fit || 'cover'}`}
            src={work.image}
            alt=""
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        ) : (
          <span className="works__initial">{work.title.charAt(0)}</span>
        )}
      </div>
      <div className="works__meta">
        <h3 className="works__title">{work.title}</h3>
        {work.year && <span className="works__year">{work.year}</span>}
      </div>
      <p className="works__role">{work.role}</p>
      <p className="works__desc">{work.description}</p>
      <span className="works__more">
        View project <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

// The case study. Portalled to <body> because .site-main carries the intro
// page-rise transform, and a transformed ancestor would trap this fixed
// overlay inside that box instead of pinning it to the viewport.
function ProjectDialog({ work, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const timer = window.setTimeout(() => {
      closeRef.current?.focus({ preventScroll: true });
    }, 60);

    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [onClose]);

  const mailto =
    `mailto:${EMAIL}?subject=` + encodeURIComponent(`About your project: ${work.title}`);

  return createPortal(
    <div
      className="pv"
      // Only a click on the backdrop itself closes: a click that started
      // inside the panel and drifted out would otherwise shut it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pv__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pv-title"
        ref={panelRef}
        data-lenis-prevent
      >
        <button className="pv__close" type="button" onClick={onClose} ref={closeRef}>
          <span className="pv__sr">Close</span>
          <span aria-hidden="true">✕</span>
        </button>

        <div className="pv__media">
          <img src={work.image} alt={`${work.title} preview`} draggable="false" />
        </div>

        <div className="pv__body">
          <p className="pv__role">
            {work.role}
            {work.year ? ` · ${work.year}` : ''}
          </p>
          <h2 className="pv__title" id="pv-title">
            {work.title}
          </h2>

          <p className="pv__overview">{work.overview || work.description}</p>

          {work.highlights?.length > 0 && (
            <>
              <h3 className="pv__sub">What it does</h3>
              <ul className="pv__list">
                {work.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </>
          )}

          {work.tech?.length > 0 && (
            <>
              <h3 className="pv__sub">Built with</h3>
              <ul className="pv__tags">
                {work.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          )}

          <div className="pv__actions">
            {work.links?.length > 0 ? (
              work.links.map((l, i) => (
                <a
                  key={l.href}
                  className={`pv__btn${i === 0 ? ' is-primary' : ''}`}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {l.label} <span aria-hidden="true">↗</span>
                </a>
              ))
            ) : (
              <a className="pv__btn is-primary" href={mailto}>
                Ask about this project <span aria-hidden="true">↗</span>
              </a>
            )}
            {/* The panel shows the whole image small; this opens it at full
                size, which is the only way to read a dense infographic. */}
            <a className="pv__btn" href={work.image} target="_blank" rel="noreferrer noopener">
              View full image <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function FeaturedWorks() {
  const [openWork, setOpenWork] = useState(null);
  // The card that opened the panel, so focus goes back to it on close rather
  // than jumping to the top of the page.
  const openerRef = useRef(null);

  const open = useCallback((work) => {
    openerRef.current = document.activeElement;
    setOpenWork(work);
  }, []);

  const close = useCallback(() => {
    setOpenWork(null);
    openerRef.current?.focus?.({ preventScroll: true });
  }, []);

  return (
    <section className="works" id="work">
      <h2 className="works__heading">Selected work</h2>
      <p className="works__lede">Open a project to see what it does and how it was built.</p>

      <ul className="works__grid">
        {WORKS.map((work) => (
          <li className="works__item" key={work.title}>
            <Card work={work} onOpen={open} />
          </li>
        ))}
      </ul>

      {openWork && <ProjectDialog work={openWork} onClose={close} />}
    </section>
  );
}
