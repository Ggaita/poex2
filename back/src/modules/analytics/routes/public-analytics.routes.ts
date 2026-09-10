import { Router } from "express";
import { postPublicAnalyticsEvents } from "../controllers/public-analytics.controller";

const router = Router();
router.post("/events", postPublicAnalyticsEvents);
export default router;
