import { Link } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayouts";
import { useScrollToHash } from "../../../shared/hooks/useScrollToHash";
import "./SectorPage.css";

const TOC = [
  { id: "agro-y-alimentos", label: "Agro y alimentos" },
  { id: "industria", label: "Industria" },
  { id: "industrias-creativas", label: "Industrias creativas" },
  { id: "servicios-tecnologicos", label: "Servicios tecnológicos" }
] as const;

const SECTIONS = [
  {
    id: "agro-y-alimentos",
    title: "Agro y alimentos",
    lead: "Producción primaria y valor agregado para mercados exigentes",
    paragraphs: [
      "El agro es el motor productivo más dinámico del Chaco. La provincia cuenta con un stock bovino de más de 2 millones de cabezas y una base genética reconocida, con producción apta para la Cuota Hilton y mercados exigentes con certificación ambiental. A esto se suma una agricultura diversificada —soja, maíz, arroz y girasol— y un sector apícola en expansión, con plantas fraccionadoras que ya exportan a la Unión Europea y Asia. Muchos especialistas coinciden en que la nueva frontera agrícola del país se desplaza hacia el norte, y Chaco ocupa un lugar central en ese proceso.",
      "Más allá de la producción primaria, la provincia despliega un creciente entramado de alimentos elaborados y productos de valor agregado: miel fraccionada con denominación de origen, harina de algarroba libre de gluten, alfajores y panificados artesanales en proceso de formalización, infusiones exportadas a Asia, y arroceras con volúmenes de exportación consolidados. Para inversores y compradores internacionales, el sector ofrece materia prima de calidad, cadenas en expansión y oportunidades concretas de industrialización local."
    ]
  },
  {
    id: "industria",
    title: "Industria",
    lead: "Parques industriales, forestal-taninero e incentivos a la radicación",
    paragraphs: [
      "Chaco cuenta con una red de parques industriales distribuida en distintos puntos de la provincia —Resistencia, Sáenz Peña, Machagai, Plaza y Presidencia de la Plaza, entre otros— con disponibilidad de suelo para nuevos proyectos. Sobre esta base se asienta una industria diversificada, con fuerte presencia del complejo forestal y taninero: dos de las principales plantas taninerías del país exportan a más de 60 mercados, y el Centro de Desarrollo Tecnológico de la Industria de la Madera (CEDETEMA) ofrece tecnología avanzada para el procesamiento de madera.",
      "La provincia impulsa activamente la radicación de nuevas industrias a través de incentivos concretos: adhesión al Régimen de Incentivo a las Grandes Inversiones (RIGI), una Ley de Promoción Industrial en proceso de actualización, y una posición estratégica sobre la Hidrovía Paraná-Paraguay que la conecta con Asunción y el sur de Brasil. Sumado a la disponibilidad de materias primas como el quebracho y el algodón, Chaco se presenta como un destino competitivo para proyectos de industrialización y valor agregado."
    ]
  },
  {
    id: "industrias-creativas",
    title: "Industrias creativas",
    lead: "Cultura, formación y proyección comercial del ecosistema creativo chaqueño",
    paragraphs: [
      "Resistencia es la Capital Nacional de las Esculturas y sede de la Bienal Internacional de Esculturas, uno de los eventos culturales de mayor convocatoria del país, que reúne artistas de todo el mundo. A esto se suma la Feria de Arte —que ya lleva ocho ediciones— y el Museo Provincial de Bellas Artes René Brusau (MUBA), que funciona como nodo institucional del sector con una agenda permanente de exposiciones, formación y vinculación.",
      "Esta trayectoria cultural se sostiene en una base formativa sólida: la Facultad de Artes de la Universidad Nacional del Nordeste (UNNE), con 15 años de trayectoria, forma a buena parte de los artistas y productores culturales de la región. La actividad cultural genera además un derrame económico concreto en turismo, gastronomía y comercio local, y ya circula comercialmente hacia Paraguay, lo que abre oportunidades reales de inversión y comercialización para las industrias creativas chaqueñas."
    ]
  },
  {
    id: "servicios-tecnologicos",
    title: "Servicios tecnológicos",
    lead: "Polo IT, innovación y escalamiento de soluciones chaqueñas",
    paragraphs: [
      "El Polo IT Chaco nuclea a un conjunto de empresas de base tecnológica con capacidades de alta sofisticación en áreas como monitoreo de sensores para cadena de frío, drones agrícolas, FinTech y automatización de procesos para PyMEs. Se trata de un ecosistema joven pero con proyección concreta: en su primera convocatoria, el Instituto Chaqueño de Ciencia, Tecnología e Innovación (ICCTI) financió decenas de proyectos de empresas de base tecnológica, varios de los cuales ya cuentan con prototipos listos para el mercado.",
      "El ecosistema tecnológico chaqueño cuenta con un fuerte respaldo institucional: el ICCTI financia proyectos, otorga becas y opera un campus virtual con miles de usuarios matriculados en formación digital. Para inversores y empresas del sector, Chaco ofrece talento técnico consolidado y una oportunidad concreta de acompañar la etapa de escalamiento comercial e internacionalización de estas soluciones."
    ]
  }
] as const;

export default function SectorsPage() {
  useScrollToHash();

  return (
    <MainLayout>
      <section className="sector-page">
        <div className="sector-shell">
          <header className="sector-header">
            <p>Sectores económicos</p>
            <h1>Oferta productiva de la provincia</h1>
            <small>
              Recorré los principales sectores productivos del Chaco: agro, industria,
              industrias creativas y servicios tecnológicos.
            </small>
          </header>

          <nav className="hub-toc" aria-label="Sectores">
            {TOC.map((item) => (
              <Link key={item.id} to={`/sectores#${item.id}`} className="hub-toc-link">
                {item.label}
              </Link>
            ))}
          </nav>

          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="hub-section">
              <article className="sector-card">
                <h2>{section.title}</h2>
                <p className="hub-section-lead">{section.lead}</p>
                <div className="sector-prose">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </article>
            </section>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
