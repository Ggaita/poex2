import { Router } from "express";
import { createPublicApplication } from "../controllers/publicApplications.controller";

const router = Router();

router.post("/", createPublicApplication);

export default router;
