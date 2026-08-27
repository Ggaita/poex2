import { Link } from "react-router-dom";
import CommercialOpportunityShell from "./CommercialOpportunityShell";

export default function OportunidadesDeInversionPage() {
  return (
    <CommercialOpportunityShell
      title="Oportunidades de inversión"
      subtitle="Cartera de proyectos productivos y activos de la provincia"
    >
      <article className="commercial-card">
        <div className="commercial-prose">
          <p>
            Presentamos una cartera de oportunidades de inversión relevadas en
            distintas cadenas productivas y en activos públicos y privados de la
            provincia, desde proyectos con infraestructura ya construida hasta
            iniciativas en etapa de diagnóstico. Cada oportunidad incluye
            información sobre su grado de madurez y los pasos necesarios para su
            activación, para que inversores nacionales y extranjeros puedan
            evaluar en qué proyecto sumarse al desarrollo productivo del Chaco.
          </p>
        </div>

        <div className="commercial-actions">
          <Link to="/contacto-institucional">Contactar a la Agencia</Link>
          <Link to="/formularios-de-consulta">Enviar una consulta</Link>
          <Link to="/parque-industrial">Ver parques industriales</Link>
        </div>
      </article>
    </CommercialOpportunityShell>
  );
}