import {
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaWhatsapp,
} from "react-icons/fa";

const FooterSocial = () => {
  return (
    <div className="footer-section">
      <h3>Redes</h3>

      <ul className="footer-social">
        <li className="footer-social-item">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram className="icon-footer"/> Instagram
          </a>
        </li>

        <li className="footer-social-item">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="icon-footer" /> LinkedIn
          </a>
        </li>

        <li className="footer-social-item">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FaGithub className="icon-footer" /> Github
          </a>
        </li>

        <li className="footer-social-item">
          <a
            href="https://wa.me/549XXXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="icon-footer" /> Whatsapp
          </a>
        </li>
      </ul>
    </div>
  );
};

export default FooterSocial;