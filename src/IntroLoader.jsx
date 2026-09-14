import signature from './assets/signature-hamza.png';
import './IntroLoader.css';

// Hamza's handwritten signature, revealed left to right like a pen stroke,
// then the whole panel lifts away. The signature is a picture, not vector
// paths, so a feathered mask sweeps across it instead of drawing strokes.
export default function IntroLoader({ onComplete }) {
  return (
    <div
      className="intro-loader"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        // Let CSS tell React when it's done. No setTimeout(2500) - timeouts
        // drift, and the moment you tweak the duration the two fall out of
        // sync. The animation is the source of truth. Other animations
        // bubble up here too, so only the lift counts.
        if (e.animationName === 'intro-lift') onComplete?.();
      }}
    >
      <img className="intro-sig" src={signature} alt="" draggable="false" />
    </div>
  );
}
