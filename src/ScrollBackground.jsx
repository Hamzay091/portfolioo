import './ScrollBackground.css';

// Background colour/scale layers. Zooms once the reader reaches the roles
// section, which is the only cross-section state App.jsx tracks.
export default function ScrollBackground({ zoomed = false }) {
  return (
    <div
      className={`scroll-bg${zoomed ? ' is-zoomed' : ''}`}
      aria-hidden="true"
    >
      <div className="scroll-bg__layer" />
    </div>
  );
}
