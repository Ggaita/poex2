import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  deleteCompanyProfileProductMe,
  getCompanyProfileMe,
  patchCompanyProfileMe,
  patchCompanyProfileProductMe,
  postCompanyProfileProductMe
} from "../controllers/company-profile.controller";

const router = Router();

router.use(authenticateRequest, requireRole("empresa"));

router.get("/me", getCompanyProfileMe);
router.patch("/me", patchCompanyProfileMe);
router.post("/me/products", postCompanyProfileProductMe);
router.patch("/me/products/:productId", patchCompanyProfileProductMe);
router.delete("/me/products/:productId", deleteCompanyProfileProductMe);

export default router;
