// Pure-JavaScript preview server.
//
//   node scripts/preview.mjs          (or: npm.cmd run preview:js)
//   PORT=4000 node scripts/preview.mjs
//
// Why this exists: on machines where Windows Smart App Control blocks
// unsigned native Node addons, Vite 8's bundler (rolldown) and Tailwind v4's
// compiler cannot load, so `npm run dev` fails. This server needs no native
// code. It compiles JSX with Babel, resolves npm packages through an import
// map to esm.sh at the exact versions installed in node_modules, and uses
// Tailwind's browser build for utility classes.
//
// It is for looking at the site and debugging it. It is not a replacement for
// `vite build`: no minification, no hashing, and it needs internet access for
// the CDN. Use `npm run dev` / `npm run build` wherever Vite can run.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
// Imported as a module, not named as a string: Babel resolves string preset
// names relative to the file being compiled, not relative to this script.
import presetReact from '@babel/preset-react';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const PORT = Number(process.env.PORT || 5173);

// Pin CDN versions to whatever is actually installed, so the preview never
// silently runs different library code than the real build would.
function installedVersion(pkg) {
  const file = path.join(ROOT, 'node_modules', pkg, 'package.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).version;
  } catch {
    throw new Error(`[preview] ${pkg} is not installed. Run npm install first.`);
  }
}

const v = {
  react: installedVersion('react'),
  reactDom: installedVersion('react-dom'),
  gsap: installedVersion('gsap'),
  lenis: installedVersion('lenis'),
  flubber: installedVersion('flubber'),
  tailwind: installedVersion('tailwindcss'),
};

const IMPORT_MAP = {
  imports: {
    'react': `https://esm.sh/react@${v.react}`,
    'react/jsx-runtime': `https://esm.sh/react@${v.react}/jsx-runtime`,
    'react/jsx-dev-runtime': `https://esm.sh/react@${v.react}/jsx-dev-runtime`,
    'react-dom': `https://esm.sh/react-dom@${v.reactDom}?deps=react@${v.react}`,
    'react-dom/client': `https://esm.sh/react-dom@${v.reactDom}/client?deps=react@${v.react}`,
    'gsap': `https://esm.sh/gsap@${v.gsap}`,
    'gsap/ScrollTrigger': `https://esm.sh/gsap@${v.gsap}/ScrollTrigger`,
    'lenis': `https://esm.sh/lenis@${v.lenis}`,
    'flubber': `https://esm.sh/flubber@${v.flubber}`,
  },
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

const ASSET_RE = /\.(png|jpe?g|webp|avif|gif|svg|mp4|webm)$/i;

// Browsers can only import JavaScript, so Vite-style imports of CSS, raw
// strings and asset URLs are rewritten to virtual modules served below.
function rewriteImports() {
  return {
    visitor: {
      'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(p) {
        const src = p.node.source;
        if (!src) return;
        const spec = src.value;
        if (!spec.startsWith('.') && !spec.startsWith('/')) return;
        if (spec.endsWith('?raw')) src.value = spec.slice(0, -4) + '.__raw.js';
        else if (spec.endsWith('.css')) src.value = spec + '.__style.js';
        else if (ASSET_RE.test(spec)) src.value = spec + '.__url.js';
      },
    },
  };
}

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

// Refuse anything that resolves outside the project folder.
function safeJoin(base, rel) {
  const full = path.resolve(base, '.' + rel);
  return full === base || full.startsWith(base + path.sep) ? full : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';

    if (rel === '/index.html') {
      let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const inject =
        `<script type="importmap">${JSON.stringify(IMPORT_MAP)}</script>\n` +
        `    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@${v.tailwind}"></script>\n`;
      html = html.replace('</head>', `  ${inject}  </head>`);
      return send(res, 200, TYPES['.html'], html);
    }

    if (rel.endsWith('.__style.js')) {
      const file = safeJoin(ROOT, rel.slice(0, -'.__style.js'.length));
      if (!file || !fs.existsSync(file)) return send(res, 404, 'text/plain', `404 ${rel}`);
      // The Tailwind browser build supplies preflight and utilities itself.
      const css = fs.readFileSync(file, 'utf8').replace(/@import\s+["']tailwindcss["'];?/g, '');
      const id = JSON.stringify(rel);
      const js =
        `const id = ${id};\n` +
        `let el = document.querySelector('style[data-src="' + id + '"]');\n` +
        `if (!el) { el = document.createElement('style'); el.dataset.src = id; document.head.appendChild(el); }\n` +
        `el.textContent = ${JSON.stringify(css)};\n`;
      return send(res, 200, TYPES['.js'], js);
    }

    if (rel.endsWith('.__raw.js')) {
      const file = safeJoin(ROOT, rel.slice(0, -'.__raw.js'.length));
      if (!file || !fs.existsSync(file)) return send(res, 404, 'text/plain', `404 ${rel}`);
      return send(res, 200, TYPES['.js'], `export default ${JSON.stringify(fs.readFileSync(file, 'utf8'))};\n`);
    }

    if (rel.endsWith('.__url.js')) {
      const assetUrl = rel.slice(0, -'.__url.js'.length);
      return send(res, 200, TYPES['.js'], `export default ${JSON.stringify(assetUrl)};\n`);
    }

    // Like Vite, serve public/ at the site root.
    let file = safeJoin(ROOT, rel);
    if (!file || !fs.existsSync(file)) {
      const pub = safeJoin(path.join(ROOT, 'public'), rel);
      if (pub && fs.existsSync(pub)) file = pub;
    }
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      return send(res, 404, 'text/plain', `404 ${rel}`);
    }

    const ext = path.extname(file).toLowerCase();
    const isSourceModule =
      ext === '.jsx' || (ext === '.js' && file.startsWith(SRC + path.sep));

    if (isSourceModule) {
      const out = await transformAsync(fs.readFileSync(file, 'utf8'), {
        filename: file,
        babelrc: false,
        configFile: false,
        sourceMaps: 'inline',
        presets: [[presetReact, { runtime: 'automatic', development: true }]],
        plugins: [rewriteImports],
      });
      return send(res, 200, TYPES['.js'], out.code);
    }

    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error('[preview] error', req.url, err.message);
    send(res, 500, 'text/plain', String(err.stack || err));
  }
});

server.listen(PORT, () => {
  console.log(`[preview] serving ${ROOT}`);
  console.log(`[preview] http://localhost:${PORT}  (no hot reload: refresh after edits)`);
});
