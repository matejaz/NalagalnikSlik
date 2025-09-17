import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export async function createGroup(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { name, description } = req.body;

	try {
		const group = await prisma.group.create({
			data: {
				name,
				description,
				ownerId: userId,
				members: {
					create: {
						userId,
						role: "admin",
					},
				},
			},
			include: {
				owner: { select: { id: true, email: true } },
				members: {
					include: {
						user: { select: { id: true, email: true } },
					},
				},
			},
		});

		res.status(201).json(group);
	} catch (error) {
		console.error("Error creating group:", error);
		res.status(500).json({ error: "Failed to create group" });
	}
}

export async function listUserGroups(req: Request, res: Response) {
	const userId = (req as any).user.id;

	try {
		const groups = await prisma.group.findMany({
			where: {
				OR: [{ ownerId: userId }, { members: { some: { userId } } }],
			},
			include: {
				owner: { select: { id: true, email: true } },
				members: {
					include: {
						user: { select: { id: true, email: true } },
					},
				},
				_count: {
					select: { members: true },
				},
			},
		});

		res.json(groups);
	} catch (error) {
		console.error("Error listing groups:", error);
		res.status(500).json({ error: "Failed to list groups" });
	}
}

export async function getGroup(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;

	try {
		const group = await prisma.group.findFirst({
			where: {
				id,
				OR: [{ ownerId: userId }, { members: { some: { userId } } }],
			},
			include: {
				owner: { select: { id: true, email: true } },
				members: {
					include: {
						user: { select: { id: true, email: true } },
					},
				},
			},
		});

		if (!group) {
			return res.status(404).json({ error: "Group not found" });
		}

		res.json(group);
	} catch (error) {
		console.error("Error getting group:", error);
		res.status(500).json({ error: "Failed to get group" });
	}
}

export async function updateGroup(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;
	const { name, description } = req.body;

	try {
		const group = await prisma.group.findUnique({
			where: { id },
		});

		if (!group || group.ownerId !== userId) {
			return res
				.status(403)
				.json({ error: "Not authorized to update this group" });
		}

		const updatedGroup = await prisma.group.update({
			where: { id },
			data: { name, description },
			include: {
				owner: { select: { id: true, email: true } },
				members: {
					include: {
						user: { select: { id: true, email: true } },
					},
				},
			},
		});

		res.json(updatedGroup);
	} catch (error) {
		console.error("Error updating group:", error);
		res.status(500).json({ error: "Failed to update group" });
	}
}

export async function deleteGroup(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { id } = req.params;

	try {
		const group = await prisma.group.findUnique({
			where: { id },
		});

		if (!group || group.ownerId !== userId) {
			return res
				.status(403)
				.json({ error: "Not authorized to delete this group" });
		}

		await prisma.group.delete({
			where: { id },
		});

		res.json({ message: "Group deleted successfully" });
	} catch (error) {
		console.error("Error deleting group:", error);
		res.status(500).json({ error: "Failed to delete group" });
	}
}

export async function addMember(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { groupId, userEmail } = req.body;

	try {
		// Check if current user is admin or owner of the group
		const group = await prisma.group.findFirst({
			where: {
				id: groupId,
				OR: [
					{ ownerId: userId },
					{
						members: {
							some: {
								userId,
								role: "admin",
							},
						},
					},
				],
			},
		});

		if (!group) {
			return res
				.status(403)
				.json({ error: "Not authorized to add members to this group" });
		}

		// Find the user to add
		const userToAdd = await prisma.user.findUnique({
			where: { email: userEmail },
		});

		if (!userToAdd) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check if user is already a member
		const existingMember = await prisma.groupMember.findUnique({
			where: {
				groupId_userId: {
					groupId,
					userId: userToAdd.id,
				},
			},
		});

		if (existingMember) {
			return res
				.status(400)
				.json({ error: "User is already a member of this group" });
		}

		// Add the member
		const member = await prisma.groupMember.create({
			data: {
				groupId,
				userId: userToAdd.id,
			},
			include: {
				user: { select: { id: true, email: true } },
			},
		});

		res.status(201).json(member);
	} catch (error) {
		console.error("Error adding member:", error);
		res.status(500).json({ error: "Failed to add member" });
	}
}

export async function removeMember(req: Request, res: Response) {
	const userId = (req as any).user.id;
	const { groupId, memberId } = req.params;

	try {
		// Check if current user is admin or owner of the group
		const group = await prisma.group.findFirst({
			where: {
				id: groupId,
				OR: [
					{ ownerId: userId },
					{
						members: {
							some: {
								userId,
								role: "admin",
							},
						},
					},
				],
			},
		});

		if (!group) {
			return res.status(403).json({
				error: "Not authorized to remove members from this group",
			});
		}

		// Don't allow removing the owner
		if (group.ownerId === memberId) {
			return res
				.status(400)
				.json({ error: "Cannot remove the group owner" });
		}

		await prisma.groupMember.deleteMany({
			where: {
				groupId,
				userId: memberId,
			},
		});

		res.json({ message: "Member removed successfully" });
	} catch (error) {
		console.error("Error removing member:", error);
		res.status(500).json({ error: "Failed to remove member" });
	}
}
