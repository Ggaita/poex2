import "../HeroSection.css";

export const HeroBackground = () => {
  return (
    <div className="hero-background">
      <img
        src="/heroback.jpg"
        alt="Fondo de comercio internacional"
        className="hero-image"
      />

      <div className="hero-overlay" />
    </div>
  );
};