import VariableFontText from './VariableFontText.jsx';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <h1 className="hero__headline">
        <VariableFontText as="span" text="I design" className="hero__line" />
        <VariableFontText as="span" text="and I build" className="hero__line" />
      </h1>

      <p className="hero__sub">
        Interfaces with weight, inertia and a little overshoot. Mostly on the
        web, occasionally on paper.
      </p>
    </section>
  );
}
