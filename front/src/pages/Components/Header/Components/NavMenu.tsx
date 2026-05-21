import Dropdown from "./DropDown";

export default function NavMenu() {
  return (
    <nav className="main-nav">
      <ul className="menu-nav">

        <Dropdown
          title="INSTITUCIONAL"
          items={[
            { label: "Qué es la oferta exportable", to: "/oferta" },
            { label: "Conocé Chaco", to: "/chaco" }
          ]}
        />

        <Dropdown
          title="SECTORES ECONÓMICOS"
          items={[
            { label: "AGROINDUSTRIA", to: "/agro" },
            { label: "VITIVINÍCOLA", to: "/vino" },
            { label: "ALGUNO MAS", to: "/otro" }
          ]}
        />

        <Dropdown
          title="SERVICIOS DE COMERCIO EXTERIOR"
          items={[
            { label: "SERVICIOS CONEXOS", to: "/servicios" },
            { label: "ENTIDADES", to: "/entidades" },
            { label: "REPRESENTACIONES EXTRANJERAS", to: "/extranjeras" }
          ]}
        />

        <li><a href="/oportunidades">OPORTUNIDADES COMERCIALES</a></li>
        <li><a href="/ayuda">AYUDA</a></li>

      </ul>
    </nav>
  );
}