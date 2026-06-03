import Header from "../pages/Components/Header/Header";
import Footer from "../pages/Components/Footer/Footer";
import type { LayoutProps } from "./layout.types";

import "./MainLayout.css";

export default function MainLayout({ children }: LayoutProps) {
  return (
    <div className="layout">

      <Header />

      <main className="main-content">
        {children}
      </main>

      <Footer />

    </div>
  );
}