import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { generateShareToken } from "../utils/crypto";
import { ImageProcessor } from "../utils/imageProcessor";
import { ImageHistoryTracker, ImageAction } from "../utils/imageHistory";
import fs from "fs";
import path from "path";

export async function listImages(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const images = await prisma.image.findMany({
		where: { ownerId: userId },
		include: { shares: true },
	});
	res.json(images);
}

export async function uploadImage(req: Request, res: Response) {
	const userId = (req as any).user.id;
	console.log("req.file");
	const file = req.file;
	if (!file) return res.status(400).json({ error: "No file" });

	try {
		// Create initial database record
		const img = await prisma.image.create({
			data: {
				ownerId: userId,
				title: req.body.title || file.originalname,
				mimeType: file.mimetype,
				size: file.size,
				originalSize: file.size,
				path: file.path,
				isPublic: req.body.isPublic === "true" || false,
				processingStatus: "pending",
				encrypted: false,
				thumbnailExists: false,
			},
		});

		// Add to background processing queue
		console.log(`Adding image ${img.id} to processing queue`);
		ImageProcessor.addToProcessingQueue(
			file.path,
			file.originalname,
			img.id
		);

		// Start background processing (non-blocking)
		processImageInBackground(img.id, file.path, file.originalname);

		// Track upload action
		await ImageHistoryTracker.trackUpload(
			img.id,
			userId,
			file.size,
			file.originalname
		);

		res.status(201).json(img);
	} catch (error) {
		console.error("Upload error:", error);
		res.status(500).json({ error: "Upload failed" });
	}
}

// Background processing function
async function processImageInBackground(
	imageId: string,
	filePath: string,
	filename: string
) {
	try {
		// Update status to processing
		await prisma.image.update({
			where: { id: imageId },
			data: { processingStatus: "processing" },
		});

		// Track processing start
		await ImageHistoryTracker.recordAction(
			imageId,
			ImageAction.PROCESSING_START,
			undefined
		);

		console.log(`Starting background processing for image ${imageId}`);

		// Process the image
		const result = await ImageProcessor.processImage(filePath, filename);

		// Update database with processing results
		await prisma.image.update({
			where: { id: imageId },
			data: {
				processedSize: result.processedSize,
				encrypted: result.encrypted,
				thumbnailExists: result.thumbnailCreated,
				processingStatus: "completed",
				processingTime: result.processingTime,
				// Update path to point to encrypted file
				path: result.encrypted ? `${filePath}.enc` : filePath,
			},
		});

		// Track processing completion
		await ImageHistoryTracker.trackProcessingComplete(
			imageId,
			result.processingTime,
			result.processedSize
		);

		// Track additional events
		if (result.encrypted) {
			await ImageHistoryTracker.recordAction(
				imageId,
				ImageAction.ENCRYPTION_APPLIED,
				undefined
			);
		}

		if (result.thumbnailCreated) {
			await ImageHistoryTracker.recordAction(
				imageId,
				ImageAction.THUMBNAIL_GENERATED,
				undefined
			);
		}

		console.log(`Background processing completed for image ${imageId}`);
	} catch (error) {
		console.error(
			`Background processing failed for image ${imageId}:`,
			error
		);

		// Track processing failure
		await ImageHistoryTracker.trackProcessingFailed(
			imageId,
			error instanceof Error ? error.message : "Unknown error"
		);

		// Update status to failed
		await prisma.image.update({
			where: { id: imageId },
			data: { processingStatus: "failed" },
		});
	}
}

