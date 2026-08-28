/**
 * Router principal de POEX.
 * Las pantallas están agrupadas por dominio:
 * - pages/public/*  sitio público
 * - pages/auth/*    login/registro
 * - pages/admin/*   panel administración
 * - pages/company/* panel empresa
 */
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RequireRoleRoute from "./RequireRoleRoute";

const HomePage = lazy(() => import("../../pages/public/Home/HomePage"));
const SearchPage = lazy(() => import("../../pages/public/Search/SearchPage"));
const CompanyPublicPage = lazy(
  () => import("../../pages/public/CompanyPublic/CompanyPublicPage")
);
const IndustrialParkPage = lazy(
  () => import("../../pages/public/IndustrialPark/IndustrialParkPage")
);
const RegisterPage = lazy(() => import("../../pages/auth/Register/RegisterPage"));
const LoginPage = lazy(() => import("../../pages/auth/Login/LoginPage"));
const AdminDashboardPage = lazy(
  () => import("../../pages/admin/Dashboard/AdminDashboardPage")
);
const AdminApplicationsPage = lazy(
  () => import("../../pages/admin/Applications/AdminApplicationsPage")
);
const AdminProfilesPage = lazy(
  () => import("../../pages/admin/Profiles/AdminProfilesPage")
);
const AdminCommunicationsPage = lazy(
  () => import("../../pages/admin/Communications/AdminCommunicationsPage")
);
const AdminSpecialRequestsPage = lazy(
  () => import("../../pages/admin/SpecialRequests/AdminSpecialRequestsPage")
);
const CompanyPanelPage = lazy(
  () => import("../../pages/company/Panel/CompanyPanelPage")
);
const QuienesSomosPage = lazy(
  () => import("../../pages/public/Institutional/QuienesSomosPage")
);
const ObjetivosPage = lazy(
  () => import("../../pages/public/Institutional/ObjetivosPage")
);
const OrganismosVinculadosPage = lazy(
  () => import("../../pages/public/Institutional/OrganismosVinculadosPage")
);
const ContactoInstitucionalPage = lazy(
  () => import("../../pages/public/Institutional/ContactoInstitucionalPage")
);
const AgroYAlimentosPage = lazy(
  () => import("../../pages/public/Sectors/AgroYAlimentosPage")
);
const IndustriaPage = lazy(() => import("../../pages/public/Sectors/IndustriaPage"));
const IndustriasCreativasPage = lazy(
  () => import("../../pages/public/Sectors/IndustriasCreativasPage")
);
const ServiciosTecnologicosPage = lazy(
  () => import("../../pages/public/Sectors/ServiciosTecnologicosPage")
);
const AsistenciaExportadoraPage = lazy(
  () => import("../../pages/public/TradeServices/AsistenciaExportadoraPage")
);
const CertificacionesPage = lazy(
  () => import("../../pages/public/TradeServices/CertificacionesPage")
);
const NormativasPage = lazy(
  () => import("../../pages/public/TradeServices/NormativasPage")
);
const LogisticaYAduanaPage = lazy(
  () => import("../../pages/public/TradeServices/LogisticaYAduanaPage")
);
const CapacitacionPage = lazy(
  () => import("../../pages/public/TradeServices/CapacitacionPage")
);
const CatalogoExportablePage = lazy(
  () => import("../../pages/public/CommercialOpportunities/CatalogoExportablePage")
);
const FormulariosDeConsultaPage = lazy(
  () => import("../../pages/public/CommercialOpportunities/FormulariosDeConsultaPage")
);
const OportunidadesDeInversionPage = lazy(
  () => import("../../pages/public/CommercialOpportunities/OportunidadesDeInversionPage")
);
const OportunidadDetallePage = lazy(
  () => import("../../pages/public/CommercialOpportunities/OportunidadDetallePage")
);
const HelpPage = lazy(() => import("../../pages/public/Help/HelpPage"));
const AdminInvestmentOpportunitiesPage = lazy(
  () => import("../../pages/admin/InvestmentOpportunities/AdminInvestmentOpportunitiesPage")
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
        <Route
          path="/oportunidades-de-inversion/:slug"
          element={<OportunidadDetallePage />}
        />
        <Route path="/ayuda" element={<HelpPage />} />
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
          <Route
            path="/admin/investment-opportunities"
            element={<AdminInvestmentOpportunitiesPage />}
          />
        </Route>
        <Route element={<RequireRoleRoute allowedRoles={["empresa"]} />}>
          <Route path="/empresa/panel" element={<CompanyPanelPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}