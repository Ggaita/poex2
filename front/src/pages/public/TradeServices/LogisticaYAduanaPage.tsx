import TradeServiceShell from "./TradeServiceShell";

export default function LogisticaYAduanaPage() {
  return (
    <TradeServiceShell
      title="Logística y aduana"
      subtitle="Trámites, transporte y opciones portuarias para llegar al mercado de destino"
    >
      <article className="trade-service-card">
        <div className="trade-service-prose">
          <p>
            Chaco ocupa una posición geográfica estratégica: rodeado por los
            ríos Paraná y Paraguay, atravesado por corredores viales clave y
            conectado con la Hidrovía Paraná-Paraguay, tiene todas las
            condiciones para convertirse en un nodo logístico de relevancia
            regional, con salida directa hacia Asunción y el sur de Brasil.
          </p>
          <p>
            Brindamos orientación a las empresas exportadoras sobre trámites
            aduaneros, alternativas de transporte y opciones portuarias
            disponibles en la provincia, incluyendo el desarrollo de la
            operatoria fluvial a través del Puerto de Las Palmas. Nuestro
            objetivo es ayudar a cada empresa a encontrar la combinación
            logística más eficiente para llegar a su mercado de destino.
          </p>
        </div>
      </article>
    </TradeServiceShell>
  );
}
