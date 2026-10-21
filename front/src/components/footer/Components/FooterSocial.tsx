import { FaFacebook, FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";

const FooterSocial = () => {
  return (
    <div className="footer-section">
      <h3>Redes</h3>

      <ul className="footer-social">
        <li className="footer-social-item">
          <a
            href="https://www.instagram.com/gobiernodelchaco/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram del Gobierno del Chaco"
          >
            <FaInstagram className="icon-footer" /> Instagram
          </a>
        </li>

        <li className="footer-social-item">
          <a
            href="https://www.facebook.com/GobiernodelChaco/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook del Gobierno del Chaco"
          >
            <FaFacebook className="icon-footer" /> Facebook
          </a>
        </li>

        <li className="footer-social-item">
          <a
            href="https://www.chaco.gob.ar/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sitio web del Gobierno del Chaco"
          >
            <FaGlobe className="icon-footer" /> Web del Gobierno
          </a>
        </li>

        <li className="footer-social-item">
          <a
            href="https://wa.me/5493624000000"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="icon-footer" /> WhatsApp
          </a>
        </li>
      </ul>
    </div>
  );
};

export default FooterSocial;