export async function getImage(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;
	const { thumbnail } = req.query;

	try {
		const image = await prisma.image.findUnique({
			where: { id },
			include: { shares: true },
		});

		if (
			!image ||
			(image.ownerId !== userId &&
				!image.shares.find((s: { userId: any }) => s.userId === userId))
		) {
			return res.status(403).json({ error: "Forbidden" });
		}

		// Record image view in history (async, don't wait)
		ImageHistoryTracker.trackView(
			id,
			userId,
			req.ip,
			req.get("User-Agent")
		).catch((error) => {
			console.error("Failed to record image view:", error);
		});

		// Handle thumbnail requests
		if (thumbnail === "true") {
			try {
				const uploadsDir = path.dirname(image.path);
				const thumbnailBuffer =
					await ImageProcessor.getDecryptedThumbnail(id, uploadsDir);

				if (thumbnailBuffer) {
					res.set("Content-Type", "image/jpeg");
					return res.send(thumbnailBuffer);
				} else {
					// Fallback to original image if no thumbnail
					console.log(
						`No thumbnail found for image ${id}, serving original`
					);
				}
			} catch (error) {
				console.error(`Thumbnail error for image ${id}:`, error);
				// Fallback to original image
			}
		}

		// Check if image is still being processed
		if (
			(image as any).processingStatus === "pending" ||
			(image as any).processingStatus === "processing"
		) {
			return res.status(202).json({
				message: "Image is still being processed",
				status: (image as any).processingStatus,
			});
		}

		if ((image as any).processingStatus === "failed") {
			return res.status(500).json({
				error: "Image processing failed",
			});
		}

		// Serve original image
		const filePath = path.resolve(image.path);
		console.log(`Attempting to serve image ${id} from path: ${filePath}`);

		// Check if image is encrypted
		if ((image as any).encrypted) {
			try {
				console.log(`Decrypting image ${id}`);
				// For encrypted images, the actual file has .enc extension
				const encryptedFilePath = filePath;
				console.log(`Looking for encrypted file: ${encryptedFilePath}`);

				// Check if encrypted file exists
				if (!fs.existsSync(encryptedFilePath)) {
					console.error(
						`Encrypted file not found: ${encryptedFilePath}`
					);
					return res
						.status(404)
						.json({ error: "Encrypted file not found" });
				}

				const decryptedBuffer = await ImageProcessor.getDecryptedImage(
					encryptedFilePath
				);
				res.set("Content-Type", image.mimeType);
				res.send(decryptedBuffer);
			} catch (error) {
				console.error(`Decryption error for image ${id}:`, error);
				return res
					.status(500)
					.json({ error: "Failed to decrypt image" });
			}
		} else {
			// Serve unencrypted image directly
			console.log(`Serving unencrypted image: ${filePath}`);
			if (!fs.existsSync(filePath)) {
				console.error(`Unencrypted file not found: ${filePath}`);
				return res.status(404).json({ error: "File not found" });
			}
			res.sendFile(filePath);
		}
	} catch (error) {
		console.error(`Error serving image ${id}:`, error);
		res.status(500).json({ error: "Failed to serve image" });
	}
}

export async function updateTitle(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;
	const { title } = req.body;

	const image = await prisma.image.findUnique({ where: { id } });
	if (!image || image.ownerId !== userId)
		return res.status(403).json({ error: "Forbidden" });

	const oldTitle = image.title;
	const updated = await prisma.image.update({
		where: { id },
		data: { title },
	});

	// Track the rename action
	await ImageHistoryTracker.trackRename(id, userId, oldTitle, title);

	res.json(updated);
}

export async function deleteImage(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;

	const image = await prisma.image.findUnique({ where: { id } });
	if (!image || image.ownerId !== userId)
		return res.status(403).json({ error: "Forbidden" });

	// Track deletion before actually deleting
	await ImageHistoryTracker.recordAction(id, ImageAction.DELETE, userId, {
		fileName: image.title,
		fileSize: image.size,
	});

	await prisma.image.delete({ where: { id } });
	if (fs.existsSync(image.path)) fs.unlinkSync(image.path);

	res.json({ ok: true });
}

export async function shareImage(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;

	const image = await prisma.image.findUnique({ where: { id } });
	if (!image || image.ownerId !== userId)
		return res.status(403).json({ error: "Forbidden" });

	const share = await prisma.imageShare.create({
		data: { imageId: id, userId: userId },
	});

	// Track the share action
	await ImageHistoryTracker.recordAction(id, ImageAction.SHARE, userId, {
		sharedWithUserId: userId,
	});

	res.json(share);
}

