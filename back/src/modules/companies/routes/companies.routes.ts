import { Router } from "express";
import { getCompanies } from "../controllers/companies.controller";

const router = Router();

router.get("/", getCompanies);

export default router;
