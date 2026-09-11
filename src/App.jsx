import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import IntroLoader from './IntroLoader.jsx';
import ScrollBackground from './ScrollBackground.jsx';
import FixedVideoBg from './FixedVideoBg.jsx';
import HeroReveal from './HeroReveal.jsx';
import DiveIntro from './DiveIntro.jsx';
import ScrollCurve from './ScrollCurve.jsx';
import Hero from './Hero.jsx';
import Roles from './Roles.jsx';
import FeaturedWorks from './FeaturedWorks.jsx';
import Contact from './Contact.jsx';
import Footer from './Footer.jsx';

gsap.registerPlugin(ScrollTrigger);

// Read once at module scope, before first paint, so the intro never
// starts for someone who asked their OS for less motion.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const [showIntro, setShowIntro] = useState(!prefersReducedMotion);
  const [studioReached, setStudioReached] = useState(false);

  const curveRegionRef = useRef(null);
  const studioRef = useRef(null);

  // Lock the page while the signature draws. Save and restore the previous
  // value rather than hardcoding '' - the discipline pays off later.
  useEffect(() => {
    if (!showIntro) return;
    window.scrollTo(0, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showIntro]);

  // Smooth scroll. Native scroll is instant and slightly brutal; Lenis
  // interpolates toward the target over ~0.8s so the page acquires weight.
  useEffect(() => {
    if (showIntro) return; // don't scroll during the loader

    const lenis = new Lenis({
      duration: 0.8,
      // Exponential ease-out: ~87% of the distance by t=0.3, then it crawls
      // the last 13%. That asymmetry is what "heavy object coming to rest"
      // feels like. The 1.001 is a fudge so it actually reaches 1.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true, // #contact links glide instead of jump
    });

    // THE LINE. ScrollTrigger now reads Lenis' interpolated position instead
    // of the browser's raw one. Without it every scrubbed animation lags one
    // frame behind the scroll and looks broken.
    lenis.on('scroll', ScrollTrigger.update);

    let id = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    });

    ScrollTrigger.refresh();

    // Not optional. StrictMode mounts twice in dev, and two Lenis instances
    // fighting over the scroll position makes the page vibrate.
    return () => {
      cancelAnimationFrame(id);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
    };
  }, [showIntro]);

  // The one intersection the app cares about: has the reader arrived at the
  // roles section? ScrollBackground zooms when they have.
  useEffect(() => {
    const el = studioRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStudioReached(entry.isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [showIntro]);

  return (
    <>
      {showIntro && <IntroLoader onComplete={() => setShowIntro(false)} />}

      <ScrollBackground zoomed={studioReached} />
      <FixedVideoBg />

      <main className="site-main">
        <HeroReveal />
        <DiveIntro />

        <div className="curve-region" ref={curveRegionRef}>
          {/* Renders before Hero on purpose: earlier siblings paint
              underneath later ones, so the curve sits behind the headline
              without a single z-index. DOM order is free stacking. */}
          <ScrollCurve regionRef={curveRegionRef} />
          <Hero />
          <Roles ref={studioRef} />
        </div>

        <FeaturedWorks />
        <Contact />
      </main>

      {/* Footer lives OUTSIDE .site-main on purpose: .site-main carries the
          intro `page-rise` transform, and any transformed ancestor silently
          breaks `position: sticky` in its descendants. As a sibling it has no
          transformed ancestor, so the sticky pin resolves against the document
          scroll and stays glued to the bottom of the viewport. */}
      <Footer />
    </>
  );
}
