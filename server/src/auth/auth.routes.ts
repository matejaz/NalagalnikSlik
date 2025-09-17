import { Router } from "express";
import { register, login, profile } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, profile);

export default router;
