import { Link } from "react-router-dom";
import CommercialOpportunityShell from "./CommercialOpportunityShell";

export default function CatalogoExportablePage() {
  return (
    <CommercialOpportunityShell
      title="Catálogo exportable"
      subtitle="Directorio de oferta exportable de la provincia del Chaco"
    >
      <article className="commercial-card">
        <div className="commercial-prose">
          <p>
            El Catálogo Exportable reúne a las empresas chaqueñas que forman parte
            del Directorio de Oferta Exportable de la provincia, con información
            sobre sus productos, certificaciones y datos de contacto. Es la puerta
            de entrada para que compradores de todo el mundo descubran lo que Chaco
            tiene para ofrecer.
          </p>
        </div>

        <div className="commercial-actions">
          <Link to="/search?mode=company">Explorar empresas del catálogo</Link>
          <Link to="/search?mode=product">Explorar productos exportables</Link>
          <Link to="/formularios-de-consulta">Solicitar una consulta</Link>
        </div>
      </article>
    </CommercialOpportunityShell>
  );
}
