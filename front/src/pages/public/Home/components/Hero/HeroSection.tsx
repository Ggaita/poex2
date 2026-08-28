import { HeroSearchForm } from "./Components/HeroSearchForm";
import { HeroBackground } from "./Components/HeroBackground";
import type { HeroSectionProps } from "./hero.types";

/** Hero de Home: título, subtítulo y buscador. Estilos en HomePage.css */
export const HeroSection = ({ title, subtitle }: HeroSectionProps) => {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <HeroBackground />

      <div className="home-hero-container">
        <header className="home-hero-content">
          <h1 id="hero-title" className="home-hero-title">
            {title}
          </h1>

          <p className="home-hero-subtitle">{subtitle}</p>

          <HeroSearchForm />
        </header>
      </div>
    </section>
  );
};