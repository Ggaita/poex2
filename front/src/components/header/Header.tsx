import { useEffect, useId, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";

import Logo from "./Components/Logo";
import NavMenu from "./Components/NavMenu";
import HeaderActions from "./Components/HeaderActions";

/**
 * Header público del portal.
 * - Desktop: nav horizontal
 * - Mobile/tablet: menú hamburguesa (sandwich)
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navId = useId();

  // Cierra el panel al navegar (link, hash, search).
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  // Evita scroll de fondo con el menú abierto en mobile.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className={`header${menuOpen ? " is-nav-open" : ""}`}>
      <div className="header-top">
        <Logo />
        <div className="header-top-end">
          <HeaderActions />
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls={navId}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <NavMenu
        id={navId}
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />
    </header>
  );
}
