/**
 * Router principal de POEX.
 * Las pantallas están agrupadas por dominio:
 * - pages/public/*  sitio público
 * - pages/auth/*    login/registro
 * - pages/admin/*   panel administración
 * - pages/company/* panel empresa
 */
import { lazy, Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import RequireRoleRoute from "./RequireRoleRoute";

const HomePage = lazy(() => import("../../pages/public/Home/HomePage"));
const SearchPage = lazy(() => import("../../pages/public/Search/SearchPage"));
const CompanyPublicPage = lazy(
  () => import("../../pages/public/CompanyPublic/CompanyPublicPage")
);
const ProductPublicPage = lazy(
  () => import("../../pages/public/ProductPublic/ProductPublicPage")
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
const InstitutionalPage = lazy(
  () => import("../../pages/public/Institutional/InstitutionalPage")
);
const SectorsPage = lazy(() => import("../../pages/public/Sectors/SectorsPage"));
const TradeServicesPage = lazy(
  () => import("../../pages/public/TradeServices/TradeServicesPage")
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
const AdminAnalyticsPage = lazy(() => import("../../pages/admin/Analytics/AdminAnalyticsPage"));
const AdminInvestmentOpportunitiesPage = lazy(
  () => import("../../pages/admin/InvestmentOpportunities/AdminInvestmentOpportunitiesPage")
);
const AdminIndustrialParksPage = lazy(
  () => import("../../pages/admin/IndustrialParks/AdminIndustrialParksPage")
);

export default function AppRouter() {
  return (
    <Suspense fallback={<p style={{ padding: "1rem" }}>Cargando...</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/parque-industrial" element={<IndustrialParkPage />} />
        <Route path="/empresas/:id" element={<CompanyPublicPage />} />
        <Route path="/productos/:id" element={<ProductPublicPage />} />
        <Route path="/institucional" element={<InstitutionalPage />} />
        <Route path="/sectores" element={<SectorsPage />} />
        <Route path="/servicios-comercio-exterior" element={<TradeServicesPage />} />
        {/* Redirects legacy multipágina → hub + hash */}
        <Route path="/quienes-somos" element={<Navigate to="/institucional#quienes-somos" replace />} />
        <Route path="/objetivos" element={<Navigate to="/institucional#objetivos" replace />} />
        <Route
          path="/organismos-vinculados"
          element={<Navigate to="/institucional#organismos-vinculados" replace />}
        />
        <Route
          path="/contacto-institucional"
          element={<Navigate to="/institucional#contacto" replace />}
        />
        <Route path="/agro-y-alimentos" element={<Navigate to="/sectores#agro-y-alimentos" replace />} />
        <Route path="/industria" element={<Navigate to="/sectores#industria" replace />} />
        <Route
          path="/industrias-creativas"
          element={<Navigate to="/sectores#industrias-creativas" replace />}
        />
        <Route
          path="/servicios-tecnologicos"
          element={<Navigate to="/sectores#servicios-tecnologicos" replace />}
        />
        <Route
          path="/asistencia-exportadora"
          element={<Navigate to="/servicios-comercio-exterior#asistencia-exportadora" replace />}
        />
        <Route
          path="/certificaciones"
          element={<Navigate to="/servicios-comercio-exterior#certificaciones" replace />}
        />
        <Route
          path="/normativas"
          element={<Navigate to="/servicios-comercio-exterior#normativas" replace />}
        />
        <Route
          path="/logistica-y-aduana"
          element={<Navigate to="/servicios-comercio-exterior#logistica-y-aduana" replace />}
        />
        <Route
          path="/capacitacion"
          element={<Navigate to="/servicios-comercio-exterior#capacitacion" replace />}
        />
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
            path="/admin/analytics"
            element={<AdminAnalyticsPage />}
          />
          <Route
            path="/admin/investment-opportunities"
            element={<AdminInvestmentOpportunitiesPage />}
          />
          <Route
            path="/admin/industrial-parks"
            element={<AdminIndustrialParksPage />}
          />
        </Route>
        <Route element={<RequireRoleRoute allowedRoles={["empresa"]} />}>
          <Route path="/empresa/panel" element={<CompanyPanelPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}