import { useEffect, useRef } from 'react';
import VariableFontText from './VariableFontText.jsx';
import './Hero.css';

export default function Hero() {
  const headlineRef = useRef(null);

  // 3D word reveal: each word flips up from below its baseline when the
  // headline scrolls into view, staggered word by word. It runs alongside the
  // variable-font entrance inside VariableFontText, which animates the letter
  // weights at the same time.
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;

    headline.querySelectorAll('.vft__word').forEach((word, i) => {
      word.style.setProperty('--i', i);
    });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      headline.classList.add('is-in');
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          headline.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(headline);
    return () => io.disconnect();
  }, []);

  return (
    <section className="hero" id="top">
      <h1 className="hero__headline" ref={headlineRef}>
        <VariableFontText as="span" text="I build web and mobile apps" className="hero__line" />
        {/* The lines are display:block, so this space is invisible. It is
            still load-bearing: without it the accessible name and Ctrl+F both
            run the two lines together into one word. */}
        {' '}
        <VariableFontText as="span" text="and cloud-integrated systems" className="hero__line" />
      </h1>

      <p className="hero__sub">
        Computer Science graduate from the University of Central Punjab,
        focused on mobile app development, UI/UX design, and cloud-integrated
        systems.
      </p>
    </section>
  );
}
