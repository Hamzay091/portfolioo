import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollCurve.css';

gsap.registerPlugin(ScrollTrigger);

// Where the "I" lives and where the line lands. Both are queried inside the
// curve region, so this component stays decoupled from Hero and Roles markup
// beyond these two selectors.
const ANCHOR_SELECTOR = '.hero__headline [data-vft-letter]';
const TARGET_SELECTOR = '.roles__heading';

let measureCtx = null;

// Canvas 2D measurement of the "I" glyph. Fonts render differently per
// browser, per device and per font-load state, so measure, never assume.
// Returns the ink centre of the stem as a fraction of the advance width, and
// the baseline offset from the top of the letter box.
function measureStem(span) {
  const cs = getComputedStyle(span);
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

  const m = measureCtx.measureText('I');
  const advance = m.width || 1;
  // actualBoundingBoxLeft is measured leftwards from the text origin.
  const inkCentre = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;

  const fontSize = parseFloat(cs.fontSize);
  const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.2;
  const ascent = m.fontBoundingBoxAscent ?? fontSize * 0.8;
  const descent = m.fontBoundingBoxDescent ?? fontSize * 0.2;
  const halfLeading = (lineHeight - (ascent + descent)) / 2;

  return {
    stemFraction: Math.min(1, Math.max(0, inkCentre / advance)),
    baselineOffset: halfLeading + ascent,
  };
}

export default function ScrollCurve({ regionRef }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    const region = regionRef?.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!region || !svg || !path) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const findAnchor = () =>
      Array.from(region.querySelectorAll(ANCHOR_SELECTOR)).find(
        (s) => s.textContent === 'I',
      );

    let stem = null;
    const remeasure = () => {
      const a = findAnchor();
      stem = a ? measureStem(a) : null;
    };

    // Re-read positions every frame. The headline can be moving under scroll
    // at the same moment, so the origin of the curve is a moving target.
    let lastD = '';
    const rebuild = () => {
      const anchor = findAnchor();
      const target = region.querySelector(TARGET_SELECTOR);
      if (!anchor || !target) return;
      if (!stem) remeasure();

      const r = region.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const t = target.getBoundingClientRect();

      // The span's rendered width already includes the variable "wdth" axis,
      // which canvas can't express, so scale the measured fraction onto it.
      const x0 = a.left - r.left + a.width * stem.stemFraction;
      const y0 = a.top - r.top + Math.min(a.height, stem.baselineOffset);

      // Clamped so on narrow screens the line never lands on the page edge,
      // where half the stroke would be clipped.
      const x1 = Math.max(12, t.left - r.left - 24);
      const y1 = t.top - r.top + t.height / 2;

      const h = Math.max(1, y1 - y0);
      const w = r.width;

      // One gentle S: drop straight out of the stem, swing right across the
      // page, then come back in to land beside the roles heading.
      const c1x = x0;
      const c1y = y0 + h * 0.55;
      const c2x = Math.min(w - 24, x1 + w * 0.45);
      const c2y = y1 - h * 0.35;

      const d =
        `M${x0.toFixed(1)},${y0.toFixed(1)} ` +
        `C${c1x.toFixed(1)},${c1y.toFixed(1)} ` +
        `${c2x.toFixed(1)},${c2y.toFixed(1)} ` +
        `${x1.toFixed(1)},${y1.toFixed(1)}`;

      // Skip the DOM write when nothing moved. One write per frame at most.
      if (d !== lastD) {
        path.setAttribute('d', d);
        lastD = d;
      }
    };

    // Only loop while the region is on screen.
    let raf = 0;
    let visible = false;
    const tick = () => {
      rebuild();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(region);

    // Font metrics change when Roboto Flex finishes loading and on resize.
    const onResize = () => {
      remeasure();
      rebuild();
    };
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);

    remeasure();
    rebuild();

    const ctx = gsap.context(() => {
      if (reduce) {
        // Reduced is not removed: show the finished line, just don't animate it.
        gsap.set(path, { strokeDashoffset: 0 });
        return;
      }
      gsap.fromTo(
        path,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: region,
            start: 'top 15%',
            endTrigger: region.querySelector(TARGET_SELECTOR) || region,
            end: 'center 55%',
            scrub: true,
          },
        },
      );
    }, svg);

    return () => {
      ctx.revert();
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [regionRef]);

  return (
    <svg className="scroll-curve" ref={svgRef} aria-hidden="true" focusable="false">
      {/* pathLength="1": same trick as the signature, so dashoffset 1 -> 0
          draws the whole line regardless of its real length in pixels. */}
      <path ref={pathRef} pathLength="1" d="M0,0" />
    </svg>
  );
}
