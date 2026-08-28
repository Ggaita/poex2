import MainLayout from "../../../layouts/MainLayouts";
import { HeroSection } from "./components/Hero/HeroSection";
import "./HomePage.css";

/**
 * Home pública.
 * Estilos: HomePage.css (hero + buscador de portada).
 * Piezas del hero: components/Hero/*
 */
export default function HomePage() {
  return (
    <MainLayout>
      <div className="home-page">
        <HeroSection
          title="BÚSQUEDA POR PRODUCTOS O EMPRESAS"
          subtitle="
        Conecta con diferentes empresas y productos
        de la Provincia del Chaco.
        Encuentra lo que necesitas y haz crecer tu negocio."
        />
      </div>
    </MainLayout>
  );
}