import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllData() {
	try {
		console.log("🗑️  Starting database cleanup...");

		// Delete in order to respect foreign key constraints
		console.log("Deleting ImageHistory records...");
		await prisma.imageHistory.deleteMany();

		console.log("Deleting ImageShareTokens...");
		await prisma.imageShareToken.deleteMany();

		console.log("Deleting Likes...");
		await prisma.like.deleteMany();

		console.log("Deleting ImageShares...");
		await prisma.imageShare.deleteMany();

		console.log("Deleting GroupMembers...");
		await prisma.groupMember.deleteMany();

		console.log("Deleting Groups...");
		await prisma.group.deleteMany();

		console.log("Deleting Images...");
		await prisma.image.deleteMany();

		console.log("Deleting Users...");
		await prisma.user.deleteMany();

		console.log("✅ All database data has been cleared successfully!");

		// Get counts to verify
		const counts = {
			users: await prisma.user.count(),
			images: await prisma.image.count(),
			groups: await prisma.group.count(),
			groupMembers: await prisma.groupMember.count(),
			imageShares: await prisma.imageShare.count(),
			imageShareTokens: await prisma.imageShareToken.count(),
			likes: await prisma.like.count(),
			imageHistory: await prisma.imageHistory.count(),
		};

		console.log("📊 Verification - Record counts after cleanup:");
		console.log(counts);

		if (Object.values(counts).every((count) => count === 0)) {
			console.log("✅ Database is completely empty!");
		} else {
			console.log("⚠️  Some records might still exist");
		}
	} catch (error) {
		console.error("❌ Error clearing database:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

clearAllData();
