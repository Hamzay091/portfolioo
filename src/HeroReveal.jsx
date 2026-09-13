import { useCallback, useEffect, useRef, useState } from 'react';
import './HeroReveal.css';

// Two different portraits: the cursor hole in the top one reveals the other.
import portraitUnder from './assets/portrait-under.jpg';
import portraitOver from './assets/portrait-top.jpg';

// Where each face sits, as a fraction of that photo's height (0 = top edge,
// 1 = bottom). Portrait photos in a landscape stage get cropped hard, and
// neither centring nor pinning the top edge keeps a face in frame across
// laptop, desktop and phone sizes. So the crop is placed around the face
// instead. If you swap a photo, re-measure its face centre and update this.
const FACE_CENTRE = { under: 0.285, top: 0.29 };

// Where on the stage the face centre should land. A little above the middle
// leaves room for shoulders below and a sliver of hair room above.
const FACE_LANDS_AT = 0.45;

const HOLE_RADIUS = 180;
const OFFSCREEN = -9999;

// Cover-style placement with a vertical focal point. Same maths as
// object-fit: cover, except the vertical offset centres the face rather than
// the image, clamped so the photo always fills the stage.
function coverAround(natW, natH, stageW, stageH, focus) {
  const scale = Math.max(stageW / natW, stageH / natH);
  const w = natW * scale;
  const h = natH * scale;
  const x = (stageW - w) / 2;
  const wanted = stageH * FACE_LANDS_AT - focus * h;
  const y = Math.min(0, Math.max(stageH - h, wanted));
  return { x, y, w, h };
}

const naturalSize = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });

export default function HeroReveal() {
  const sectionRef = useRef(null);
  const runwayRef = useRef(null);
  const stageRef = useRef(null);
  const holeRef = useRef(null);
  const underRef = useRef(null);
  const topImageRef = useRef(null);

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

  // Face-centred cropping for both layers, re-run whenever the stage resizes.
  // The bottom layer is an <img>, so it takes an object-position percentage.
  // The top layer is an SVG <image>, which has no percentage positioning, so
  // it gets explicit geometry. Both come from the same maths, so the two
  // photos always crop consistently.
  useEffect(() => {
    const stage = stageRef.current;
    const under = underRef.current;
    const top = topImageRef.current;
    if (!stage || !under || !top) return;

    let cancelled = false;
    let sizes = null;

    const layout = () => {
      if (!sizes) return;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;

      const u = coverAround(sizes.under.w, sizes.under.h, W, H, FACE_CENTRE.under);
      // object-position % means: offset = (container - image) * p
      const spare = H - u.h;
      const p = spare === 0 ? 0 : (u.y / spare) * 100;
      under.style.objectPosition = `50% ${p.toFixed(2)}%`;

      const t = coverAround(sizes.top.w, sizes.top.h, W, H, FACE_CENTRE.top);
      top.setAttribute('x', t.x.toFixed(1));
      top.setAttribute('y', t.y.toFixed(1));
      top.setAttribute('width', t.w.toFixed(1));
      top.setAttribute('height', t.h.toFixed(1));
      // Geometry already matches the photo's aspect ratio exactly.
      top.setAttribute('preserveAspectRatio', 'none');
    };

    Promise.all([naturalSize(portraitUnder), naturalSize(portraitOver)])
      .then(([u, t]) => {
        if (cancelled) return;
        sizes = { under: u, top: t };
        layout();
      })
      .catch(() => {
        // Leave the CSS / attribute fallbacks in place if a photo fails.
      });

    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
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
          <img className="reveal-under" ref={underRef} src={portraitUnder} alt="" />

          {/* The top portrait is drawn inside SVG so the wobble can live on
              the MASK, not on the photo. The filter distorts only the black
              circle that cuts the hole. Put it on the image instead and it
              melts the whole portrait and tears jagged gaps at the edges,
              which is exactly what the first version of this did. */}
          <svg
            className="reveal-top"
            role="img"
            aria-label="Portrait of Hamza Afzal. Move your cursor across it to reveal a second portrait."
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

            {/* Fallback until the face-centred layout runs: "slice" is cover,
                "YMin" pins the top edge. The layout effect then replaces this
                with explicit geometry. */}
            <image
              ref={topImageRef}
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
