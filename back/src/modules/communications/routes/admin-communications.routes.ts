import { Router } from "express";
import { authenticateRequest, requireRole } from "../../../middlewares/auth.middleware";
import {
  getAdminCommunicationRecipients,
  getAdminEmailOutbox,
  getAdminEmailTemplates,
  patchAdminEmailTemplate,
  postAdminManualNotifications
} from "../controllers/admin-communications.controller";

const router = Router();

router.use(authenticateRequest, requireRole("admin"));

router.get("/templates", getAdminEmailTemplates);
router.patch("/templates/:key", patchAdminEmailTemplate);
router.get("/recipients", getAdminCommunicationRecipients);
router.post("/notifications/manual", postAdminManualNotifications);
router.get("/outbox", getAdminEmailOutbox);

export default router;
