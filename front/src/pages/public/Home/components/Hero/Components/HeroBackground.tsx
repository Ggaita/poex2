import fotoHero from "../../../../../../assets/Images/background-hero-cexp.png";

export const HeroBackground = () => {
  return (
    <div className="home-hero-background">
      <img
        src={fotoHero}
        alt="Fondo de comercio internacional"
        className="home-hero-image"
      />
      <div className="home-hero-overlay" />
    </div>
  );
};