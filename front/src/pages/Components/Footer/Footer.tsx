import "./Footer.css";

import FooterBrand from "./Components/FooterBrand";
import FooterLinks from "./Components/FooterLinks";
import FooterSocial from "./Components/FooterSocial";
import FooterBottom from "./Components/FooterBottom";

const Footer = () => {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-top">
          <FooterBrand />
          <FooterLinks />
          <FooterSocial />
        </div>

        <FooterBottom />

      </div>

    </footer>
  );
};

export default Footer;