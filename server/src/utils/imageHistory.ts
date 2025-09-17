import { prisma } from "./prisma";

export enum ImageAction {
	UPLOAD = "upload",
	VIEW = "view",
	DOWNLOAD = "download",
	SHARE = "share",
	RENAME = "rename",
	DELETE = "delete",
	PRIVACY_CHANGE = "privacy_change",
	PROCESSING_START = "processing_start",
	PROCESSING_COMPLETE = "processing_complete",
	PROCESSING_FAILED = "processing_failed",
	THUMBNAIL_GENERATED = "thumbnail_generated",
	ENCRYPTION_APPLIED = "encryption_applied",
	SHARE_LINK_CREATED = "share_link_created",
	SHARE_LINK_ACCESSED = "share_link_accessed",
	LIKE_ADDED = "like_added",
	LIKE_REMOVED = "like_removed",
}

interface HistoryMetadata {
	oldValue?: any;
	newValue?: any;
	ipAddress?: string;
	userAgent?: string;
	shareToken?: string;
	processingTime?: number;
	fileSize?: number;
	error?: string;
	[key: string]: any;
}

export class ImageHistoryTracker {
	/**
	 * Records an action in the image history
	 */
	static async recordAction(
		imageId: string,
		action: ImageAction,
		userId?: string,
		metadata?: HistoryMetadata,
		description?: string
	) {
		try {
			await prisma.imageHistory.create({
				data: {
					imageId,
					userId: userId || undefined,
					action,
					metadata: metadata
						? JSON.parse(JSON.stringify(metadata))
						: null,
					description:
						description ||
						ImageHistoryTracker.generateDescription(
							action,
							metadata
						),
				},
			});
		} catch (error) {
			console.error("Failed to record image history:", error);
		}
	}

	/**
	 * Generates a human-readable description for an action
	 */
	private static generateDescription(
		action: ImageAction,
		metadata?: HistoryMetadata
	): string {
		switch (action) {
			case ImageAction.UPLOAD:
				return `Image uploaded (${
					metadata?.fileSize
						? `${Math.round(metadata.fileSize / 1024)}KB`
						: "unknown size"
				})`;

			case ImageAction.VIEW:
				return "Image viewed";

			case ImageAction.DOWNLOAD:
				return "Image downloaded";

			case ImageAction.SHARE:
				return "Image shared with user";

			case ImageAction.RENAME:
				return `Renamed from "${metadata?.oldValue}" to "${metadata?.newValue}"`;

			case ImageAction.DELETE:
				return "Image deleted";

			case ImageAction.PRIVACY_CHANGE:
				return `Privacy changed to ${
					metadata?.newValue ? "public" : "private"
				}`;

			case ImageAction.PROCESSING_START:
				return "Image processing started";

			case ImageAction.PROCESSING_COMPLETE:
				return `Processing completed in ${metadata?.processingTime}ms`;

			case ImageAction.PROCESSING_FAILED:
				return `Processing failed: ${
					metadata?.error || "Unknown error"
				}`;

			case ImageAction.THUMBNAIL_GENERATED:
				return "Thumbnail generated";

			case ImageAction.ENCRYPTION_APPLIED:
				return "Encryption applied to image";

			case ImageAction.SHARE_LINK_CREATED:
				return "Share link created";

			case ImageAction.SHARE_LINK_ACCESSED:
				return "Share link accessed";

			case ImageAction.LIKE_ADDED:
				return "Image liked";

			case ImageAction.LIKE_REMOVED:
				return "Like removed";

			default:
				return `Action performed: ${action}`;
		}
	}

	/**
	 * Gets the complete history for an image
	 */
	static async getImageHistory(imageId: string, limit?: number) {
		return await prisma.imageHistory.findMany({
			where: { imageId },
			include: {
				user: {
					select: {
						id: true,
						email: true,
					},
				},
			},
			orderBy: { timestamp: "desc" },
			take: limit,
		});
	}

