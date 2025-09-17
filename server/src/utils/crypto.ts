import fs from "fs/promises";
import crypto from "crypto";

const ALLOWED = ["image/jpeg", "image/png", "image/svg+xml", "image/bmp"];
export function ensureAllowedType(mime: string) {
	if (!ALLOWED.includes(mime)) throw new Error("Nedovoljen tip datoteke");
}

// AES-256-GCM s ključem iz .env (MASTER_KEY_GCM)
const key = (() => {
	const raw = process.env.MASTER_KEY_GCM;
	if (!raw) throw new Error("MANJKA MASTER_KEY_GCM");
	// pričakujemo hex ali base64
	try {
		return Buffer.from(raw, "hex");
	} catch {}
})();

export async function encryptAndSave(path: string, data: Buffer) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key!, iv);
	const enc = Buffer.concat([cipher.update(data), cipher.final()]);
	const tag = cipher.getAuthTag();
	const out = Buffer.concat([iv, tag, enc]);
	await fs.writeFile(path, out);
}

export function generateShareToken(): string {
	return crypto.randomBytes(32).toString("hex");
}
