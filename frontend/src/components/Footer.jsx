import { Logo } from './Logo.jsx';

export function Footer() {
  return (
    <footer className="footer">
      <a className="footer-brand" href="/">
        <Logo className="footer-logo" />
      </a>
      <a href="tel:645752686">Contacto: 645752686</a>
    </footer>
  );
}