export async function listSharedImages(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const shares = await prisma.imageShare.findMany({
		where: { userId },
		include: { image: true },
	});
	const images = shares.map((s) => s.image);
	res.json(images);
}

export async function generateShareLink(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;
	const { expirationHours = 24 } = req.body;

	try {
		const image = await prisma.image.findUnique({ where: { id } });
		if (!image || image.ownerId !== userId) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const token = generateShareToken();
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + parseInt(expirationHours));

		const shareToken = await prisma.imageShareToken.create({
			data: {
				token,
				imageId: id,
				expiresAt,
			},
		});

		// Track share link creation
		await ImageHistoryTracker.trackShareLinkCreated(id, userId, token);

		res.json({ shareToken: shareToken.token });
	} catch (error) {
		console.error("Error generating share link:", error);
		res.status(500).json({ error: "Failed to generate share link" });
	}
}

export async function listPublicImages(req: Request, res: Response) {
	try {
		const images = await prisma.image.findMany({
			where: { isPublic: true },
			include: {
				owner: { select: { id: true, email: true } },
				likes: { select: { userId: true } },
				_count: { select: { likes: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		res.json(images);
	} catch (error) {
		console.error("Error listing public images:", error);
		res.status(500).json({ error: "Failed to list public images" });
	}
}

export async function toggleImageVisibility(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;
	const { isPublic } = req.body;

	try {
		const image = await prisma.image.findUnique({ where: { id } });
		if (!image || image.ownerId !== userId) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const updatedImage = await prisma.image.update({
			where: { id },
			data: { isPublic },
			include: {
				likes: { select: { userId: true } },
				_count: { select: { likes: true } },
			},
		});

		res.json(updatedImage);
	} catch (error) {
		console.error("Error updating image visibility:", error);
		res.status(500).json({ error: "Failed to update image visibility" });
	}
}

export async function getTopUploaders(req: Request, res: Response) {
	try {
		const { period = "week" } = req.query;

		let dateFilter = new Date();
		switch (period) {
			case "day":
				dateFilter.setDate(dateFilter.getDate() - 1);
				break;
			case "week":
				dateFilter.setDate(dateFilter.getDate() - 7);
				break;
			case "month":
				dateFilter.setMonth(dateFilter.getMonth() - 1);
				break;
			default:
				dateFilter.setDate(dateFilter.getDate() - 7);
		}

		const topUploaders = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				_count: {
					select: {
						images: {
							where: {
								isPublic: true,
								createdAt: {
									gte: dateFilter,
								},
							},
						},
					},
				},
			},
			where: {
				images: {
					some: {
						isPublic: true,
						createdAt: {
							gte: dateFilter,
						},
					},
				},
			},
			orderBy: {
				images: {
					_count: "desc",
				},
			},
			take: 10,
		});

		res.json(topUploaders);
	} catch (error) {
		console.error("Error fetching top uploaders:", error);
		res.status(500).json({ error: "Failed to fetch top uploaders" });
	}
}

export async function getTopLikedUsers(req: Request, res: Response) {
	try {
		const { period = "week" } = req.query;

		let dateFilter = new Date();
		switch (period) {
			case "day":
				dateFilter.setDate(dateFilter.getDate() - 1);
				break;
			case "week":
				dateFilter.setDate(dateFilter.getDate() - 7);
				break;
			case "month":
				dateFilter.setMonth(dateFilter.getMonth() - 1);
				break;
			default:
				dateFilter.setDate(dateFilter.getDate() - 7);
		}

		const topLikedUsers = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				images: {
					select: {
						id: true,
						title: true,
						_count: {
							select: {
								likes: {
									where: {
										createdAt: {
											gte: dateFilter,
										},
									},
								},
							},
						},
					},
					where: {
						isPublic: true,
					},
				},
			},
			where: {
				images: {
					some: {
						isPublic: true,
						likes: {
							some: {
								createdAt: {
									gte: dateFilter,
								},
							},
						},
					},
				},
			},
		});

		// Calculate total likes for each user
		const usersWithLikeCounts = topLikedUsers
			.map((user) => {
				const totalLikes = user.images.reduce(
					(sum, image) => sum + image._count.likes,
					0
				);
				return {
					id: user.id,
					email: user.email,
					totalLikes,
					publicImageCount: user.images.length,
				};
			})
			.sort((a, b) => b.totalLikes - a.totalLikes)
			.slice(0, 10);

		res.json(usersWithLikeCounts);
	} catch (error) {
		console.error("Error fetching top liked users:", error);
		res.status(500).json({ error: "Failed to fetch top liked users" });
	}
}

