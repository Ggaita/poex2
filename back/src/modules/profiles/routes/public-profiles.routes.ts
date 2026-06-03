import { Router } from "express";
import {
  getPublicProfileDetail,
  getPublicProfiles
} from "../controllers/public-profiles.controller";

const router = Router();

router.get("/", getPublicProfiles);
router.get("/:id", getPublicProfileDetail);

export default router;
