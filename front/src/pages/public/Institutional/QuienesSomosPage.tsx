import InstitutionalShell from "./InstitutionalShell";

export default function QuienesSomosPage() {
  return (
    <InstitutionalShell
      title="Quiénes somos"
      subtitle="Agencia para la Inversión y el Desarrollo del Chaco"
    >
      <article className="institutional-card">
        <div className="institutional-prose">
          <p>
            La Agencia para la Inversión y el Desarrollo del Chaco es el organismo
            creado por el Gobierno de la Provincia para atraer, coordinar e impulsar
            inversiones nacionales y extranjeras, en el marco de una nueva etapa de
            dinamismo económico y productivo para el Chaco.
          </p>
          <p>
            Dependiente de la Secretaría de Coordinación de Gabinete, funcionamos
            como la ventanilla única para quienes deseen invertir en la provincia:
            promovemos oportunidades sectoriales, diseñamos estrategias de inversión
            y agilizamos trámites e incentivos para proyectos productivos, evitando
            burocracia innecesaria. Cada empresario cuenta con un oficial de cuentas
            que lo acompaña en cada etapa del proceso, garantizando negociaciones
            rápidas y efectivas.
          </p>
          <p>
            Somos el puente estratégico entre el sector público y el sector privado,
            y trabajamos para proyectar al Chaco al mundo: impulsando la
            internacionalización de sus bienes y servicios, generando empleo genuino
            y consolidando a la provincia como un nuevo polo de desarrollo productivo
            y exportador.
          </p>
        </div>
      </article>
    </InstitutionalShell>
  );
}
