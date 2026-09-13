import VariableFontText from './VariableFontText.jsx';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <h1 className="hero__headline">
        <VariableFontText as="span" text="I design" className="hero__line" />
        {/* The lines are display:block, so this space is invisible. It is
            still load-bearing: without it the accessible name and Ctrl+F both
            read "I designand I build". */}
        {' '}
        <VariableFontText as="span" text="and I build" className="hero__line" />
      </h1>

      <p className="hero__sub">
        Interfaces with weight, inertia and a little overshoot. Mostly on the
        web, occasionally on paper.
      </p>
    </section>
  );
}
