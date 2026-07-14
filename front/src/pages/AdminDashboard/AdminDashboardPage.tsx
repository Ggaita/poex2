import { Link } from "react-router-dom";
import PrivateLayout from "../../layouts/PrivateLayout";
import "./AdminDashboardPage.css";

const modules = [
  {
    title: "Solicitudes de registro",
    description:
      "Revisá, aprobá o rechazá solicitudes pendientes de incorporación.",
    to: "/admin/applications",
    cta: "Gestionar solicitudes"
  },
  {
    title: "Empresas activas",
    description:
      "Administrá fichas empresariales, visibilidad por campo y publicación pública.",
    to: "/admin/profiles",
    cta: "Gestionar perfiles"
  },
  {
    title: "Comunicaciones",
    description:
      "Editá plantillas de correo, segmentá destinatarios y prepará notificaciones.",
    to: "/admin/communications",
    cta: "Gestionar comunicaciones"
  },
  {
    title: "Pedidos especiales",
    description:
      "Gestioná solicitudes públicas de productos/ofertas cuando la búsqueda no encuentra resultados.",
    to: "/admin/special-requests",
    cta: "Gestionar pedidos"
  },
  {
    title: "Usuarios y permisos",
    description:
      "Espacio reservado para futuras reglas de permisos y administración de accesos.",
    to: "/admin/dashboard",
    cta: "Próximamente"
  }
];

export default function AdminDashboardPage() {
  return (
    <PrivateLayout>
      <section className="admin-dashboard-page">
        <div className="admin-dashboard-shell">
          <header className="admin-dashboard-header">
            <p>Inicio administrador</p>
            <h1>Panel interno</h1>
            <small>
              Accedé a módulos internos sin elementos públicos de navegación.
            </small>
          </header>

          <div className="admin-module-grid">
            {modules.map((module) => (
              <article key={module.title} className="admin-module-card">
                <h2>{module.title}</h2>
                <p>{module.description}</p>
                <Link
                  to={module.to}
                  className={
                    module.cta === "Próximamente"
                      ? "admin-module-link disabled"
                      : "admin-module-link"
                  }
                >
                  {module.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
