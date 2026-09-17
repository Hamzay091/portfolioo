import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { paper, figures } from './paper/paperContent.js';
import './PaperReader.css';

// Read-only view of the research paper: the text is rendered as part of the
// page, so there is nothing to download and nothing to install to read it.
// Loaded as its own chunk, since the figures alone are ~130 kB.
export default function PaperReader({ onClose }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);

    const timer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60);

    return () => {
      root.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [onClose]);

  // How far through the paper the reader is, as a 0..1 fraction for the bar.
  const onScroll = useCallback((e) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
  }, []);

  return createPortal(
    <div className="pr" role="dialog" aria-modal="true" aria-labelledby="pr-title">
      <div className="pr__bar">
        <span className="pr__kicker">Research paper</span>
        <button className="pr__close" type="button" onClick={onClose} ref={closeRef}>
          <span className="pr__sr">Close the paper</span>
          <span aria-hidden="true">✕</span>
        </button>
        <span className="pr__progress" style={{ '--p': progress }} aria-hidden="true" />
      </div>

      <div className="pr__sheet" ref={sheetRef} onScroll={onScroll} data-lenis-prevent>
        <article className="pr__doc">
          <header className="pr__head">
            <img className="pr__logo" src={figures.logo} alt="University of Central Punjab" />
            <h1 className="pr__title" id="pr-title">
              {paper.title}
            </h1>
            <p className="pr__meta">
              {paper.meta.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </header>

          {paper.blocks.map((block, i) => {
            const key = `${block.type}-${i}`;
            switch (block.type) {
              case 'h2':
                return (
                  <h2 className="pr__h2" key={key}>
                    {block.text}
                  </h2>
                );
              case 'caption':
                return (
                  <p className="pr__caption" key={key}>
                    {block.text}
                  </p>
                );
              case 'ul':
                return (
                  <ul className="pr__list" key={key}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              case 'image':
                return (
                  <figure className="pr__figure" key={key}>
                    <img src={figures[block.ref]} alt="" loading="lazy" decoding="async" />
                  </figure>
                );
              case 'table':
                // Its own scroller: a wide table must never make the page
                // itself scroll sideways.
                return (
                  <div className="pr__table-wrap" key={key}>
                    <table className="pr__table">
                      <thead>
                        <tr>
                          {block.rows[0].map((cell, c) => (
                            <th key={`${cell}-${c}`}>{cell}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.slice(1).map((row, r) => (
                          <tr key={`r${r}`}>
                            {row.map((cell, c) => (
                              <td key={`${cell}-${c}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              case 'code':
                return (
                  <div className="pr__code" key={key}>
                    <p className="pr__code-title">{block.title}</p>
                    <pre>
                      <code>{block.lines.join('\n')}</code>
                    </pre>
                  </div>
                );
              default:
                return (
                  <p className="pr__p" key={key}>
                    {block.text}
                  </p>
                );
            }
          })}
        </article>
      </div>
    </div>,
    document.body,
  );
}
