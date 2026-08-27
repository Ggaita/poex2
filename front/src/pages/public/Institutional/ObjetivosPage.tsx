import InstitutionalShell from "./InstitutionalShell";

const OBJECTIVES = [
  "Atraer y coordinar inversiones nacionales y extranjeras que impulsen la diversificación productiva de la provincia.",
  "Relevar y sistematizar la oferta exportable chaqueña, generando información confiable y actualizada sobre empresas, productos y capacidades.",
  "Crear y mantener un Directorio de empresas exportadoras y una Cartera de Inversiones y Parques Industriales, disponibles para compradores e inversores de todo el mundo.",
  "Facilitar trámites, incentivos y financiamiento para proyectos productivos, actuando como ventanilla única ante el Estado provincial.",
  "Promover la internacionalización de bienes y servicios chaqueños, conectando a las empresas locales con mercados y compradores externos.",
  "Fortalecer la articulación entre el sector público y el sector privado, acompañando a cada inversor con seguimiento personalizado."
] as const;

export default function ObjetivosPage() {
  return (
    <InstitutionalShell
      title="Objetivos"
      subtitle="Trabajamos para consolidar al Chaco como un destino confiable y competitivo para la inversión y el comercio exterior."
    >
      <article className="institutional-card">
        <h2>Nuestra gestión se ordena en torno a estos objetivos</h2>
        <ul className="institutional-list">
          {OBJECTIVES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </InstitutionalShell>
  );
}
