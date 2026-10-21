import { Link } from "react-router-dom";

const AGENCY_URL =
  "https://chaco.gob.ar/seccion-agencia-para-la-inversion-y-el-desarrollo";

const FooterBrand = () => {
  return (
    <div className="footer-brand">
      <a
        className="footer-brand-logo-link"
        href={AGENCY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Sitio de la Agencia para la Inversión y el Desarrollo del Chaco"
      >
        <img
          className="footer-brand-logo"
          src="/logo-agencia-footer.png"
          alt="Agencia para la Inversión y el Desarrollo del Chaco"
        />
      </a>
      <Link to="/" className="footer-brand-text-link" aria-label="Ir al inicio de POEX">
        <h2>POEX</h2>
        <p>Plataforma de oferta exportable</p>
      </Link>
    </div>
  );
};

export default FooterBrand;
