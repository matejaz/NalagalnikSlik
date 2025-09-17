import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
	createGroup,
	listUserGroups,
	getGroup,
	updateGroup,
	deleteGroup,
	addMember,
	removeMember,
} from "./groups.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createGroup);
router.get("/", listUserGroups);
router.get("/:id", getGroup);
router.patch("/:id", updateGroup);
router.delete("/:id", deleteGroup);
router.post("/members", addMember);
router.delete("/:groupId/members/:memberId", removeMember);

export default router;
