import './ScrollCurve.css';

// The vector line that grows out of the stem of the "I" in the headline and
// winds down into the roles list as you scroll.
//
// NOT YET IMPLEMENTED. This renders nothing on purpose, so the rest of the
// site is usable while the curve is built. The shape of the work, in order:
//
//   1. Measure the rendered width of the "I" glyph with a canvas 2D context.
//      Fonts render differently per browser, per device, per load state, so
//      measure it - never assume.
//   2. Build a cubic Bezier from that anchor down to the target section.
//   3. Set pathLength="1" and let ScrollTrigger scrub strokeDashoffset 1 -> 0.
//   4. Re-read the anchor position every frame. The headline is being
//      translated and blurred by scroll at the same time, so the curve's
//      origin is a moving target. This is the step that hurts.
export default function ScrollCurve({ regionRef }) {
  void regionRef;
  return null;
}
