import "./Header.css";

import Logo from "./Components/Logo";
import NavMenu from "./Components/NavMenu";
import HeaderActions from "./Components/HeaderActions";

export default function Header() {
  return (
    <header className="header">
        <div className="header-top">
            <Logo />
            
            <HeaderActions />
        </div>

      <NavMenu />
    </header>
  );
}