	/**
	 * Gets history for all images owned by a user
	 */
	static async getUserImageHistory(userId: string, limit?: number) {
		return await prisma.imageHistory.findMany({
			where: {
				image: {
					ownerId: userId,
				},
			},
			include: {
				image: {
					select: {
						id: true,
						title: true,
						mimeType: true,
					},
				},
				user: {
					select: {
						id: true,
						email: true,
					},
				},
			},
			orderBy: { timestamp: "desc" },
			take: limit,
		});
	}

	/**
	 * Gets activity stats for an image
	 */
	static async getImageStats(imageId: string) {
		const stats = await prisma.imageHistory.groupBy({
			by: ["action"],
			where: { imageId },
			_count: {
				action: true,
			},
		});

		const totalActions = await prisma.imageHistory.count({
			where: { imageId },
		});

		const uniqueUsers = await prisma.imageHistory.findMany({
			where: {
				imageId,
				userId: { not: null },
			},
			select: { userId: true },
			distinct: ["userId"],
		});

		const lastActivity = await prisma.imageHistory.findFirst({
			where: { imageId },
			orderBy: { timestamp: "desc" },
			include: {
				user: {
					select: {
						email: true,
					},
				},
			},
		});

		return {
			totalActions,
			uniqueUsers: uniqueUsers.length,
			actionBreakdown: stats.reduce((acc, stat) => {
				acc[stat.action] = stat._count.action;
				return acc;
			}, {} as Record<string, number>),
			lastActivity,
		};
	}

	/**
	 * Helper methods for common actions
	 */
	static async trackUpload(
		imageId: string,
		userId: string,
		fileSize: number,
		fileName: string
	) {
		await this.recordAction(imageId, ImageAction.UPLOAD, userId, {
			fileSize,
			fileName,
		});
	}

	static async trackView(
		imageId: string,
		userId?: string,
		ipAddress?: string,
		userAgent?: string
	) {
		await this.recordAction(imageId, ImageAction.VIEW, userId, {
			ipAddress,
			userAgent,
		});
	}

	static async trackDownload(
		imageId: string,
		userId?: string,
		ipAddress?: string
	) {
		await this.recordAction(imageId, ImageAction.DOWNLOAD, userId, {
			ipAddress,
		});
	}

	static async trackRename(
		imageId: string,
		userId: string,
		oldTitle: string,
		newTitle: string
	) {
		await this.recordAction(imageId, ImageAction.RENAME, userId, {
			oldValue: oldTitle,
			newValue: newTitle,
		});
	}

	static async trackPrivacyChange(
		imageId: string,
		userId: string,
		oldPublic: boolean,
		newPublic: boolean
	) {
		await this.recordAction(imageId, ImageAction.PRIVACY_CHANGE, userId, {
			oldValue: oldPublic,
			newValue: newPublic,
		});
	}

	static async trackProcessingComplete(
		imageId: string,
		processingTime: number,
		processedSize?: number
	) {
		await this.recordAction(
			imageId,
			ImageAction.PROCESSING_COMPLETE,
			undefined,
			{
				processingTime,
				processedSize,
			}
		);
	}

	static async trackProcessingFailed(imageId: string, error: string) {
		await this.recordAction(
			imageId,
			ImageAction.PROCESSING_FAILED,
			undefined,
			{
				error,
			}
		);
	}

	static async trackShareLinkCreated(
		imageId: string,
		userId: string,
		token: string
	) {
		await this.recordAction(
			imageId,
			ImageAction.SHARE_LINK_CREATED,
			userId,
			{
				shareToken: token,
			}
		);
	}

	static async trackShareLinkAccessed(
		imageId: string,
		token: string,
		ipAddress?: string
	) {
		await this.recordAction(
			imageId,
			ImageAction.SHARE_LINK_ACCESSED,
			undefined,
			{
				shareToken: token,
				ipAddress,
			}
		);
	}

	static async trackLike(imageId: string, userId: string, isLiked: boolean) {
		await this.recordAction(
			imageId,
			isLiked ? ImageAction.LIKE_ADDED : ImageAction.LIKE_REMOVED,
			userId
		);
	}
}
