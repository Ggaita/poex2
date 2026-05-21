import logo from "/isologotipo-gobierno-del-chaco-azulsinfondo-1x-65d489dfc91ee411941976.png";

export default function Logo() {
  return (
    <div className="logo-container">
      <img src={logo} alt="Logo" className="logo-img" />
      <h2 className="site-title">
        OFERTA EXPORTABLE <br />
        DE LA PROVINCIA DEL CHACO
      </h2>
    </div>
  );
}