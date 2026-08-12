import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RequireRoleRoute from "./RequireRoleRoute";

const HomePage = lazy(() => import("../../pages/Home/HomePage"));
const SearchPage = lazy(() => import("../../pages/SearchPage/SearchPage"));
const CompanyPublicPage = lazy(
  () => import("../../pages/CompanyPublic/CompanyPublicPage")
);
const IndustrialParkPage = lazy(
  () => import("../../pages/IndustrialPark/IndustrialParkPage")
);
const RegisterPage = lazy(() => import("../../pages/Register/RegisterPage"));
const LoginPage = lazy(() => import("../../pages/Login/LoginPage"));
const AdminDashboardPage = lazy(
  () => import("../../pages/AdminDashboard/AdminDashboardPage")
);
const AdminApplicationsPage = lazy(
  () => import("../../pages/AdminApplications/AdminApplicationsPage")
);
const AdminProfilesPage = lazy(
  () => import("../../pages/AdminProfiles/AdminProfilesPage")
);
const AdminCommunicationsPage = lazy(
  () => import("../../pages/AdminCommunications/AdminCommunicationsPage")
);
const AdminSpecialRequestsPage = lazy(
  () => import("../../pages/AdminSpecialRequests/AdminSpecialRequestsPage")
);
const CompanyPanelPage = lazy(
  () => import("../../pages/CompanyPanel/CompanyPanelPage")
);
const QuienesSomosPage = lazy(
  () => import("../../pages/Institutional/QuienesSomosPage")
);
const ObjetivosPage = lazy(
  () => import("../../pages/Institutional/ObjetivosPage")
);
const OrganismosVinculadosPage = lazy(
  () => import("../../pages/Institutional/OrganismosVinculadosPage")
);
const ContactoInstitucionalPage = lazy(
  () => import("../../pages/Institutional/ContactoInstitucionalPage")
);
const AgroYAlimentosPage = lazy(
  () => import("../../pages/Sectors/AgroYAlimentosPage")
);
const IndustriaPage = lazy(() => import("../../pages/Sectors/IndustriaPage"));
const IndustriasCreativasPage = lazy(
  () => import("../../pages/Sectors/IndustriasCreativasPage")
);
const ServiciosTecnologicosPage = lazy(
  () => import("../../pages/Sectors/ServiciosTecnologicosPage")
);
const AsistenciaExportadoraPage = lazy(
  () => import("../../pages/TradeServices/AsistenciaExportadoraPage")
);
const CertificacionesPage = lazy(
  () => import("../../pages/TradeServices/CertificacionesPage")
);
const NormativasPage = lazy(
  () => import("../../pages/TradeServices/NormativasPage")
);
const LogisticaYAduanaPage = lazy(
  () => import("../../pages/TradeServices/LogisticaYAduanaPage")
);
const CapacitacionPage = lazy(
  () => import("../../pages/TradeServices/CapacitacionPage")
);
const CatalogoExportablePage = lazy(
  () => import("../../pages/CommercialOpportunities/CatalogoExportablePage")
);
const FormulariosDeConsultaPage = lazy(
  () => import("../../pages/CommercialOpportunities/FormulariosDeConsultaPage")
);
const OportunidadesDeInversionPage = lazy(
  () => import("../../pages/CommercialOpportunities/OportunidadesDeInversionPage")
);

export default function AppRouter() {
  return (
    <Suspense fallback={<p style={{ padding: "1rem" }}>Cargando...</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/parque-industrial" element={<IndustrialParkPage />} />
        <Route path="/empresas/:id" element={<CompanyPublicPage />} />
        <Route path="/quienes-somos" element={<QuienesSomosPage />} />
        <Route path="/objetivos" element={<ObjetivosPage />} />
        <Route path="/organismos-vinculados" element={<OrganismosVinculadosPage />} />
        <Route path="/contacto-institucional" element={<ContactoInstitucionalPage />} />
        <Route path="/agro-y-alimentos" element={<AgroYAlimentosPage />} />
        <Route path="/industria" element={<IndustriaPage />} />
        <Route path="/industrias-creativas" element={<IndustriasCreativasPage />} />
        <Route path="/servicios-tecnologicos" element={<ServiciosTecnologicosPage />} />
        <Route path="/asistencia-exportadora" element={<AsistenciaExportadoraPage />} />
        <Route path="/certificaciones" element={<CertificacionesPage />} />
        <Route path="/normativas" element={<NormativasPage />} />
        <Route path="/logistica-y-aduana" element={<LogisticaYAduanaPage />} />
        <Route path="/capacitacion" element={<CapacitacionPage />} />
        <Route path="/catalogo-exportable" element={<CatalogoExportablePage />} />
        <Route path="/formularios-de-consulta" element={<FormulariosDeConsultaPage />} />
        <Route path="/oportunidades-de-inversion" element={<OportunidadesDeInversionPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireRoleRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/applications" element={<AdminApplicationsPage />} />
          <Route path="/admin/profiles" element={<AdminProfilesPage />} />
          <Route path="/admin/communications" element={<AdminCommunicationsPage />} />
          <Route
            path="/admin/special-requests"
            element={<AdminSpecialRequestsPage />}
          />
        </Route>
        <Route element={<RequireRoleRoute allowedRoles={["empresa"]} />}>
          <Route path="/empresa/panel" element={<CompanyPanelPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}