import { Link } from "react-router-dom";
import Dropdown from "./DropDown";
import HeaderActions from "./HeaderActions";

type NavMenuProps = {
  id?: string;
  open?: boolean;
  onNavigate?: () => void;
};

export default function NavMenu({ id, open = false, onNavigate }: NavMenuProps) {
  return (
    <nav
      id={id}
      className={`main-nav${open ? " is-open" : ""}`}
      aria-label="Navegación principal"
    >
      <ul className="menu-nav">
        <li>
          <Link to="/" onClick={onNavigate}>
            INICIO
          </Link>
        </li>

        <Dropdown
          title="INSTITUCIONAL"
          to="/institucional"
          onNavigate={onNavigate}
          items={[
            { label: "Quiénes somos", to: "/institucional#quienes-somos" },
            { label: "Objetivos", to: "/institucional#objetivos" },
            { label: "Organismos vinculados", to: "/institucional#organismos-vinculados" },
            { label: "Contacto institucional", to: "/institucional#contacto" }
          ]}
        />

        <Dropdown
          title="SECTORES ECONÓMICOS"
          to="/sectores"
          onNavigate={onNavigate}
          items={[
            { label: "Agro y alimentos", to: "/sectores#agro-y-alimentos" },
            { label: "Industria", to: "/sectores#industria" },
            { label: "Industrias Creativas", to: "/sectores#industrias-creativas" },
            { label: "Servicios Tecnológicos", to: "/sectores#servicios-tecnologicos" }
          ]}
        />

        <Dropdown
          title="SERVICIOS DE COMERCIO EXTERIOR"
          to="/servicios-comercio-exterior"
          onNavigate={onNavigate}
          items={[
            { label: "Asistencia exportadora", to: "/servicios-comercio-exterior#asistencia-exportadora" },
            { label: "Certificaciones", to: "/servicios-comercio-exterior#certificaciones" },
            { label: "Normativas", to: "/servicios-comercio-exterior#normativas" },
            { label: "Logística y aduana", to: "/servicios-comercio-exterior#logistica-y-aduana" },
            { label: "Capacitación", to: "/servicios-comercio-exterior#capacitacion" }
          ]}
        />

        <Dropdown
          title="OPORTUNIDADES COMERCIALES"
          onNavigate={onNavigate}
          items={[
            { label: "Búsqueda de productos", to: "/search?mode=product" },
            { label: "Búsqueda de empresas", to: "/search?mode=company" },
            { label: "Catálogo exportable", to: "/catalogo-exportable" },
            { label: "Formularios de consulta", to: "/formularios-de-consulta" },
            { label: "Oportunidades de inversión", to: "/oportunidades-de-inversion" }
          ]}
        />

        <li>
          <Link to="/parque-industrial" onClick={onNavigate}>
            PARQUE INDUSTRIAL
          </Link>
        </li>
      </ul>

      {/* Solo mobile chico: Inscribirse / Ingresar dentro del sandwich */}
      <div className="nav-mobile-actions">
        <HeaderActions />
      </div>
    </nav>
  );
}
