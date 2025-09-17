import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export async function toggleLike(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { imageId } = req.params;

	try {
		// Check if image exists and is public
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			return res.status(404).json({ error: "Image not found" });
		}

		if (!image.isPublic && image.ownerId !== userId) {
			return res
				.status(403)
				.json({ error: "Cannot like private images" });
		}

		// Check if user already liked this image
		const existingLike = await prisma.like.findUnique({
			where: {
				imageId_userId: {
					imageId,
					userId,
				},
			},
		});

		if (existingLike) {
			// Unlike the image
			await prisma.like.delete({
				where: {
					imageId_userId: {
						imageId,
						userId,
					},
				},
			});

			res.json({ liked: false, message: "Image unliked" });
		} else {
			// Like the image
			await prisma.like.create({
				data: {
					imageId,
					userId,
				},
			});

			res.json({ liked: true, message: "Image liked" });
		}
	} catch (error) {
		console.error("Error toggling like:", error);
		res.status(500).json({ error: "Failed to toggle like" });
	}
}

export async function getLikeStatus(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { imageId } = req.params;

	try {
		const like = await prisma.like.findUnique({
			where: {
				imageId_userId: {
					imageId,
					userId,
				},
			},
		});

		const likeCount = await prisma.like.count({
			where: { imageId },
		});

		res.json({
			liked: !!like,
			likeCount,
		});
	} catch (error) {
		console.error("Error getting like status:", error);
		res.status(500).json({ error: "Failed to get like status" });
	}
}
