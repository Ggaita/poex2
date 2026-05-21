import Dropdown from "./DropDown";

export default function NavMenu() {
  return (
    <nav className="main-nav">
      <ul className="menu-nav">

        <Dropdown
          title="INSTITUCIONAL"
          items={[
            { label: "Quiénes somos", to: "/quienes-somos" },
            { label: "Objetivos", to: "/objetivos" },
            { label: "Organismos vinculados", to: "/organismos-vinculados" },
            { label: "Contacto institucional", to: "/contacto-institucional" }
          ]}
        />

        <Dropdown
          title="SECTORES ECONÓMICOS"
          items={[
            { label: "Agro y alimentos", to: "/agro-y-alimentos" },
            { label: "Industria", to: "/industria" },
            { label: "Industrias Creativas", to: "/industrias-creativas" },
            { label: "Servicios Tecnológicos", to: "/servicios-tecnologicos" },
          ]}
        />

        <Dropdown
          title="SERVICIOS DE COMERCIO EXTERIOR"
          items={[
            { label: "Asistencia exportadora", to: "/asistencia-exportadora" },
            { label: "Certificaciones", to: "/certificaciones" },
            { label: "Normativas", to: "/normativas" },
            { label: "Logística y aduana", to: "/logistica-y-aduana" },
            { label: "Capacitación", to: "/capacitacion" },
          ]}
        />

        <Dropdown
          title="OPORTUNIDADES COMERCIALES"
          items={[
            { label: "Búsqueda de productos", to: "/busqueda-de-productos" },
            { label: "Búsqueda de empresas", to: "/busqueda-de-empresas" },
            { label: "Catálogo exportable", to: "/catalogo-exportable" },
            { label: "Formularios de consulta", to: "/formularios-de-consulta" },
            { label: "Oportunidades de inversión ", to: "/oportunidades-de-inversion" },
          ]}
        />

        <li><a href="/ayuda">AYUDA</a></li>

      </ul>
    </nav>
  );
}