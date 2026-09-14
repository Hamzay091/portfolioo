import { useEffect, useRef, useState } from 'react';
import rolesLoop from './assets/roles-loop.mp4';
import './Roles.css';

const ROLES = [
  { title: 'Mobile App Developer', note: 'Hands-on experience with Flutter and Dart' },
  { title: 'Software Engineer', note: 'Developing solutions' },
  { title: 'UI/UX Designer', note: 'Creating user interfaces with Figma' },
  { title: 'Cloud Foundations', note: 'Basic knowledge of networking and Microsoft Azure' },
];

// The floating video follows a mouse. On touch screens there is no cursor to
// follow, and a tap counts as the pointer "entering" the section, which left
// the box stuck over the text. Touch devices also don't need to download the
// ~2 MB loop for an effect they can't show.
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

function useFinePointer() {
  const [fine, setFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(FINE_POINTER);
    const sync = () => setFine(m.matches);
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, []);
  return fine;
}

export default function Roles({ ref }) {
  const sectionRef = useRef(null);
  const cursorRef = useRef(null);
  const [hovering, setHovering] = useState(false);
  const finePointer = useFinePointer();

  const positionAt = (e) => {
    const section = sectionRef.current;
    const cursor = cursorRef.current;
    if (!section || !cursor) return;
    const rect = section.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Second translate offsets the video below-right of the pointer instead
    // of underneath it, where it would block the text being read.
    cursor.style.transform = `translate(${x}px, ${y}px) translate(18px, 24px)`;
  };

  // Position BEFORE fading in, or it flashes at the section's top-left corner
  // for one frame until the first mousemove lands. Nobody can articulate what
  // they saw, they just come away feeling the site is slightly cheap.
  // Mouse only: on a laptop with a touchscreen, a finger tap must not open it.
  const handleEnter = (e) => {
    if (e.pointerType !== 'mouse') return;
    positionAt(e);
    setHovering(true);
  };

  const handleMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    positionAt(e);
  };

  return (
    <section
      className="roles"
      ref={(node) => {
        sectionRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      onPointerEnter={finePointer ? handleEnter : undefined}
      onPointerMove={finePointer ? handleMove : undefined}
      onPointerLeave={finePointer ? () => setHovering(false) : undefined}
    >
      <h2 className="roles__heading">What I do</h2>

      <ul className="roles__list">
        {ROLES.map((role) => (
          <li className="roles__item" key={role.title} tabIndex={0}>
            <span className="roles__title">{role.title}</span>
            <span className="roles__note">{role.note}</span>
          </li>
        ))}
      </ul>

      {/* Only rendered for a real mouse, so phones never download the video.
          Drop `muted` and mobile Safari refuses to autoplay. Drop
          `playsInline` and iOS hijacks it fullscreen. */}
      {finePointer && (
        <div
          className={`roles__cursor${hovering ? ' is-visible' : ''}`}
          ref={cursorRef}
          aria-hidden="true"
        >
          <video src={rolesLoop} muted playsInline loop autoPlay preload="none" />
        </div>
      )}
    </section>
  );
}
