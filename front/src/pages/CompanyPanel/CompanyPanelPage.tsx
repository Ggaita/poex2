import PrivateLayout from "../../layouts/PrivateLayout";
import "./CompanyPanelPage.css";

const widgets = [
  {
    title: "Mi perfil de empresa",
    description:
      "Módulo base para actualizar datos institucionales y visibilidad en el portal público.",
    status: "Próximamente"
  },
  {
    title: "Estado de solicitud",
    description:
      "Seguimiento del proceso de revisión y aprobaciones relacionadas con la empresa.",
    status: "En preparación"
  },
  {
    title: "Documentación",
    description:
      "Espacio para gestionar archivos, catálogos y recursos asociados al perfil empresarial.",
    status: "Próximamente"
  }
];

export default function CompanyPanelPage() {
  return (
    <PrivateLayout>
      <section className="company-panel-page">
        <div className="company-panel-shell">
          <header className="company-panel-header">
            <p>Panel empresa</p>
            <h1>Área privada de gestión</h1>
            <small>
              Esta sección usa navegación interna y footer privado, separado del sitio público.
            </small>
          </header>

          <div className="company-widget-grid">
            {widgets.map((widget) => (
              <article key={widget.title} className="company-widget-card">
                <h2>{widget.title}</h2>
                <p>{widget.description}</p>
                <span>{widget.status}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
