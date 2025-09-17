import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import fs from "fs";
import path from "path";

export async function getSharedImage(req: Request, res: Response) {
	const { token } = req.params;

	try {
		const shareToken = await prisma.imageShareToken.findUnique({
			where: { token },
			include: { image: true },
		});

		if (!shareToken) {
			return res.status(404).json({ error: "Share not found" });
		}

		// Check if token has expired
		if (shareToken.expiresAt < new Date()) {
			return res.status(410).json({ error: "Share has expired" });
		}

		res.json({
			image: {
				id: shareToken.image.id,
				title: shareToken.image.title,
				mimeType: shareToken.image.mimeType,
				size: shareToken.image.size,
				createdAt: shareToken.image.createdAt,
			},
			expiresAt: shareToken.expiresAt,
		});
	} catch (error) {
		console.error("Error getting shared image:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}

export async function getSharedImageFile(req: Request, res: Response) {
	const { token } = req.params;

	try {
		const shareToken = await prisma.imageShareToken.findUnique({
			where: { token },
			include: { image: true },
		});

		if (!shareToken) {
			return res.status(404).json({ error: "Share not found" });
		}

		// Check if token has expired
		if (shareToken.expiresAt < new Date()) {
			return res.status(410).json({ error: "Share has expired" });
		}

		const imagePath = shareToken.image.path;
		if (!fs.existsSync(imagePath)) {
			return res.status(404).json({ error: "Image file not found" });
		}

		res.setHeader("Content-Type", shareToken.image.mimeType);
		res.setHeader("Content-Length", shareToken.image.size.toString());

		const readStream = fs.createReadStream(imagePath);
		readStream.pipe(res);
	} catch (error) {
		console.error("Error getting shared image file:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
