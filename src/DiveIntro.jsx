import { useEffect, useRef } from 'react';
import './DiveIntro.css';

// The transition that sells "you are entering something": scrolling flies the
// camera down a tunnel of glowing particles toward a turning wireframe core,
// light streaks appear when you scroll fast, and the line of copy resolves out
// of blur as you arrive. The scene itself lives in tunnelScene.js.
export default function DiveIntro() {
  const runwayRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const lineRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const line = lineRef.current;
    const hint = hintRef.current;
    if (!runway || !stage || !canvas || !line) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let dispose = null;

    // Dynamic import: Three.js downloads as a separate file after the page has
    // rendered, instead of doubling the size of the first load. The effect
    // may be cleaned up before it arrives (StrictMode does exactly that), so
    // check before building anything.
    import('./tunnelScene.js')
      .then(({ createTunnel }) => {
        if (disposed) return;
        dispose = createTunnel({ runway, stage, canvas, line, hint, reduce });
      })
      .catch(() => {
        // Chunk failed to load (offline, blocked): fall back to plain copy.
        if (!disposed) stage.classList.add('is-static');
      });

    return () => {
      disposed = true;
      dispose?.();
    };
  }, []);

  return (
    <section className="dive-intro" aria-label="Introduction">
      <div className="dive-intro__runway" ref={runwayRef}>
        <div className="dive-intro__stage" ref={stageRef}>
          <canvas className="dive-intro__canvas" ref={canvasRef} aria-hidden="true" />
          <p className="dive-intro__line" ref={lineRef}>
            A practical problem-solver focused on building clean, user-friendly
            software solutions.
          </p>
          <span className="dive-intro__hint" ref={hintRef} aria-hidden="true">
            Scroll to dive in
          </span>
        </div>
      </div>
    </section>
  );
}
