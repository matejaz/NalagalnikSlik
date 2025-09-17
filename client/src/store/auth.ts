import { defineStore } from "pinia";
import axios from "axios";

const api = axios.create({
	baseURL: "http://localhost:5000/api",
	withCredentials: true, // da pošilja piškotke
});

export const useAuth = defineStore("auth", {
	state: () => ({
		user: null as null | { id: string; email: string },
		error: "",
	}),
	actions: {
		async register(email: string, password: string) {
			try {
				await api.post("/auth/register", { email, password });
				return true;
			} catch (err: any) {
				this.error = err.response?.data?.error || "Napaka";
				return false;
			}
		},
		async login(email: string, password: string) {
			try {
				const { data } = await api.post("/auth/login", {
					email,
					password,
				});
				this.user = data;
				return true;
			} catch (err: any) {
				this.error = err.response?.data?.error || "Napaka";
				return false;
			}
		},
		async me() {
			try {
				const { data } = await api.get("/auth/me");
				this.user = data;
			} catch {
				this.user = null;
			}
		},
		async logout() {
			this.user = null;
			document.cookie = "token=; Max-Age=0";
			await api.post("/auth/logout");
		},
	},
});
