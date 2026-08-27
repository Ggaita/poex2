import SectorShell from "./SectorShell";

export default function IndustriasCreativasPage() {
  return (
    <SectorShell
      title="Industrias creativas"
      subtitle="Cultura, formación y proyección comercial del ecosistema creativo chaqueño"
    >
      <article className="sector-card">
        <div className="sector-prose">
          <p>
            Resistencia es la Capital Nacional de las Esculturas y sede de la
            Bienal Internacional de Esculturas, uno de los eventos culturales de
            mayor convocatoria del país, que reúne artistas de todo el mundo. A
            esto se suma la Feria de Arte —que ya lleva ocho ediciones— y el
            Museo Provincial de Bellas Artes René Brusau (MUBA), que funciona
            como nodo institucional del sector con una agenda permanente de
            exposiciones, formación y vinculación.
          </p>
          <p>
            Esta trayectoria cultural se sostiene en una base formativa sólida: la
            Facultad de Artes de la Universidad Nacional del Nordeste (UNNE), con
            15 años de trayectoria, forma a buena parte de los artistas y
            productores culturales de la región. La actividad cultural genera
            además un derrame económico concreto en turismo, gastronomía y
            comercio local, y ya circula comercialmente hacia Paraguay, lo que
            abre oportunidades reales de inversión y comercialización para las
            industrias creativas chaqueñas.
          </p>
        </div>
      </article>
    </SectorShell>
  );
}