export async function recordImageView(req: Request, res: Response) {
	try {
		const userId = (req as any).user?.id;
		const { imageId } = req.params;
		const { action = "view" } = req.body;

		// Check if image exists and is accessible to user
		const image = await prisma.image.findFirst({
			where: {
				id: imageId,
				OR: [
					{ isPublic: true },
					{ ownerId: userId },
					{
						shares: {
							some: { userId: userId },
						},
					},
				],
			},
		});

		if (!image) {
			return res.status(404).json({ error: "Image not found" });
		}

		// Record the action in history with request metadata
		await ImageHistoryTracker.recordAction(
			imageId,
			action as ImageAction,
			userId,
			{
				ipAddress: req.ip,
				userAgent: req.get("User-Agent"),
			}
		);

		res.json({ success: true });
	} catch (error) {
		console.error("Error recording image view:", error);
		res.status(500).json({ error: "Failed to record image view" });
	}
}

export async function getUserImageHistory(req: Request, res: Response) {
	try {
		const userId = (req as any).user.id;
		const { limit = 20, offset = 0 } = req.query;

		// Use the new history tracker to get user's history
		const history = await ImageHistoryTracker.getUserImageHistory(
			userId,
			parseInt(limit as string)
		);

		// Transform the data for the frontend
		const transformedHistory = history.map((entry) => ({
			id: entry.image.id,
			title: entry.image.title,
			mimeType: entry.image.mimeType,
			owner: entry.user || { email: "System" },
			lastViewedAt: entry.timestamp,
			action: entry.action,
			description: entry.description,
			_count: { likes: 0 }, // This would need a separate query if needed
		}));

		res.json(transformedHistory);
	} catch (error) {
		console.error("Error getting user image history:", error);
		res.status(500).json({ error: "Failed to get image history" });
	}
}

export async function getImageViewStats(req: Request, res: Response) {
	try {
		const { imageId } = req.params;
		const userId = (req as any).user.id;

		// Check if user has access to this image
		const image = await prisma.image.findFirst({
			where: {
				id: imageId,
				OR: [
					{ isPublic: true },
					{ ownerId: userId },
					{
						shares: {
							some: { userId: userId },
						},
					},
				],
			},
		});

		if (!image) {
			return res.status(404).json({ error: "Image not found" });
		}

		// Use the new history tracker to get comprehensive stats
		const stats = await ImageHistoryTracker.getImageStats(imageId);

		res.json({
			imageId,
			totalActions: stats.totalActions,
			uniqueUsers: stats.uniqueUsers,
			actionBreakdown: stats.actionBreakdown,
			lastActivity: stats.lastActivity,
		});
	} catch (error) {
		console.error("Error getting image view stats:", error);
		res.status(500).json({ error: "Failed to get image view stats" });
	}
}

// New endpoint to get complete history for a specific image
export async function getImageHistory(req: Request, res: Response) {
	try {
		const { imageId } = req.params;
		const userId = (req as any).user.id;
		const { limit } = req.query;

		// Check if user has access to this image
		const image = await prisma.image.findFirst({
			where: {
				id: imageId,
				OR: [
					{ isPublic: true },
					{ ownerId: userId },
					{
						shares: {
							some: { userId: userId },
						},
					},
				],
			},
		});

		if (!image) {
			return res.status(404).json({ error: "Image not found" });
		}

		// Get complete history for this image
		const history = await ImageHistoryTracker.getImageHistory(
			imageId,
			limit ? parseInt(limit as string) : undefined
		);

		res.json(history);
	} catch (error) {
		console.error("Error getting image history:", error);
		res.status(500).json({ error: "Failed to get image history" });
	}
}
