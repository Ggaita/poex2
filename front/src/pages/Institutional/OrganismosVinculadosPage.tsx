import InstitutionalShell from "./InstitutionalShell";

export default function OrganismosVinculadosPage() {
  return (
    <InstitutionalShell
      title="Organismos vinculados"
      subtitle="Red institucional para el desarrollo productivo y exportador"
    >
      <article className="institutional-card">
        <div className="institutional-prose">
          <p>
            La Agencia trabaja de manera articulada con organismos públicos, cámaras
            empresariales y entidades técnicas que fortalecen el desarrollo
            productivo y exportador de la provincia. Esta red de aliados
            institucionales —que incluye organismos de asistencia técnica,
            financiamiento, ciencia y tecnología, y representación sectorial— es
            clave para acompañar a las empresas chaqueñas en cada etapa de su
            proceso exportador y de inversión.
          </p>
        </div>
      </article>
    </InstitutionalShell>
  );
}
