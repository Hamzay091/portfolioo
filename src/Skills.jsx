import { useEffect, useRef } from 'react';
import './Skills.css';

// Grouped so fourteen skills read as five scannable sets instead of one long
// list. `note` renders as a small line under the name.
const GROUPS = [
  {
    title: 'Programming',
    items: [{ name: 'C++' }, { name: 'Python' }, { name: 'SQL' }],
  },
  {
    title: 'App, Web & Game Development',
    items: [
      { name: 'Flutter & Dart', note: 'Mobile Development' },
      { name: 'Web Development & Design' },
      { name: 'Unity' },
      { name: 'Microsoft Access' },
    ],
  },
  {
    title: 'Design & Media',
    items: [
      { name: 'Figma', note: 'UI/UX Design' },
      { name: 'Graphic Designing' },
      { name: 'Video Editing' },
    ],
  },
  {
    title: 'Cloud & Networking',
    items: [
      { name: 'Microsoft Azure', note: 'Cloud Foundations' },
      { name: 'CCNA', note: 'Networking Basics' },
    ],
  },
  {
    title: 'AI & Productivity',
    items: [{ name: 'AI Prompt Engineering' }, { name: 'Data Entry' }],
  },
];

export default function Skills() {
  const sectionRef = useRef(null);

  // The groups swing up in 3D and the chips pop in one after another, once,
  // the first time the section scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="skills" id="skills" ref={sectionRef}>
      <h2 className="skills__heading">Computer skills</h2>

      <div className="skills__grid">
        {GROUPS.map((group, gi) => (
          <div className="skills__group" key={group.title} style={{ '--gi': gi }}>
            <h3 className="skills__group-title">{group.title}</h3>
            <ul className="skills__list">
              {group.items.map((item, ci) => (
                <li className="skills__chip" key={item.name} style={{ '--ci': ci }}>
                  <span className="skills__name">{item.name}</span>
                  {item.note && <span className="skills__note">{item.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
