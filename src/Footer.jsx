import './Footer.css';

// Giant sticky wordmark that scales to the viewport.
// This component is rendered OUTSIDE .site-main in App.jsx. See the comment
// there before you "tidy up" and move it back in.
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__meta">
        <span>© {new Date().getFullYear()}</span>
        <a href="#top">Back to top</a>
      </div>

      {/* The wordmark is the LAST child on purpose. A bottom:0 sticky element
          can only travel within its parent, so it needs the whole tall footer
          above it as runway. Put anything after it and the pin shrinks to
          nothing, which is exactly what the first version of this did. */}
      <div className="footer__sticky">
        <span className="footer__wordmark">HAMZA AFZAL</span>
      </div>
    </footer>
  );
}
