import TradeServiceShell from "./TradeServiceShell";

export default function AsistenciaExportadoraPage() {
  return (
    <TradeServiceShell
      title="Asistencia exportadora"
      subtitle="Acompañamiento personalizado desde la primera consulta hasta el negocio internacional"
    >
      <article className="trade-service-card">
        <div className="trade-service-prose">
          <p>
            Acompañamos a las empresas chaqueñas en cada etapa de su proceso
            exportador, desde la primera consulta hasta la concreción de negocios
            internacionales. Cada empresa cuenta con un oficial de cuentas
            dedicado, que brinda seguimiento personalizado y facilita el vínculo
            con compradores y mercados externos.
          </p>
          <p>
            Nuestro trabajo incluye inteligencia comercial para detectar demanda
            internacional, organización de rondas de negocios y misiones
            comerciales, y una estrategia de expansión hacia mercados vecinos
            como Paraguay como puerta de entrada al comercio exterior para las
            PyMEs. El objetivo es simple: que ninguna empresa chaqueña con
            potencial exportador quede sin el acompañamiento necesario para dar
            el salto internacional.
          </p>
        </div>
      </article>
    </TradeServiceShell>
  );
}
