import { Link } from "react-router-dom";

const FooterLinks = () => {
  return (
    <nav className="footer-section footer-section-links" aria-label="Enlaces del pie">
      <ul className="footer-links">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li>
          <Link to="/institucional#quienes-somos">Quiénes somos</Link>
        </li>
        <li>
          <Link to="/parque-industrial">Parques industriales</Link>
        </li>
        <li>
          <Link to="/ayuda">Ayuda</Link>
        </li>
        <li>
          <Link to="/institucional#contacto">Contacto</Link>
        </li>
      </ul>
    </nav>
  );
};

export default FooterLinks;