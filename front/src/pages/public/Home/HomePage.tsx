import MainLayout from "../../../layouts/MainLayouts";
import { HeroSection } from "./components/Hero/HeroSection";

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection
        title="BÚSQUEDA POR PRODUCTOS O EMPRESAS"
        subtitle="
        Conecta con diferentes empresas y productos
        de la Provincia del Chaco.
        Encuentra lo que necesitas y haz crecer tu negocio."
      />
    </MainLayout>
  );
}