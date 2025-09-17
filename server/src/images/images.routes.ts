import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../auth/auth.middleware";
import {
	listImages,
	uploadImage,
	updateTitle,
	deleteImage,
	shareImage,
	getImage,
	listSharedImages,
	generateShareLink,
	listPublicImages,
	toggleImageVisibility,
	getTopUploaders,
	getTopLikedUsers,
	recordImageView,
	getUserImageHistory,
	getImageViewStats,
	getImageHistory,
} from "./images.controller";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.use(requireAuth);

router.get("/", listImages);
router.get("/public", listPublicImages);
router.get("/top-uploaders", getTopUploaders);
router.get("/top-liked", getTopLikedUsers);
router.get("/history", getUserImageHistory);
router.post("/", upload.single("file"), uploadImage);
router.get("/:id", getImage);
router.get("/:id/history", getImageHistory);
router.get("/:id/stats", getImageViewStats);
router.post("/:id/view", recordImageView);
router.patch("/:id", updateTitle);
router.patch("/:id/visibility", toggleImageVisibility);
router.delete("/:id", deleteImage);
router.post("/:id/share", generateShareLink);
router.post("/:id/share/:userId", shareImage);
router.get("/shared-with-me", listSharedImages);
router.post("/logout", (req, res) => {
	res.clearCookie("token");
	res.json({ message: "Logged out" });
});
export default router;
