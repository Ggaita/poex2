import bandera from "../../../assets/Images/flag_of_Argentina.webp";

const FooterBottom = () => {
  return (
    <div className="footer-bottom">
      <p>© 2026 <i>Desarrollado por Argentinos</i></p>
      <img src={bandera} alt="Bandera de Argentina" className="footer-logo" />
    </div>
  );
};

export default FooterBottom;