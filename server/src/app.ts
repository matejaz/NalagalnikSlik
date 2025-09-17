import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./auth/auth.routes";
import imagesRoutes from "./images/images.routes";
import sharedRoutes from "./shared/shared.routes";
import groupsRoutes from "./groups/groups.routes";
import likesRoutes from "./likes/likes.routes";

const app = express();

const corsOrigins = [
	"http://localhost:5173",
	"http://localhost",
	"http://localhost:80",
];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/shared", sharedRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/likes", likesRoutes);

export default app;
