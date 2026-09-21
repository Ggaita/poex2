import { Router } from "express";
import {
  getPublicIndustrialParkDetail,
  getPublicIndustrialParks
} from "../controllers/public-industrial-parks.controller";

const router = Router();
router.get("/", getPublicIndustrialParks);
router.get("/:slug", getPublicIndustrialParkDetail);
export default router;
