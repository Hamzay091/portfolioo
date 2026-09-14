// The Three.js particle tunnel behind DiveIntro. Kept in its own module so
// DiveIntro can load it with a dynamic import(): Three.js is the largest
// dependency on the site, and splitting it out keeps it off the first page
// load. Named imports (not `import * as THREE`) let the bundler drop the parts
// of Three.js this scene never uses.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  EdgesGeometry,
  Fog,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  NormalBlending,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

const DEPTH = 220; // tunnel length in world units
const CAMERA_START = 8;
const CAMERA_END = -DEPTH + 30;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Theme colours come from the CSS tokens, so the scene follows light/dark mode
// and the accent colour instead of hardcoding its own palette.
function readVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// A soft round sprite, so particles read as glowing dots instead of squares.
function makeDotTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Random point on a ring around the tunnel axis. The minimum radius keeps a
// clear channel down the middle, which is what makes it read as a tunnel and
// keeps the copy legible.
function ringPoint(minR, spread, power) {
  const angle = Math.random() * Math.PI * 2;
  const radius = minR + Math.pow(Math.random(), power) * spread;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

/**
 * Builds the scene on `canvas` and drives it from scroll progress through
 * `runway`. Returns a dispose function that stops every loop, observer and
 * listener and frees GPU memory.
 */
export function createTunnel({ runway, stage, canvas, line, hint, reduce }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  } catch {
    // No WebGL: show the copy on the plain background rather than nothing.
    stage.classList.add('is-static');
    return () => stage.classList.remove('is-static');
  }
  // Start capped at 1.5x. If the machine can't keep up, the frame loop drops
  // this to 1x below: on a scaled laptop display the uncapped canvas is over
  // two million pixels, which integrated graphics renders at ~30fps.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const bg = new Color(readVar('--bg', '#16171d'));
  const accent = new Color(readVar('--accent', '#c084fc'));
  const ink = new Color(readVar('--text-h', '#f3f4f6'));
  const isDark = bg.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;
  // Additive glow only works on a dark page; on a light page it washes out to
  // white, so fall back to normal blending there.
  const blending = isDark ? AdditiveBlending : NormalBlending;

  renderer.setClearColor(bg, 1);
  const scene = new Scene();
  // Fog in the page background colour makes far particles dissolve into the
  // page instead of popping in at the far clipping plane.
  scene.fog = new Fog(bg, 18, 110);

  const camera = new PerspectiveCamera(70, 1, 0.1, 400);
  camera.position.set(0, 0, CAMERA_START);

  const small = Math.min(window.innerWidth, window.innerHeight) < 700;

  // Particles.
  const COUNT = small ? 1600 : 3600;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const tmp = new Color();
  for (let i = 0; i < COUNT; i++) {
    const [x, y] = ringPoint(2.5, 16, 0.7);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = CAMERA_START + 2 - Math.random() * (DEPTH + 10);
    tmp.copy(ink).lerp(accent, 0.35 + Math.random() * 0.65);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  const dot = makeDotTexture();
  const material = new PointsMaterial({
    size: small ? 0.5 : 0.42,
    map: dot,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending,
  });
  const tunnel = new Points(geometry, material);
  scene.add(tunnel);

  // Light streaks: short lines along the flight axis, invisible at rest and
  // brightening with scroll speed, so a fast scroll feels like a jump to
  // hyperspace and a slow one stays calm.
  const STREAKS = small ? 140 : 320;
  const streakPositions = new Float32Array(STREAKS * 6);
  for (let i = 0; i < STREAKS; i++) {
    const [x, y] = ringPoint(3, 14, 0.8);
    const z = CAMERA_START - Math.random() * (DEPTH + 10);
    const length = 2 + Math.random() * 6;
    streakPositions.set([x, y, z, x, y, z - length], i * 6);
  }
  const streakGeometry = new BufferGeometry();
  streakGeometry.setAttribute('position', new BufferAttribute(streakPositions, 3));
  const streakMaterial = new LineBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending,
  });
  const streaks = new LineSegments(streakGeometry, streakMaterial);
  scene.add(streaks);

  // The destination: two wireframe shapes turning against each other at the
  // tunnel's end, with a slow breathing pulse.
  const outerIco = new IcosahedronGeometry(3.2, 1);
  const outerGeometry = new EdgesGeometry(outerIco);
  outerIco.dispose();
  const outerMaterial = new LineBasicMaterial({ color: accent, transparent: true, opacity: 0.8, blending });
  const outer = new LineSegments(outerGeometry, outerMaterial);

  const innerOcta = new OctahedronGeometry(1.5, 0);
  const innerGeometry = new EdgesGeometry(innerOcta);
  innerOcta.dispose();
  const innerMaterial = new LineBasicMaterial({ color: ink, transparent: true, opacity: 0.7, blending });
  const inner = new LineSegments(innerGeometry, innerMaterial);

  const core = new Group();
  core.add(outer, inner);
  core.position.z = CAMERA_END - 14;
  scene.add(core);

  let raf = 0;
  let running = false;
  let last = performance.now();
  let camZ = CAMERA_START;
  let px = 0;
  let py = 0;
  let lastOpacity = -1;
  let elapsed = 0;

  // Adaptive resolution: sample real frame times, and if they are slow, drop
  // to 1x once. Frames are only sampled while the loop is running.
  let sampledFrames = 0;
  let sampledTime = 0;
  let downgraded = (window.devicePixelRatio || 1) <= 1;

  const progress = () => {
    const rect = runway.getBoundingClientRect();
    const travel = Math.max(1, runway.offsetHeight - window.innerHeight);
    return clamp01(-rect.top / travel);
  };

  const applyOverlay = (p) => {
    const o = smoothstep(0.5, 0.82, p);
    // The core sits directly behind the copy, so it fades as the copy resolves.
    // At full strength its wireframe lines cut straight through the letters.
    outerMaterial.opacity = 0.8 - 0.6 * o;
    innerMaterial.opacity = 0.7 - 0.55 * o;
    if (hint) hint.style.opacity = (0.7 * (1 - smoothstep(0.02, 0.18, p))).toFixed(3);
    if (Math.abs(o - lastOpacity) < 0.002) return; // skip no-op DOM writes
    lastOpacity = o;
    line.style.opacity = o.toFixed(3);
    line.style.transform = `translate3d(0, ${((1 - o) * 24).toFixed(1)}px, 0) scale(${(0.94 + o * 0.06).toFixed(3)})`;
    line.style.filter = o < 0.999 ? `blur(${((1 - o) * 10).toFixed(1)}px)` : 'none';
  };

  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  };

  const frame = (now) => {
    raf = running ? requestAnimationFrame(frame) : 0;
    const rawDt = (now - last) / 1000;
    const dt = Math.min(0.05, rawDt);
    last = now;
    elapsed += dt;

    if (!downgraded) {
      sampledFrames++;
      sampledTime += rawDt;
      if (sampledFrames >= 45) {
        if (sampledTime / sampledFrames > 1 / 45) {
          renderer.setPixelRatio(1);
          resize();
        }
        downgraded = true; // decided either way; stop sampling
      }
    }

    const p = progress();
    const target = CAMERA_START + (CAMERA_END - CAMERA_START) * smoothstep(0, 1, p);
    const gap = target - camZ;
    // Damped toward the target so the flight has inertia rather than snapping
    // to every scroll tick.
    camZ += gap * Math.min(1, dt * 6);
    camera.position.z = camZ;
    camera.position.x += (px * 1.4 - camera.position.x) * Math.min(1, dt * 3);
    camera.position.y += (-py * 0.9 - camera.position.y) * Math.min(1, dt * 3);
    camera.lookAt(camera.position.x * 0.3, camera.position.y * 0.3, camZ - 30);

    // How far the camera still has to travel is a good stand-in for speed.
    const speed = Math.abs(gap);
    streakMaterial.opacity += (Math.min(0.85, speed * 0.05) - streakMaterial.opacity) * Math.min(1, dt * 8);

    tunnel.rotation.z += dt * 0.06;
    streaks.rotation.z = tunnel.rotation.z;

    outer.rotation.x += dt * 0.25;
    outer.rotation.y += dt * 0.35;
    inner.rotation.x -= dt * 0.5;
    inner.rotation.z -= dt * 0.4;
    core.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.04);

    applyOverlay(p);
    renderer.render(scene, camera);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onPointer = (e) => {
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
  };

  let io = null;
  if (reduce) {
    // Reduced motion: no flight. Park the camera at the destination, show the
    // copy, and draw a single still frame.
    camZ = CAMERA_END;
    camera.position.z = CAMERA_END;
    camera.lookAt(0, 0, CAMERA_END - 30);
    outerMaterial.opacity = 0.2; // dimmed behind the copy, as at the end of the flight
    innerMaterial.opacity = 0.15;
    line.style.opacity = '1';
    if (hint) hint.style.opacity = '0';
  } else {
    applyOverlay(progress());
    // Only render while the section is near the viewport. An offscreen WebGL
    // loop would burn battery for the whole visit.
    io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      rootMargin: '100px 0px',
    });
    io.observe(runway);
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  return () => {
    stop();
    ro.disconnect();
    io?.disconnect();
    window.removeEventListener('pointermove', onPointer);
    for (const disposable of [
      geometry, material, dot,
      streakGeometry, streakMaterial,
      outerGeometry, outerMaterial,
      innerGeometry, innerMaterial,
    ]) {
      disposable.dispose();
    }
    // Deliberately no forceContextLoss(): StrictMode remounts onto the same
    // <canvas>, and a lost context cannot be revived for the second mount.
    renderer.dispose();
  };
}
