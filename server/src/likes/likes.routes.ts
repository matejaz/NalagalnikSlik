import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { toggleLike, getLikeStatus } from "./likes.controller";

const router = Router();

router.use(requireAuth);

router.post("/:imageId", toggleLike);
router.get("/:imageId", getLikeStatus);

export default router;
