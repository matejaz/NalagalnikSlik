import sharp from "sharp";
import CryptoJS from "crypto-js";
import fs from "fs/promises";
import path from "path";

const ENCRYPTION_KEY =
	process.env.ENCRYPTION_KEY || "your-secret-key-change-this";
const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || "1920");
const MAX_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || "1080");
const THUMBNAIL_SIZE = parseInt(process.env.THUMBNAIL_SIZE || "300");

export interface ImageProcessingResult {
	originalSize: number;
	processedSize: number;
	encrypted: boolean;
	thumbnailCreated: boolean;
	processingTime: number;
}

export class ImageProcessor {
	private static async encryptFile(filePath: string): Promise<void> {
		try {
			// Check if file exists before processing
			try {
				await fs.access(filePath);
			} catch (accessError) {
				console.error(`File not found for encryption: ${filePath}`);
				throw new Error(`File not found: ${filePath}`);
			}

			const data = await fs.readFile(filePath);
			const encrypted = CryptoJS.AES.encrypt(
				data.toString("base64"),
				ENCRYPTION_KEY
			).toString();
			await fs.writeFile(filePath + ".enc", encrypted);

			// Only try to delete if file still exists
			try {
				await fs.access(filePath);
				await fs.unlink(filePath); // Remove original
			} catch (unlinkError) {
				console.warn(`Original file already removed: ${filePath}`);
			}
		} catch (error) {
			console.error("Encryption error:", error);
			throw error;
		}
	}

	private static async decryptFile(encryptedPath: string): Promise<Buffer> {
		try {
			const encryptedData = await fs.readFile(encryptedPath, "utf8");
			const decrypted = CryptoJS.AES.decrypt(
				encryptedData,
				ENCRYPTION_KEY
			);
			const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
			return Buffer.from(decryptedBase64, "base64");
		} catch (error) {
			console.error("Decryption error:", error);
			throw error;
		}
	}

	static async processImage(
		inputPath: string,
		filename: string
	): Promise<ImageProcessingResult> {
		const startTime = Date.now();
		let originalSize = 0;
		let processedSize = 0;
		let thumbnailCreated = false;

		try {
			// Get original file size
			const stats = await fs.stat(inputPath);
			originalSize = stats.size;

			// Read and analyze image
			const image = sharp(inputPath);
			const metadata = await image.metadata();

			console.log(
				`Processing image: ${filename}, size: ${originalSize} bytes, dimensions: ${metadata.width}x${metadata.height}`
			);

			// Create processed filename
			const ext = path.extname(filename);
			const basename = path.basename(filename, ext);
			const processedPath = path.join(
				path.dirname(inputPath),
				`${basename}_processed${ext}`
			);
			const thumbnailPath = path.join(
				path.dirname(inputPath),
				`${basename}_thumb${ext}`
			);

			// Resize if image is too large
			let needsResizing = false;
			if (metadata.width && metadata.height) {
				needsResizing =
					metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT;
			}

			if (needsResizing) {
				console.log(
					`Resizing image from ${metadata.width}x${metadata.height}`
				);
				await image
					.resize(MAX_WIDTH, MAX_HEIGHT, {
						fit: "inside",
						withoutEnlargement: true,
					})
					.jpeg({ quality: 85 })
					.toFile(processedPath);

				// Get processed file size
				const processedStats = await fs.stat(processedPath);
				processedSize = processedStats.size;

				// Replace original with processed
				await fs.unlink(inputPath);
				await fs.rename(processedPath, inputPath);
			} else {
				processedSize = originalSize;
			}

			// Create thumbnail
			try {
				await image
					.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
						fit: "cover",
						position: "center",
					})
					.jpeg({ quality: 80 })
					.toFile(thumbnailPath);
				thumbnailCreated = true;
				console.log(`Thumbnail created: ${thumbnailPath}`);
			} catch (thumbError) {
				console.error("Thumbnail creation failed:", thumbError);
			}

			// Encrypt the processed image
			await this.encryptFile(inputPath);
			console.log(`Image encrypted: ${inputPath}.enc`);

			// Encrypt thumbnail if created
			if (thumbnailCreated) {
				await this.encryptFile(thumbnailPath);
				console.log(`Thumbnail encrypted: ${thumbnailPath}.enc`);
			}

			const processingTime = Date.now() - startTime;
			console.log(`Image processing completed in ${processingTime}ms`);

			return {
				originalSize,
				processedSize,
				encrypted: true,
				thumbnailCreated,
				processingTime,
			};
		} catch (error) {
			console.error("Image processing failed:", error);
			throw error;
		}
	}

	static async getDecryptedImage(encryptedPath: string): Promise<Buffer> {
		return await this.decryptFile(encryptedPath);
	}

	static async getDecryptedThumbnail(
		imageId: string,
		uploadsDir: string
	): Promise<Buffer | null> {
		try {
			const thumbnailPath = path.join(
				uploadsDir,
				`${imageId}_thumb.jpg.enc`
			);
			return await this.decryptFile(thumbnailPath);
		} catch (error) {
			console.log(`No thumbnail found for image ${imageId}`);
			return null;
		}
	}

	// Background processing queue (simple implementation)
	private static processingQueue: Array<{
		filePath: string;
		filename: string;
		imageId: string;
	}> = [];
	private static isProcessing = false;

	static addToProcessingQueue(
		filePath: string,
		filename: string,
		imageId: string
	) {
		this.processingQueue.push({ filePath, filename, imageId });
		this.processQueue();
	}

	private static async processQueue() {
		if (this.isProcessing || this.processingQueue.length === 0) {
			return;
		}

		this.isProcessing = true;

		while (this.processingQueue.length > 0) {
			const item = this.processingQueue.shift();
			if (item) {
				try {
					console.log(`Processing queued image: ${item.filename}`);
					await this.processImage(item.filePath, item.filename);
					console.log(
						`Queue processing completed for: ${item.filename}`
					);
				} catch (error) {
					console.error(
						`Queue processing failed for ${item.filename}:`,
						error
					);
				}
			}
		}

		this.isProcessing = false;
	}
}
