import express from "express";
import cors from "cors";
import companiesRoutes from "./routes/companies.routes";
import publicApplicationsRoutes from "./routes/publicApplications.routes";
import adminApplicationsRoutes from "./routes/adminApplications.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/companies", companiesRoutes);
app.use("/api/public/applications", publicApplicationsRoutes);
app.use("/api/admin/applications", adminApplicationsRoutes);
app.use("/api/auth", authRoutes);

export default app;