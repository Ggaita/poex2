import { HeroSearchForm } from "./Components/HeroSearchForm";
import { HeroBackground } from "./Components/HeroBackground";
import type { HeroSectionProps } from "./hero.types";
import "./HeroSection.css";

export const HeroSection = ({ title, subtitle }: HeroSectionProps) => {
  return (
    <section className="hero" aria-labelledby="hero-title">

      <HeroBackground />

      <div className="hero-container">
        <header className="hero-content">

          <h1 id="hero-title" className="hero-title">
            {title}
          </h1>

          <p className="hero-subtitle">
            {subtitle}
          </p>

          <HeroSearchForm />

        </header>
      </div>

    </section>
  );
};