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

export default function AppRouter() {
  return (
    <Suspense fallback={<p style={{ padding: "1rem" }}>Cargando...</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/parque-industrial" element={<IndustrialParkPage />} />
        <Route path="/empresas/:id" element={<CompanyPublicPage />} />
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