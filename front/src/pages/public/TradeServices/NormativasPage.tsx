import TradeServiceShell from "./TradeServiceShell";

export default function NormativasPage() {
  return (
    <TradeServiceShell
      title="Normativas"
      subtitle="Orientación clara sobre reglas arancelarias, incentivos y requisitos de destino"
    >
      <article className="trade-service-card">
        <div className="trade-service-prose">
          <p>
            El comercio exterior está regulado por un entramado de normativas
            nacionales e internacionales que puede resultar complejo de
            interpretar para una PyME. Por eso ofrecemos orientación sobre
            posiciones arancelarias, regímenes de incentivo y normativa vigente,
            para que cada empresa exportadora sepa exactamente qué reglas aplican
            a su producto y a su mercado de destino.
          </p>
          <p>
            Entre los marcos normativos más relevantes para las empresas
            chaqueñas se encuentran el Régimen de Incentivo a las Grandes
            Inversiones (RIGI), la Ley de Promoción Industrial provincial y las
            normativas internacionales cada vez más exigentes, como la
            regulación europea de productos libres de deforestación. Acompañamos
            a las empresas para que estas normativas se conviertan en una
            oportunidad de diferenciación y no en una barrera de entrada.
          </p>
        </div>
      </article>
    </TradeServiceShell>
  );
}
