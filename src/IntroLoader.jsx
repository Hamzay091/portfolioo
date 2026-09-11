import sigRaw from './assets/signature.svg?raw';
import './IntroLoader.css';

// Vite's ?raw gives us the SVG as a string, so we can inject pathLength="1"
// into every path without editing the file by hand. pathLength makes the
// browser pretend every path is exactly 1 unit long, whatever its real
// length, so one dasharray value draws them all.
const sigMarkup = sigRaw.replace(/<path /g, '<path pathLength="1" ');

export default function IntroLoader({ onComplete }) {
  return (
    <div
      className="intro-loader"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        // Let CSS tell React when it's done. No setTimeout(2500) - timeouts
        // drift, and the moment you tweak the duration the two fall out of
        // sync. The animation is the source of truth.
        if (e.animationName === 'intro-lift') onComplete?.();
      }}
      dangerouslySetInnerHTML={{ __html: `<div class="intro-sig">${sigMarkup}</div>` }}
    />
  );
}
