import express from "express";
import cors from "cors";
import companiesRoutes from "./routes/companies.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/companies", companiesRoutes);

export default app;