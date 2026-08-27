import SectorShell from "./SectorShell";

export default function ServiciosTecnologicosPage() {
  return (
    <SectorShell
      title="Servicios tecnológicos"
      subtitle="Polo IT, innovación y escalamiento de soluciones chaqueñas"
    >
      <article className="sector-card">
        <div className="sector-prose">
          <p>
            El Polo IT Chaco nuclea a un conjunto de empresas de base tecnológica
            con capacidades de alta sofisticación en áreas como monitoreo de
            sensores para cadena de frío, drones agrícolas, FinTech y
            automatización de procesos para PyMEs. Se trata de un ecosistema joven
            pero con proyección concreta: en su primera convocatoria, el Instituto
            Chaqueño de Ciencia, Tecnología e Innovación (ICCTI) financió
            decenas de proyectos de empresas de base tecnológica, varios de los
            cuales ya cuentan con prototipos listos para el mercado.
          </p>
          <p>
            El ecosistema tecnológico chaqueño cuenta con un fuerte respaldo
            institucional: el ICCTI financia proyectos, otorga becas y opera un
            campus virtual con miles de usuarios matriculados en formación
            digital. Para inversores y empresas del sector, Chaco ofrece talento
            técnico consolidado y una oportunidad concreta de acompañar la etapa
            de escalamiento comercial e internacionalización de estas soluciones.
          </p>
        </div>
      </article>
    </SectorShell>
  );
}
