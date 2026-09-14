import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './Nav.css';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'what-i-do', label: 'What I do' },
  { id: 'skills', label: 'Skills' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
];

const EMAIL = 'devhamzay@gmail.com';
const DESKTOP = '(min-width: 900px)';

// A label on two faces of a tiny cube. Hovering rolls the cube a quarter turn
// so the accent-coloured face comes to the front. Purely visual: the link's
// real name comes from a visually hidden span, so it is read out once.
function CubeLabel({ text }) {
  return (
    <span className="nav__cube" aria-hidden="true">
      <span className="nav__face nav__face--front">{text}</span>
      <span className="nav__face nav__face--top">{text}</span>
    </span>
  );
}

export default function Nav({ ready = true }) {
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const barRef = useRef(null);
  const listRef = useRef(null);
  const toggleRef = useRef(null);
  const overlayRef = useRef(null);

  // Which section is on screen: the one crossing a thin band just above the
  // middle of the viewport.
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Tip the bar away while scrolling down, swing it back on the way up.
  // Deltas accumulate until they pass a threshold, because smooth scrolling
  // moves only a few pixels per frame.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      if (y < 120) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(dy) > 8) {
        setHidden(dy > 0);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Slide the glowing pill under the active link. Measured, not guessed:
  // link widths depend on the font and its load state.
  const placeIndicator = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const link = list.querySelector(`[data-id="${active}"]`);
    if (!link || !link.offsetWidth) return;
    list.style.setProperty('--ind-x', `${link.offsetLeft}px`);
    list.style.setProperty('--ind-w', `${link.offsetWidth}px`);
  }, [active]);

  useLayoutEffect(() => {
    placeIndicator();
  }, [placeIndicator]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(placeIndicator);
    ro.observe(list);
    document.fonts?.ready.then(placeIndicator);
    return () => ro.disconnect();
  }, [placeIndicator]);

  // Subtle 3D tilt of the bar toward the mouse. JavaScript only writes two
  // CSS variables, at most once per frame. Skipped for touch and reduced motion.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      bar.style.setProperty('--tilt-x', `${(-py * 12).toFixed(2)}deg`);
      bar.style.setProperty('--tilt-y', `${(px * 6).toFixed(2)}deg`);
    };
    const onMove = (e) => {
      const r = bar.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      bar.style.setProperty('--tilt-x', '0deg');
      bar.style.setProperty('--tilt-y', '0deg');
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerleave', onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // Full-screen menu: lock page scroll, Escape closes, focus moves into the
  // menu and back to the button afterwards.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);

    const focusTimer = window.setTimeout(() => {
      overlayRef.current?.querySelector('a')?.focus({ preventScroll: true });
    }, 60);

    const toggle = toggleRef.current;
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
      toggle?.focus({ preventScroll: true });
    };
  }, [open]);

  // Widening the window to desktop size closes the phone menu.
  useEffect(() => {
    const m = window.matchMedia(DESKTOP);
    const onChange = () => {
      if (m.matches) setOpen(false);
    };
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  const close = () => setOpen(false);

  const classes = [
    'nav',
    ready && 'is-ready',
    hidden && !open && 'is-hidden',
    open && 'is-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      {/* The shell carries the drop-in and hide transforms. The overlay must
          stay OUTSIDE it: a transformed ancestor would trap the fixed-position
          overlay inside the shell's box instead of the viewport. */}
      <div className="nav__shell">
        <div className="nav__bar" ref={barRef}>
          <a className="nav__brand" href="#home" onClick={close}>
            Hamza Afzal
          </a>

          <nav className="nav__desktop" aria-label="Main">
            <ul className="nav__list" ref={listRef}>
              <li className="nav__indicator" aria-hidden="true" />
              {LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    className={`nav__link${active === l.id ? ' is-active' : ''}`}
                    href={`#${l.id}`}
                    data-id={l.id}
                    aria-current={active === l.id ? 'true' : undefined}
                  >
                    <span className="nav__sr">{l.label}</span>
                    <CubeLabel text={l.label} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={toggleRef}
            className="nav__toggle"
            type="button"
            aria-expanded={open}
            aria-controls="nav-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="nav__toggle-line" />
            <span className="nav__toggle-line" />
          </button>
        </div>
      </div>

      {/* data-lenis-prevent stops smooth scroll from moving the page behind
          the open menu. inert keeps the closed menu out of the tab order. */}
      <div id="nav-menu" className="nav__overlay" ref={overlayRef} data-lenis-prevent inert={!open}>
        <nav aria-label="Menu">
          <ul className="nav__menu">
            {LINKS.map((l, i) => (
              <li key={l.id} style={{ '--i': i }}>
                <a
                  className={`nav__menu-link${active === l.id ? ' is-active' : ''}`}
                  href={`#${l.id}`}
                  onClick={close}
                  aria-current={active === l.id ? 'true' : undefined}
                >
                  <span className="nav__menu-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="nav__menu-label">{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="nav__menu-foot">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </div>
    </header>
  );
}
