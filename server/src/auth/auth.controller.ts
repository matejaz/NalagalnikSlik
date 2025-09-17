import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function register(req: Request, res: Response) {
	const { email, password } = req.body;
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) return res.status(400).json({ error: "User exists" });

	const hash = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: { email, passwordHash: hash },
	});
	res.json({ id: user.id, email: user.email });
}

export async function login(req: Request, res: Response) {
	const { email, password } = req.body;
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) return res.status(400).json({ error: "Invalid credentials" });

	const match = await bcrypt.compare(password, user.passwordHash);
	if (!match) return res.status(400).json({ error: "Invalid credentials" });

	const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
		expiresIn: "1d",
	});

	// 🔑 nastavimo HttpOnly cookie
	res.cookie("token", token, {
		httpOnly: true,
		secure: false, // development only
		sameSite: "lax",
		maxAge: 24 * 60 * 60 * 1000, // 1 dan
	});

	res.json({ message: "Logged in" });
}

export async function profile(req: Request, res: Response) {
	res.json((req as any).user);
}
