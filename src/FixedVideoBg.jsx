import './FixedVideoBg.css';

// Full-bleed ambient video sitting behind everything.
// muted + playsInline are load-bearing: drop muted and mobile Safari refuses
// to autoplay, drop playsInline and iOS hijacks it fullscreen.
export default function FixedVideoBg({ src, poster }) {
  if (!src) return null;

  return (
    <div className="fixed-video-bg" aria-hidden="true">
      <video
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        autoPlay
        preload="none"
      />
    </div>
  );
}
