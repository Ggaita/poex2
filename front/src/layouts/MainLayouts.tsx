import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import type { LayoutProps } from "./layout.types";

import "./MainLayout.css";

/**
 * Layout del sitio público (home, búsqueda, institucionales, ficha empresa, etc.).
 * Header/Footer viven en `src/components` para poder estilizarlos sin mezclarlos con pages.
 */
export default function MainLayout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
}
