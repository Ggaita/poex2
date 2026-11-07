import Dropdown from "./DropDown";

export default function NavMenu() {
  return (
    <nav className="main-nav">
      <ul className="menu-nav">
        <li><a href="/">INICIO</a></li>

        <Dropdown
          title="INSTITUCIONAL"
          to="/institucional"
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
          items={[
            { label: "Búsqueda de productos", to: "/search?mode=product" },
            { label: "Búsqueda de empresas", to: "/search?mode=company" },
            { label: "Catálogo exportable", to: "/catalogo-exportable" },
            { label: "Formularios de consulta", to: "/formularios-de-consulta" },
            { label: "Oportunidades de inversión ", to: "/oportunidades-de-inversion" },
          ]}
        />
        <li><a href="/parque-industrial">PARQUE INDUSTRIAL</a></li>
      </ul>
    </nav>
  );
}