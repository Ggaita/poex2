import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  getCompanyProfileMe,
  patchCompanyProfileMe
} from "../controllers/company-profile.controller";

const router = Router();

router.use(authenticateRequest, requireRole("empresa"));

router.get("/me", getCompanyProfileMe);
router.patch("/me", patchCompanyProfileMe);

export default router;
