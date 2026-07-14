import { Router } from "express";
import { postPublicSpecialRequest } from "../controllers/public-special-requests.controller";

const router = Router();

router.post("/", postPublicSpecialRequest);

export default router;
