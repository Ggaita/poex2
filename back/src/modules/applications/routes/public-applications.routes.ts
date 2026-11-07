import { Router } from "express";
import {
  createPublicApplication,
  parseApplicationMultipart
} from "../controllers/public-applications.controller";

const router = Router();

router.post("/", parseApplicationMultipart, createPublicApplication);

export default router;
