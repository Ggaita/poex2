import { Link } from "react-router-dom";

const FooterLinks = () => {
  return (
    <div className="footer-section">

      <h3>Links</h3>

      <ul className="footer-links">

        <li>
          <Link to="/">Inicio</Link>
        </li>

        <li>
          <Link to="/quienes-somos">Quiénes somos</Link>
        </li>

        <li>
          <Link to="/contacto-institucional">Contacto</Link>
        </li>

      </ul>

    </div>
  );
};

export default FooterLinks;