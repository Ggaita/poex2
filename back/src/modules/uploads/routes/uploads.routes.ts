import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  logoUpload,
  opportunityDocumentUpload,
  opportunityImageUpload,
  productUpload
} from "../../../lib/uploads";
import {
  handleUploadError,
  postLogoUpload,
  postOpportunityDocumentUpload,
  postOpportunityImageUpload,
  postProductImageUpload
} from "../controllers/uploads.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin", "empresa"));

router.post("/logo", (req, res) => {
  logoUpload.single("file")(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res);
      return;
    }
    postLogoUpload(req, res);
  });
});

router.post("/product-image", (req, res) => {
  productUpload.single("file")(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res);
      return;
    }
    postProductImageUpload(req, res);
  });
});

router.post("/opportunity-image", authenticateRequest, requireRole("admin"), (req, res) => {
  opportunityImageUpload.single("file")(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res);
      return;
    }
    postOpportunityImageUpload(req, res);
  });
});

router.post("/opportunity-document", authenticateRequest, requireRole("admin"), (req, res) => {
  opportunityDocumentUpload.single("file")(req, res, (error) => {
    if (error) {
      handleUploadError(error, req, res);
      return;
    }
    postOpportunityDocumentUpload(req, res);
  });
});

export default router;
