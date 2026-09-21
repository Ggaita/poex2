import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  deleteAdminIndustrialPark,
  getAdminIndustrialParkDetail,
  getAdminIndustrialParks,
  patchAdminIndustrialPark,
  postAdminIndustrialPark
} from "../controllers/admin-industrial-parks.controller";

const router = Router();
router.use(authenticateRequest, requireRole("admin"));
router.get("/", getAdminIndustrialParks);
router.post("/", postAdminIndustrialPark);
router.get("/:id", getAdminIndustrialParkDetail);
router.patch("/:id", patchAdminIndustrialPark);
router.delete("/:id", deleteAdminIndustrialPark);
export default router;