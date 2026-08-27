import TradeServiceShell from "./TradeServiceShell";

export default function CertificacionesPage() {
  return (
    <TradeServiceShell
      title="Certificaciones"
      subtitle="Orientación para acceder a mercados con los estándares que exige cada destino"
    >
      <article className="trade-service-card">
        <div className="trade-service-prose">
          <p>
            Contar con las certificaciones adecuadas es, muchas veces, la
            diferencia entre acceder a un mercado internacional o quedar afuera
            de él. Por eso acompañamos a las empresas chaqueñas en la obtención
            de las certificaciones sanitarias, de calidad y de origen que exige
            cada destino de exportación, articulando con organismos técnicos como
            SENASA y el laboratorio de Bromatología de la provincia.
          </p>
          <p>
            Entre las certificaciones que las empresas de la provincia ya
            gestionan y pueden ampliar se encuentran la certificación orgánica,
            la denominación de origen (como en el caso de la miel chaqueña), la
            certificación Halal y la trazabilidad de producto, cada vez más
            exigida por mercados como la Unión Europea. Brindamos orientación
            para identificar qué certificación necesita cada producto y qué
            pasos seguir para obtenerla.
          </p>
        </div>
      </article>
    </TradeServiceShell>
  );
}
