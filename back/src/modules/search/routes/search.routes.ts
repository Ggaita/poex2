import { Router } from "express";
import { searchPublicProfiles } from "../controllers/search.controller";

const router = Router();

router.get("/", searchPublicProfiles);

export default router;
