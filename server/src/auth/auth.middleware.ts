import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const token = req.cookies?.token;
	if (!token) return res.status(401).json({ error: "Unauthorized" });

	try {
		const user = jwt.verify(token, JWT_SECRET);
		(req as any).user = user;
		next();
	} catch {
		return res.status(401).json({ error: "Invalid token" });
	}
}
