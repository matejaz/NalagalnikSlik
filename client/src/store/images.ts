import { defineStore } from "pinia";
import axios from "axios";

const api = axios.create({
	baseURL: "http://localhost:5000/api",
	withCredentials: true, // Include authentication cookies with requests
});

export const useImages = defineStore("images", {
	state: () => ({ list: [] as any[] }),
	actions: {
		async fetchAll() {
			const { data } = await api.get("/images");
			this.list = data;
		},
		async upload(file: File, title: string, isPublic: boolean = false) {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("title", title);
			fd.append("isPublic", isPublic.toString());
			await api.post("/images", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			await this.fetchAll();
		},
		async updateTitle(id: string, title: string) {
			await api.patch(`/images/${id}`, { title });
			await this.fetchAll();
		},
		async updateImage(
			id: string,
			updates: { title?: string; isPublic?: boolean }
		) {
			if (updates.isPublic !== undefined) {
				await api.patch(`/images/${id}/visibility`, {
					isPublic: updates.isPublic,
				});
			}
			if (updates.title !== undefined) {
				await api.patch(`/images/${id}`, { title: updates.title });
			}
			await this.fetchAll();
		},
		async remove(id: string) {
			await api.delete(`/images/${id}`);
			this.list = this.list.filter((i) => i.id !== id);
		},
		async checkProcessingStatus() {
			// Refresh the list to get updated processing status
			await this.fetchAll();
		},
		getProcessingImages() {
			return this.list.filter(
				(img) =>
					img.processingStatus === "pending" ||
					img.processingStatus === "processing"
			);
		},
		getImageById(id: string) {
			return this.list.find((img) => img.id === id);
		},
	},
});
