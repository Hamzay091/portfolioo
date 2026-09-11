import { useCallback, useEffect, useRef, useState } from 'react';
import './HeroReveal.css';

// Two stacked portraits. The top one has a hole punched in it that follows
// the pointer, so you see the layer below through a wobbling window.
//
// Swap these for your own two shots of the same framing and pose.
import portraitUnder from './assets/hero.png';
import portraitOver from './assets/hero.png';

export default function HeroReveal() {
  const sectionRef = useRef(null);
  const runwayRef = useRef(null);
  const stageRef = useRef(null);

  const [active, setActive] = useState(false); // pointer is over the stage
  const [forced, setForced] = useState(false); // keyboard: reveal everything
  const [reduce, setReduce] = useState(false); // prefers-reduced-motion

  // JavaScript's only job is writing two CSS variables. CSS does the rest,
  // which means zero React re-renders per mouse move.
  const setPos = useCallback((clientX, clientY) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${clientX - rect.left}px`);
    el.style.setProperty('--my', `${clientY - rect.top}px`);
  }, []);

  // Subscribe rather than read once, so toggling the OS setting updates the
  // page immediately instead of on next reload.
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(m.matches);
    sync();
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, []);

  // Brightness fade on scroll. No timeline, no ScrollTrigger, just maths on
  // scroll progress - sometimes a raw listener really is the simpler tool.
  useEffect(() => {
    const section = sectionRef.current;
    const runway = runwayRef.current;
    if (!section || !runway) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const pinDist = Math.max(1, runway.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -runway.getBoundingClientRect().top / pinDist));
      const e = p * p; // squared = slow start, fast finish
      section.style.filter = `brightness(${1 - e * 0.55})`;
      section.style.visibility = p >= 1 ? 'hidden' : 'visible';
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

  const revealAll = reduce || forced;

  return (
    <section className="hero-reveal" ref={sectionRef}>
      <div className="hero-reveal__runway" ref={runwayRef}>
        <div
          className={
            'hero-reveal__stage' +
            (active ? ' is-active' : '') +
            (revealAll ? ' is-revealed' : '')
          }
          ref={stageRef}
          tabIndex={0}
          role="button"
          aria-pressed={forced}
          aria-label="Reveal the second portrait"
          onPointerMove={(e) => setPos(e.clientX, e.clientY)}
          onPointerEnter={(e) => {
            setPos(e.clientX, e.clientY); // position BEFORE revealing
            setActive(true);
          }}
          onPointerLeave={() => setActive(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setForced((v) => !v);
            }
          }}
        >
          <img className="reveal-under" src={portraitUnder} alt="" />
          <img
            className="reveal-top"
            src={portraitOver}
            alt="Portrait. Move your cursor across it to reveal the second frame."
          />

          {/* feTurbulence makes Perlin noise, feDisplacementMap uses it to
              shove pixels around, which turns a boring circle into something
              that looks alive. The region must overflow generously or the
              displaced pixels get clipped and the blob looks cut with scissors. */}
          <svg className="hero-reveal__defs" aria-hidden="true" focusable="false">
            <filter id="amoebaDistort" x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence
                type="turbulence"
                baseFrequency="0.013"
                numOctaves="2"
                seed="4"
                result="noise"
              >
                {/* animate the noise itself so the blob breathes */}
                <animate
                  attributeName="baseFrequency"
                  dur="12s"
                  values="0.009;0.018;0.012;0.009"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="60"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </svg>
        </div>
      </div>
    </section>
  );
}
