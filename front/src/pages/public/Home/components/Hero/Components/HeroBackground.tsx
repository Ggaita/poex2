import "../HeroSection.css";
import fotoHero from "../../../../../../assets/Images/background-hero-cexp.png";

export const HeroBackground = () => {
  return (
    <div className="hero-background">
      <img
        src= {fotoHero}
        alt="Fondo de comercio internacional"
        className="hero-image"
      />

      <div className="hero-overlay" />
    </div>
  );
};