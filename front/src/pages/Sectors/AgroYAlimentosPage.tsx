import SectorShell from "./SectorShell";

export default function AgroYAlimentosPage() {
  return (
    <SectorShell
      title="Agro y alimentos"
      subtitle="Producción primaria y valor agregado para mercados exigentes"
    >
      <article className="sector-card">
        <div className="sector-prose">
          <p>
            El agro es el motor productivo más dinámico del Chaco. La provincia
            cuenta con un stock bovino de más de 2 millones de cabezas y una base
            genética reconocida, con producción apta para la Cuota Hilton y
            mercados exigentes con certificación ambiental. A esto se suma una
            agricultura diversificada —soja, maíz, arroz y girasol— y un sector
            apícola en expansión, con plantas fraccionadoras que ya exportan a la
            Unión Europea y Asia. Muchos especialistas coinciden en que la nueva
            frontera agrícola del país se desplaza hacia el norte, y Chaco ocupa
            un lugar central en ese proceso.
          </p>
          <p>
            Más allá de la producción primaria, la provincia despliega un
            creciente entramado de alimentos elaborados y productos de valor
            agregado: miel fraccionada con denominación de origen, harina de
            algarroba libre de gluten, alfajores y panificados artesanales en
            proceso de formalización, infusiones exportadas a Asia, y arroceras
            con volúmenes de exportación consolidados. Para inversores y
            compradores internacionales, el sector ofrece materia prima de
            calidad, cadenas en expansión y oportunidades concretas de
            industrialización local.
          </p>
        </div>
      </article>
    </SectorShell>
  );
}
