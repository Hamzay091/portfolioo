import { useCallback, useEffect, useRef, useState } from 'react';
import './HeroReveal.css';

// Two stacked portraits. The top one has a hole punched in it that follows
// the pointer, so you see the layer below through a wobbling window.
//
// Swap these for your own two shots of the same framing and pose. They must
// differ, or the cursor hole reveals an identical picture and looks broken.
// Standing photo on top; the cursor hole reveals the seated photo beneath.
import portraitUnder from './assets/portrait-seated.jpg';
import portraitOver from './assets/portrait-standing.jpg';

const HOLE_RADIUS = 180;
const OFFSCREEN = -9999;

export default function HeroReveal() {
  const sectionRef = useRef(null);
  const runwayRef = useRef(null);
  const stageRef = useRef(null);
  const holeRef = useRef(null);

  const [active, setActive] = useState(false); // pointer is over the stage
  const [forced, setForced] = useState(false); // keyboard: reveal everything
  const [reduce, setReduce] = useState(false); // prefers-reduced-motion

  // JavaScript's only job is moving one SVG circle. Writing its attributes
  // directly means zero React re-renders per mouse move.
  const setPos = useCallback((clientX, clientY) => {
    const stage = stageRef.current;
    const hole = holeRef.current;
    if (!stage || !hole) return;
    const rect = stage.getBoundingClientRect();
    hole.setAttribute('cx', clientX - rect.left);
    hole.setAttribute('cy', clientY - rect.top);
  }, []);

  const hideHole = useCallback(() => {
    const hole = holeRef.current;
    if (!hole) return;
    hole.setAttribute('cx', OFFSCREEN);
    hole.setAttribute('cy', OFFSCREEN);
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
      const rect = runway.getBoundingClientRect();
      const pinDist = Math.max(1, runway.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / pinDist));
      const e = p * p; // squared = slow start, fast finish
      section.style.filter = `brightness(${1 - e * 0.55})`;
      // Hide only once the whole runway has scrolled out of view. Hiding at
      // p >= 1 blanks the stage while it is still fully on screen, because p
      // reaches 1 at the exact moment the sticky stage starts scrolling away,
      // and a hidden stage also stops receiving pointer events.
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
          onPointerLeave={() => {
            hideHole();
            setActive(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setForced((v) => !v);
            }
          }}
        >
          <img className="reveal-under" src={portraitUnder} alt="" />

          {/* The top portrait is drawn inside SVG so the wobble can live on
              the MASK, not on the photo. The filter distorts only the black
              circle that cuts the hole. Put it on the image instead and it
              melts the whole portrait and tears jagged gaps at the edges,
              which is exactly what the first version of this did. */}
          <svg
            className="reveal-top"
            role="img"
            aria-label="Portrait. Move your cursor across it to reveal the second frame."
          >
            <defs>
              {/* feTurbulence makes Perlin noise, feDisplacementMap uses it to
                  shove pixels around, which turns a boring circle into
                  something that looks alive. The region must overflow
                  generously or the displaced edge gets clipped and the blob
                  looks cut with scissors. */}
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

              {/* White keeps the photo, black punches through to the layer
                  below. Only the black circle is filtered. */}
              <mask
                id="revealHole"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect width="100%" height="100%" fill="white" />
                <circle
                  ref={holeRef}
                  cx={OFFSCREEN}
                  cy={OFFSCREEN}
                  r={HOLE_RADIUS}
                  fill="black"
                  filter={reduce ? undefined : 'url(#amoebaDistort)'}
                />
              </mask>
            </defs>

            {/* "slice" is the SVG equivalent of object-fit: cover. "YMin" pins
                the top edge instead of centring: these are portrait photos in
                a landscape stage, and centring crops the top of the head.
                Matches object-position on .reveal-under in the CSS. */}
            <image
              href={portraitOver}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMin slice"
              mask="url(#revealHole)"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
