import { useRef, useState } from 'react';
import rolesLoop from './assets/roles-loop.mp4';
import './Roles.css';

const ROLES = [
  { title: 'Mobile App Developer', note: 'Hands-on experience with Flutter and Dart' },
  { title: 'Software Engineer', note: 'Developing solutions' },
  { title: 'UI/UX Designer', note: 'Creating user interfaces with Figma' },
  { title: 'Cloud Foundations', note: 'Basic knowledge of networking and Microsoft Azure' },
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
      <h2 className="roles__heading">What I do</h2>

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
        <video src={rolesLoop} muted playsInline loop autoPlay preload="none" />
      </div>
    </section>
  );
}
