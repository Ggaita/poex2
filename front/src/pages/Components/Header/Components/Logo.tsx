import { Link } from "react-router-dom";
import logo from "/isologotipo-gobierno-del-chaco-azulsinfondo-1x-65d489dfc91ee411941976.png";

export default function Logo() {
  return (
    <Link to="/" className="logo-container logo-link" aria-label="Ir al inicio">
      <img src={logo} alt="Logo" className="logo-img" />
      <h2 className="site-title">
        OFERTA EXPORTABLE <br />
        DE LA PROVINCIA DEL CHACO
      </h2>
    </Link>
  );
}