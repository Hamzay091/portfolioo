import VariableFontText from './VariableFontText.jsx';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <h1 className="hero__headline">
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
