import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  deleteAdminInvestmentOpportunity,
  getAdminInvestmentInquiries,
  getAdminInvestmentInquiriesPendingCount,
  getAdminInvestmentOpportunities,
  getAdminInvestmentOpportunityDetail,
  patchAdminInvestmentInquiry,
  patchAdminInvestmentOpportunity,
  postAdminInvestmentOpportunity
} from "../controllers/admin-investment-opportunities.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin"));

router.get("/", getAdminInvestmentOpportunities);
router.post("/", postAdminInvestmentOpportunity);
router.get("/inquiries/pending-count", getAdminInvestmentInquiriesPendingCount);
router.get("/inquiries", getAdminInvestmentInquiries);
router.patch("/inquiries/:id", patchAdminInvestmentInquiry);
router.get("/:id", getAdminInvestmentOpportunityDetail);
router.patch("/:id", patchAdminInvestmentOpportunity);
router.delete("/:id", deleteAdminInvestmentOpportunity);

export default router;
