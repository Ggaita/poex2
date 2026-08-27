import TradeServiceShell from "./TradeServiceShell";

export default function CapacitacionPage() {
  return (
    <TradeServiceShell
      title="Capacitación"
      subtitle="Formación en comercio exterior para empresas, emprendedores y equipos técnicos"
    >
      <article className="trade-service-card">
        <div className="trade-service-prose">
          <p>
            Formamos a empresas, emprendedores y equipos técnicos de la
            provincia en comercio exterior, para que cada vez más PyMEs chaqueñas
            cuenten con las herramientas necesarias para exportar. Nuestras
            capacitaciones abarcan desde los primeros pasos para exportar hasta
            aspectos específicos de normativa, certificaciones y negociación
            internacional.
          </p>
          <p>
            Trabajamos en conjunto con instituciones como el ICCTI —a través de
            su campus virtual— y con programas de formación técnica que recorren
            el interior de la provincia, para que la capacitación llegue también
            a las localidades más alejadas de los centros urbanos. Así, buscamos
            que la cultura exportadora se consolide en todo el territorio
            chaqueño.
          </p>
        </div>
      </article>
    </TradeServiceShell>
  );
}
