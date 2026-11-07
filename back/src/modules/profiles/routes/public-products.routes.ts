import { Router } from "express";
import { getPublicProductDetail } from "../controllers/public-products.controller";

const router = Router();

router.get("/:id", getPublicProductDetail);

export default router;
