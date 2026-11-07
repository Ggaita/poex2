import { Link } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayouts";
import { useScrollToHash } from "../../../shared/hooks/useScrollToHash";
import "./TradeServicePage.css";

const TOC = [
  { id: "asistencia-exportadora", label: "Asistencia exportadora" },
  { id: "certificaciones", label: "Certificaciones" },
  { id: "normativas", label: "Normativas" },
  { id: "logistica-y-aduana", label: "Logística y aduana" },
  { id: "capacitacion", label: "Capacitación" }
] as const;

const SECTIONS = [
  {
    id: "asistencia-exportadora",
    title: "Asistencia exportadora",
    lead: "Acompañamiento personalizado desde la primera consulta hasta el negocio internacional",
    paragraphs: [
      "Acompañamos a las empresas chaqueñas en cada etapa de su proceso exportador, desde la primera consulta hasta la concreción de negocios internacionales. Cada empresa cuenta con un oficial de cuentas dedicado, que brinda seguimiento personalizado y facilita el vínculo con compradores y mercados externos.",
      "Nuestro trabajo incluye inteligencia comercial para detectar demanda internacional, organización de rondas de negocios y misiones comerciales, y una estrategia de expansión hacia mercados vecinos como Paraguay como puerta de entrada al comercio exterior para las PyMEs. El objetivo es simple: que ninguna empresa chaqueña con potencial exportador quede sin el acompañamiento necesario para dar el salto internacional."
    ]
  },
  {
    id: "certificaciones",
    title: "Certificaciones",
    lead: "Orientación para acceder a mercados con los estándares que exige cada destino",
    paragraphs: [
      "Contar con las certificaciones adecuadas es, muchas veces, la diferencia entre acceder a un mercado internacional o quedar afuera de él. Por eso acompañamos a las empresas chaqueñas en la obtención de las certificaciones sanitarias, de calidad y de origen que exige cada destino de exportación, articulando con organismos técnicos como SENASA y el laboratorio de Bromatología de la provincia.",
      "Entre las certificaciones que las empresas de la provincia ya gestionan y pueden ampliar se encuentran la certificación orgánica, la denominación de origen (como en el caso de la miel chaqueña), la certificación Halal y la trazabilidad de producto, cada vez más exigida por mercados como la Unión Europea. Brindamos orientación para identificar qué certificación necesita cada producto y qué pasos seguir para obtenerla."
    ]
  },
  {
    id: "normativas",
    title: "Normativas",
    lead: "Orientación clara sobre reglas arancelarias, incentivos y requisitos de destino",
    paragraphs: [
      "El comercio exterior está regulado por un entramado de normativas nacionales e internacionales que puede resultar complejo de interpretar para una PyME. Por eso ofrecemos orientación sobre posiciones arancelarias, regímenes de incentivo y normativa vigente, para que cada empresa exportadora sepa exactamente qué reglas aplican a su producto y a su mercado de destino.",
      "Entre los marcos normativos más relevantes para las empresas chaqueñas se encuentran el Régimen de Incentivo a las Grandes Inversiones (RIGI), la Ley de Promoción Industrial provincial y las normativas internacionales cada vez más exigentes, como la regulación europea de productos libres de deforestación. Acompañamos a las empresas para que estas normativas se conviertan en una oportunidad de diferenciación y no en una barrera de entrada."
    ]
  },
  {
    id: "logistica-y-aduana",
    title: "Logística y aduana",
    lead: "Trámites, transporte y opciones portuarias para llegar al mercado de destino",
    paragraphs: [
      "Chaco ocupa una posición geográfica estratégica: rodeado por los ríos Paraná y Paraguay, atravesado por corredores viales clave y conectado con la Hidrovía Paraná-Paraguay, tiene todas las condiciones para convertirse en un nodo logístico de relevancia regional, con salida directa hacia Asunción y el sur de Brasil.",
      "Brindamos orientación a las empresas exportadoras sobre trámites aduaneros, alternativas de transporte y opciones portuarias disponibles en la provincia, incluyendo el desarrollo de la operatoria fluvial a través del Puerto de Las Palmas. Nuestro objetivo es ayudar a cada empresa a encontrar la combinación logística más eficiente para llegar a su mercado de destino."
    ]
  },
  {
    id: "capacitacion",
    title: "Capacitación",
    lead: "Formación en comercio exterior para empresas, emprendedores y equipos técnicos",
    paragraphs: [
      "Formamos a empresas, emprendedores y equipos técnicos de la provincia en comercio exterior, para que cada vez más PyMEs chaqueñas cuenten con las herramientas necesarias para exportar. Nuestras capacitaciones abarcan desde los primeros pasos para exportar hasta aspectos específicos de normativa, certificaciones y negociación internacional.",
      "Trabajamos en conjunto con instituciones como el ICCTI —a través de su campus virtual— y con programas de formación técnica que recorren el interior de la provincia, para que la capacitación llegue también a las localidades más alejadas de los centros urbanos. Así, buscamos que la cultura exportadora se consolide en todo el territorio chaqueño."
    ]
  }
] as const;

export default function TradeServicesPage() {
  useScrollToHash();

  return (
    <MainLayout>
      <section className="trade-service-page">
        <div className="trade-service-shell">
          <header className="trade-service-header">
            <p>Servicios de comercio exterior</p>
            <h1>Acompañamiento exportador integral</h1>
            <small>
              Asistencia, certificaciones, normativas, logística y capacitación para
              empresas chaqueñas con proyección internacional.
            </small>
          </header>

          <nav className="hub-toc" aria-label="Servicios">
            {TOC.map((item) => (
              <Link
                key={item.id}
                to={`/servicios-comercio-exterior#${item.id}`}
                className="hub-toc-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="hub-section">
              <article className="trade-service-card">
                <h2>{section.title}</h2>
                <p className="hub-section-lead">{section.lead}</p>
                <div className="trade-service-prose">
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
