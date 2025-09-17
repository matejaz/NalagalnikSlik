import { Router } from "express";
import { getSharedImage, getSharedImageFile } from "./shared.controller";

const router = Router();

router.get("/:token", getSharedImage);
router.get("/:token/file", getSharedImageFile);

export default router;
