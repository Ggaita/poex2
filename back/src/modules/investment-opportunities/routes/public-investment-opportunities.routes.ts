import { Router } from "express";
import {
  getPublicInvestmentOpportunities,
  getPublicInvestmentOpportunityDetail,
  postPublicInvestmentInquiry
} from "../controllers/public-investment-opportunities.controller";

const router = Router();

router.get("/", getPublicInvestmentOpportunities);
router.get("/:slug", getPublicInvestmentOpportunityDetail);
router.post("/:id/inquiries", postPublicInvestmentInquiry);

export default router;
