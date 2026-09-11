import './Footer.css';

// Giant sticky wordmark that scales to the viewport.
// This component is rendered OUTSIDE .site-main in App.jsx. See the comment
// there before you "tidy up" and move it back in.
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__sticky">
        <span className="footer__wordmark">YOUR NAME</span>
      </div>

      <div className="footer__meta">
        <span>© {new Date().getFullYear()}</span>
        <a href="#top">Back to top</a>
      </div>
    </footer>
  );
}
