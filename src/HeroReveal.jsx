import { useEffect, useRef, useState } from 'react';
import './HeroReveal.css';

import portraitStanding from './assets/portrait-standing.jpg';
import portraitSeated from './assets/portrait-seated.jpg';

// One centered portrait at a time, crossfading to the next on a timer.
const PHOTOS = [portraitStanding, portraitSeated];
const SHOW_MS = 4000; // how long each photo stays fully visible
const FADE_MS = 1200; // crossfade length; must match --fade in the CSS

export default function HeroReveal({ paused = false }) {
  const sectionRef = useRef(null);
  const runwayRef = useRef(null);
  const [active, setActive] = useState(0);

  // Advance on a timer, but only while the hero is on screen, the tab is
  // visible and the intro is gone. Otherwise the photo keeps changing where
  // nobody can see it: behind the intro it would swap almost as soon as the
  // intro lifted. When `paused` flips off, the timer starts from zero.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let timer = 0;
    let onScreen = true;

    const stop = () => {
      clearTimeout(timer);
      timer = 0;
    };
    const schedule = () => {
      stop();
      if (paused || !onScreen || document.hidden) return;
      timer = window.setTimeout(() => {
        setActive((i) => (i + 1) % PHOTOS.length);
        schedule();
      }, SHOW_MS + FADE_MS);
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      schedule();
    });
    io.observe(section);

    const onVisibility = () => schedule();
    document.addEventListener('visibilitychange', onVisibility);

    schedule();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [paused]);

  // Brightness fade on scroll. No timeline, no ScrollTrigger, just maths on
  // scroll progress - sometimes a raw listener really is the simpler tool.
  useEffect(() => {
    const section = sectionRef.current;
    const runway = runwayRef.current;
    if (!section || !runway) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = runway.getBoundingClientRect();
      const pinDist = Math.max(1, runway.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / pinDist));
      const e = p * p; // squared = slow start, fast finish
      section.style.filter = `brightness(${1 - e * 0.55})`;
      // Hide only once the whole runway has scrolled out of view. Hiding at
      // p >= 1 blanks the stage while it is still fully on screen, because p
      // reaches 1 at the exact moment the sticky stage starts scrolling away.
      section.style.visibility = rect.bottom <= 0 ? 'hidden' : 'visible';
    };

    // Scroll fires far more often than the screen refreshes. This guard
    // collapses a burst of events into exactly one paint per frame.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero-reveal" ref={sectionRef}>
      <div className="hero-reveal__runway" ref={runwayRef}>
        <div className="hero-reveal__stage">
          <div
            className="hero-reveal__frame"
            role="img"
            aria-label="Portraits of Hamza Afzal"
            style={{ '--fade': `${FADE_MS}ms` }}
          >
            {PHOTOS.map((src, i) => (
              <img
                key={src}
                className={`hero-reveal__photo${i === active ? ' is-active' : ''}`}
                src={src}
                alt=""
                draggable="false"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
