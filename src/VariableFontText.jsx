import { Fragment, useEffect, useRef } from 'react';
import './VariableFontText.css';

export const DEFAULTS = {
  thinWght: 100,
  boldWght: 820, // dramatic range = visible effect
  thinWdth: 25,
  boldWdth: 151, // width matters more than you'd think
  entranceDuration: 0.9,
  entranceEasing: 'cubic-bezier(0.16, 1, 0.3, 1)', // expo-out
  stagger: 0.045, // 45ms: below ~30 reads as one blob, above ~80 as a typewriter
  pinchRadius: 150, // px - the influence bubble
  hoverTransition: '0.25s ease-out',
  inViewThreshold: 0.6,
};

const fvs = (wght, wdth) => `"wght" ${wght}, "wdth" ${wdth}`;

export default function VariableFontText({
  text = '',
  as: Tag = 'span',
  className = '',
  ...opts
}) {
  const rootRef = useRef(null);
  const cfg = { ...DEFAULTS, ...opts };

  // Letters are grouped into words so lines can only wrap BETWEEN words.
  // Every letter is its own inline-block, and each inline-block boundary is a
  // legal line break, so ungrouped letters wrap mid-word on long headlines.
  const words = text.split(' ');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const spans = Array.from(root.querySelectorAll('[data-vft-letter]'));
    if (!spans.length) return;

    const {
      thinWght, boldWght, thinWdth, boldWdth,
      entranceDuration, entranceEasing, stagger,
      pinchRadius, hoverTransition, inViewThreshold,
    } = cfg;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      // Jump to the end state instantly. No listeners, no rAF loop.
      spans.forEach((s) => {
        s.style.fontVariationSettings = fvs(boldWght, boldWdth);
      });
      return;
    }

    let raf = 0;
    let entered = false;
    let cleanupMove = null;
    let pinchTimer = 0;

    const startPinch = () => {
      const onMove = (e) => {
        if (raf) return; // one write per frame, no exceptions
        raf = requestAnimationFrame(() => {
          raf = 0;
          spans.forEach((s) => {
            const r = s.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            const d = Math.hypot(dx, dy);
            // At d=0 the fraction is 1, so pure thin. Past pinchRadius,
            // max(0, negative) clamps to 0, so pure bold.
            const t = Math.max(0, 1 - d / pinchRadius);
            s.style.transition = `font-variation-settings ${hoverTransition}`;
            s.style.fontVariationSettings = fvs(
              Math.round(boldWght + (thinWght - boldWght) * t),
              Math.round(boldWdth + (thinWdth - boldWdth) * t),
            );
          });
        });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanupMove = () => window.removeEventListener('pointermove', onMove);
    };

    const runEntrance = () => {
      if (entered) return;
      entered = true;

      spans.forEach((s) => {
        s.style.transition = 'none';
        s.style.fontVariationSettings = fvs(thinWght, thinWdth);
      });

      // Reading a layout property forces a synchronous reflow, which commits
      // the "from" state above before the transition below is attached.
      // Looks like dead code. Is load-bearing. Do not delete.
      void root.offsetWidth;

      spans.forEach((s, i) => {
        s.style.transition = `font-variation-settings ${entranceDuration}s ${entranceEasing}`;
        s.style.transitionDelay = `${i * stagger}s`;
        s.style.fontVariationSettings = fvs(boldWght, boldWdth);
      });

      // Tracked so cleanup can cancel it. Otherwise an unmount mid-entrance
      // still attaches a pointermove listener that nothing ever removes.
      pinchTimer = window.setTimeout(
        startPinch,
        (entranceDuration + spans.length * stagger) * 1000,
      );
    };

    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) runEntrance(); },
      { threshold: inViewThreshold },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      clearTimeout(pinchTimer);
      if (raf) cancelAnimationFrame(raf);
      cleanupMove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Tag className={`vft ${className}`.trim()} ref={rootRef} aria-label={text}>
      {/* The characters stay real text in the DOM, so Ctrl+F still finds your
          name. They are hidden from assistive tech only so a screen reader
          announces the whole phrase once from aria-label, instead of spelling
          it out one letter at a time. */}
      <span aria-hidden="true">
        {words.map((word, w) => (
          <Fragment key={w}>
            {w > 0 && ' '}
            <span className="vft__word">
              {/* Spread, not .split('') - handles emoji and accents correctly. */}
              {[...word].map((ch, i) => (
                <span key={i} data-vft-letter>
                  {ch}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
