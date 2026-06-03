import { Routes, Route } from "react-router-dom";
import HomePage from "../../pages/Home/HomePage";
import SearchPage from "../../pages/SearchPage/SearchPage";
import CompanyPublicPage from "../../pages/CompanyPublic/CompanyPublicPage";
import RegisterPage from "../../pages/Register/RegisterPage";
import LoginPage from "../../pages/Login/LoginPage";
import AdminDashboardPage from "../../pages/AdminDashboard/AdminDashboardPage";
import AdminApplicationsPage from "../../pages/AdminApplications/AdminApplicationsPage";
import AdminProfilesPage from "../../pages/AdminProfiles/AdminProfilesPage";
import CompanyPanelPage from "../../pages/CompanyPanel/CompanyPanelPage";
import RequireRoleRoute from "./RequireRoleRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/empresas/:id" element={<CompanyPublicPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireRoleRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/admin/profiles" element={<AdminProfilesPage />} />
      </Route>
      <Route element={<RequireRoleRoute allowedRoles={["empresa"]} />}>
        <Route path="/empresa/panel" element={<CompanyPanelPage />} />
      </Route>
    </Routes>
  );
}