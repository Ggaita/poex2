import { Router } from "express";
import { createPublicApplication } from "../controllers/public-applications.controller";

const router = Router();

router.post("/", createPublicApplication);

export default router;
