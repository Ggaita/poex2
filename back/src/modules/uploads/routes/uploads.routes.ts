import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import { logoUpload, productUpload } from "../../../lib/uploads";
import {
  handleUploadError,
  postLogoUpload,
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

export default router;
