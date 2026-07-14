import express from "express";
import cors from "cors";
import companiesRoutes from "./modules/companies/routes/companies.routes";
import publicApplicationsRoutes from "./modules/applications/routes/public-applications.routes";
import adminApplicationsRoutes from "./modules/applications/routes/admin-applications.routes";
import authRoutes from "./modules/auth/routes/auth.routes";
import searchRoutes from "./modules/search/routes/search.routes";
import adminProfilesRoutes from "./modules/profiles/routes/admin-profiles.routes";
import companyProfileRoutes from "./modules/profiles/routes/company-profile.routes";
import publicProfilesRoutes from "./modules/profiles/routes/public-profiles.routes";
import adminCommunicationsRoutes from "./modules/communications/routes/admin-communications.routes";
import publicSpecialRequestsRoutes from "./modules/special-requests/routes/public-special-requests.routes";
import adminSpecialRequestsRoutes from "./modules/special-requests/routes/admin-special-requests.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/companies", companiesRoutes);
app.use("/api/public/applications", publicApplicationsRoutes);
app.use("/api/admin/applications", adminApplicationsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin/profiles", adminProfilesRoutes);
app.use("/api/company/profile", companyProfileRoutes);
app.use("/api/public/profiles", publicProfilesRoutes);
app.use("/api/admin/communications", adminCommunicationsRoutes);
app.use("/api/public/special-requests", publicSpecialRequestsRoutes);
app.use("/api/admin/special-requests", adminSpecialRequestsRoutes);

export default app;