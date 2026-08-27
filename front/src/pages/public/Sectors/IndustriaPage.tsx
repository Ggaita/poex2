import SectorShell from "./SectorShell";

export default function IndustriaPage() {
  return (
    <SectorShell
      title="Industria"
      subtitle="Parques industriales, forestal-taninero e incentivos a la radicación"
    >
      <article className="sector-card">
        <div className="sector-prose">
          <p>
            Chaco cuenta con una red de parques industriales distribuida en
            distintos puntos de la provincia —Resistencia, Sáenz Peña, Machagai,
            Plaza y Presidencia de la Plaza, entre otros— con disponibilidad de
            suelo para nuevos proyectos. Sobre esta base se asienta una industria
            diversificada, con fuerte presencia del complejo forestal y taninero:
            dos de las principales plantas taninerías del país exportan a más de
            60 mercados, y el Centro de Desarrollo Tecnológico de la Industria de
            la Madera (CEDETEMA) ofrece tecnología avanzada para el procesamiento
            de madera.
          </p>
          <p>
            La provincia impulsa activamente la radicación de nuevas industrias a
            través de incentivos concretos: adhesión al Régimen de Incentivo a las
            Grandes Inversiones (RIGI), una Ley de Promoción Industrial en proceso
            de actualización, y una posición estratégica sobre la Hidrovía
            Paraná-Paraguay que la conecta con Asunción y el sur de Brasil.
            Sumado a la disponibilidad de materias primas como el quebracho y el
            algodón, Chaco se presenta como un destino competitivo para proyectos
            de industrialización y valor agregado.
          </p>
        </div>
      </article>
    </SectorShell>
  );
}
