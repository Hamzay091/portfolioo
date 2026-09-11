import { useRef, useState } from 'react';
import './Roles.css';

const ROLES = [
  { title: 'Design Engineer', note: 'Interfaces that survive contact with real data' },
  { title: 'Frontend', note: 'React, and the CSS nobody else wants to write' },
  { title: 'Motion', note: 'GSAP, scroll choreography, easing arguments' },
  { title: 'Prototyping', note: 'Answering "how would that feel" in an afternoon' },
];

export default function Roles({ ref }) {
  const sectionRef = useRef(null);
  const cursorRef = useRef(null);
  const [hovering, setHovering] = useState(false);

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
  const handleEnter = (e) => {
    positionAt(e);
    setHovering(true);
  };

  return (
    <section
      className="roles"
      ref={(node) => {
        sectionRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      onPointerEnter={handleEnter}
      onPointerMove={positionAt}
      onPointerLeave={() => setHovering(false)}
    >
      <h2 className="roles__heading">What I actually do</h2>

      <ul className="roles__list">
        {ROLES.map((role) => (
          <li className="roles__item" key={role.title} tabIndex={0}>
            <span className="roles__title">{role.title}</span>
            <span className="roles__note">{role.note}</span>
          </li>
        ))}
      </ul>

      {/* Drop `muted` and mobile Safari refuses to autoplay. Drop
          `playsInline` and iOS hijacks it fullscreen, which is a memorable
          way to ruin a hover effect. */}
      <div
        className={`roles__cursor${hovering ? ' is-visible' : ''}`}
        ref={cursorRef}
        aria-hidden="true"
      >
        {/* Add src="..." once you have a short compressed loop. */}
        <video muted playsInline loop autoPlay preload="none" />
      </div>
    </section>
  );
}
