import "./Header.css";

import Logo from "./Components/Logo";
import NavMenu from "./Components/NavMenu";
import HeaderActions from "./Components/HeaderActions";

/**
 * Header público del portal.
 * - Estilos: Header.css
 * - Menú: Components/NavMenu.tsx
 * - Botones Inscribirse/Ingresar: Components/HeaderActions.tsx
 */
export default function Header() {
  return (
    <header className="header">
      {/* Franja superior: marca + acceso */}
      <div className="header-top">
        <Logo />
        <HeaderActions />
      </div>

      {/* Navegación principal del sitio */}
      <NavMenu />
    </header>
  );
}
