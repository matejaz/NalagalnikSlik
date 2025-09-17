<template>
	<div class="public-gallery-page min-h-screen surface-ground">
		<div class="flex flex-col items-center py-5 px-3">
			<div
				class="surface-card shadow-2 border-round p-4 w-full max-w-6xl"
			>
				<!-- Navigation Tabs -->
				<div class="flex justify-center mb-4">
					<div class="flex gap-2">
						<Button
							label="Galerija"
							:severity="
								activeTab === 'gallery'
									? 'primary'
									: 'secondary'
							"
							@click="activeTab = 'gallery'"
						/>
						<Button
							label="Top Nalagalci"
							:severity="
								activeTab === 'uploaders'
									? 'primary'
									: 'secondary'
							"
							@click="switchToUploaders()"
						/>
						<Button
							label="Priljubljeni"
							:severity="
								activeTab === 'favorites'
									? 'primary'
									: 'secondary'
							"
							@click="switchToFavorites()"
						/>
						<Button
							label="Zgodovina"
							:severity="
								activeTab === 'history'
									? 'primary'
									: 'secondary'
							"
							@click="switchToHistory()"
						/>
					</div>
				</div>

				<div v-if="activeTab === 'gallery'">
					<div class="flex justify-between items-center mb-4">
						<h2 class="text-2xl font-semibold m-0">
							Javna Galerija
						</h2>
						<div class="flex align-items-center gap-3">
							<span class="text-500"
								>{{ publicImages.length }} slik</span
							>
							<Button
								icon="pi pi-refresh"
								severity="secondary"
								@click="loadPublicImages"
								:loading="loading"
								v-tooltip="'Refresh'"
							/>
						</div>
					</div>

					<!-- Images Grid -->
					<div
						v-if="publicImages.length > 0"
						class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
					>
						<div
							v-for="image in publicImages"
							:key="image.id"
							class="w-full"
						>
							<div
								class="surface-card shadow-1 border-round overflow-hidden"
							>
								<div class="relative">
									<img
										:src="getImageUrl(image.id)"
										:alt="image.title"
										class="w-full h-12rem object-cover cursor-pointer"
										@click="openImagePreview(image)"
										@error="onImageError"
									/>
									<div class="absolute top-2 right-2">
										<Button
											:icon="
												getUserLikeStatus(image.id)
													? 'pi pi-heart-fill'
													: 'pi pi-heart'
											"
											:severity="
												getUserLikeStatus(image.id)
													? 'danger'
													: 'secondary'
											"
											size="small"
											@click="toggleLike(image)"
											v-tooltip="
												getUserLikeStatus(image.id)
													? 'Unlike'
													: 'Like'
											"
										/>
									</div>
								</div>
								<div class="p-3">
									<h3
										class="text-lg font-medium mb-2 line-height-3"
									>
										{{ image.title }}
									</h3>
									<div
										class="flex justify-content-between align-items-center text-sm text-500"
									>
										<span
											>avtor {{ image.owner.email }}</span
										>
										<div
											class="flex align-items-center gap-1"
										>
											<i
												class="pi pi-heart text-red-500"
											></i>
											<span>{{
												image._count.likes
											}}</span>
										</div>
									</div>
									<small class="text-400">
										{{ formatDate(image.createdAt) }}
									</small>
								</div>
							</div>
						</div>
					</div>

					<div
						v-if="publicImages.length === 0 && !loading"
						class="text-center py-8"
					>
						<i class="pi pi-images text-6xl text-400 mb-3"></i>
						<h3 class="text-lg text-600 mb-2">
							No public images yet
						</h3>
						<p class="text-500">Check back later for new content</p>
					</div>

					<div v-if="loading" class="text-center py-8">
						<ProgressSpinner />
					</div>
				</div>

				<div v-if="activeTab === 'uploaders'">
					<div
						class="flex justify-content-between align-items-center mb-4"
					>
						<h2 class="text-2xl font-bold text-color">
							Top nalagalci
						</h2>
						<div class="flex align-items-center gap-2">
							<Dropdown
								v-model="uploadersPeriod"
								:options="periodOptions"
								optionLabel="label"
								optionValue="value"
								@change="loadTopUploaders()"
								class="w-9rem"
							/>
							<Button
								icon="pi pi-refresh"
								@click="loadTopUploaders"
								:loading="uploadersLoading"
								v-tooltip="'Refresh'"
							/>
						</div>
					</div>

					<div
						v-if="uploadersLoading"
						class="flex justify-content-center py-8"
					>
						<ProgressSpinner />
					</div>

					<div v-else-if="topUploaders.length > 0" class="space-y-3">
						<div
							v-for="(uploader, index) in topUploaders"
							:key="uploader.id"
							class="surface-card shadow-1 border-round p-4"
						>
							<div
								class="flex justify-content-between align-items-center"
							>
								<div class="flex align-items-center gap-3">
									<div
										class="flex align-items-center justify-content-center"
										style="width: 2.5rem; height: 2.5rem"
									>
										<Tag
											:value="index + 1"
											:severity="
												index === 0
													? 'success'
													: index === 1
													? 'info'
													: index === 2
													? 'warning'
													: 'secondary'
											"
											style="
												font-size: 0.875rem;
												padding: 0.25rem 0.5rem;
											"
										/>
									</div>
									<div>
										<div class="font-semibold text-color">
											{{ uploader.email }}
										</div>
										<div class="text-500 text-sm">
											{{ uploader._count.images }} image{{
												uploader._count.images !== 1
													? "s"
													: ""
											}}
										</div>
									</div>
								</div>
								<div class="text-right">
									<div class="font-bold text-primary text-lg">
										{{ uploader._count.images }}
									</div>
									<div class="text-500 text-sm">uploads</div>
								</div>
							</div>
						</div>
					</div>

					<div v-else class="text-center py-8">
						<p class="text-500 text-lg">
							No uploaders found for this period.
						</p>
					</div>
				</div>

				<div v-if="activeTab === 'favorites'">
					<div
						class="flex justify-content-between align-items-center mb-4"
					>
						<h2 class="text-2xl font-bold text-color">
							Most Liked Users
						</h2>
						<div class="flex align-items-center gap-2">
							<Dropdown
								v-model="favoritesPeriod"
								:options="periodOptions"
								optionLabel="label"
								optionValue="value"
								@change="loadTopLikedUsers()"
								class="w-9rem"
							/>
							<Button
								icon="pi pi-refresh"
								@click="loadTopLikedUsers"
								:loading="favoritesLoading"
								v-tooltip="'Refresh'"
							/>
						</div>
					</div>

					<div
						v-if="favoritesLoading"
						class="flex justify-content-center py-8"
					>
						<ProgressSpinner />
					</div>

					<div v-else-if="topLikedUsers.length > 0" class="space-y-3">
						<div
							v-for="(user, index) in topLikedUsers"
							:key="user.id"
							class="surface-card shadow-1 border-round p-4"
						>
							<div
								class="flex justify-content-between align-items-center"
							>
								<div class="flex align-items-center gap-3">
									<div
										class="flex align-items-center justify-content-center"
										style="width: 2.5rem; height: 2.5rem"
									>
										<Tag
											:value="index + 1"
											:severity="
												index === 0
													? 'success'
													: index === 1
													? 'info'
													: index === 2
													? 'warning'
													: 'secondary'
											"
											style="
												font-size: 0.875rem;
												padding: 0.25rem 0.5rem;
											"
										/>
									</div>
									<div>
										<div class="font-semibold text-color">
											{{ user.email }}
										</div>
										<div class="text-500 text-sm">
											{{ user.totalLikes }} like{{
												user.totalLikes !== 1 ? "s" : ""
											}}
										</div>
									</div>
								</div>
								<div class="text-right">
									<div class="font-bold text-red-500 text-lg">
										{{ user.totalLikes }}
									</div>
									<div class="text-500 text-sm">likes</div>
								</div>
							</div>
						</div>
					</div>

					<div v-else class="text-center py-8">
						<p class="text-500 text-lg">
							No liked users found for this period.
						</p>
					</div>
				</div>

				<!-- History Tab -->
				<div v-if="activeTab === 'history'">
					<div
						class="flex justify-content-between align-items-center mb-4"
					>
						<h2 class="text-2xl font-bold text-color">
							My Viewing History
						</h2>
						<div class="flex align-items-center gap-2">
							<Button
								icon="pi pi-refresh"
								@click="loadUserHistory"
								:loading="historyLoading"
								v-tooltip="'Refresh'"
							/>
						</div>
					</div>

					<div
						v-if="historyLoading"
						class="flex justify-content-center py-8"
					>
						<ProgressSpinner />
					</div>

					<div v-else-if="userHistory.length > 0" class="space-y-3">
						<div
							v-for="image in userHistory"
							:key="image.id"
							class="surface-card shadow-1 border-round p-4"
						>
							<div class="flex gap-4">
								<div class="flex-shrink-0">
									<img
										:src="getImageUrl(image.id)"
										:alt="image.title"
										class="w-16 h-16 object-cover border-round cursor-pointer"
										@click="openImagePreview(image)"
										@error="onImageError"
									/>
								</div>
								<div class="flex-1">
									<h4 class="font-semibold text-color mb-1">
										{{ image.title }}
									</h4>
									<p class="text-500 text-sm mb-1">
										by {{ image.owner.email }}
									</p>
									<div
										class="flex align-items-center gap-3 text-xs text-400"
									>
										<span
											>Viewed
											{{
												formatDate(image.lastViewedAt)
											}}</span
										>
										<span
											>{{
												image._count.likes
											}}
											likes</span
										>
									</div>
								</div>
								<div class="flex align-items-center">
									<Button
										:icon="
											getUserLikeStatus(image.id)
												? 'pi pi-heart-fill'
												: 'pi pi-heart'
										"
										:severity="
											getUserLikeStatus(image.id)
												? 'danger'
												: 'secondary'
										"
										size="small"
										@click="toggleLike(image)"
										v-tooltip="
											getUserLikeStatus(image.id)
												? 'Unlike'
												: 'Like'
										"
									/>
								</div>
							</div>
						</div>
					</div>

					<div v-else class="text-center py-8">
						<i class="pi pi-history text-6xl text-400 mb-3"></i>
						<h3 class="text-lg text-600 mb-2">
							No viewing history
						</h3>
						<p class="text-500">
							Start viewing images to see your history here
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Image Preview Dialog -->
		<Dialog
			v-model:visible="showPreviewDialog"
			:style="{ width: '80vw', maxWidth: '1000px' }"
			:modal="true"
			:closable="true"
			header="Image Preview"
		>
			<div v-if="selectedImage" class="flex flex-column gap-4">
				<div class="text-center">
					<img
						:src="getImageUrl(selectedImage.id)"
						:alt="selectedImage.title"
						class="max-w-full max-h-70vh object-contain border-round"
						@error="onImageError"
					/>
				</div>
				<div class="flex justify-content-between align-items-start">
					<div class="flex-1">
						<h3 class="text-xl font-semibold mb-2">
							{{ selectedImage.title }}
						</h3>
						<p class="text-600 mb-1">
							by {{ selectedImage.owner.email }}
						</p>
						<small class="text-500">{{
							formatDate(selectedImage.createdAt)
						}}</small>
					</div>
					<div class="flex align-items-center gap-3">
						<Button
							:icon="
								getUserLikeStatus(selectedImage.id)
									? 'pi pi-heart-fill'
									: 'pi pi-heart'
							"
							:severity="
								getUserLikeStatus(selectedImage.id)
									? 'danger'
									: 'secondary'
							"
							:label="selectedImage._count.likes.toString()"
							@click="toggleLike(selectedImage)"
						/>
					</div>
				</div>
			</div>

			<div class="flex justify-content-end gap-2 mt-4">
				<Button
					label="Close"
					severity="secondary"
					@click="showPreviewDialog = false"
				/>
			</div>
		</Dialog>

		<Toast />
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();

const publicImages = ref<any[]>([]);
const loading = ref(true);
const showPreviewDialog = ref(false);
const selectedImage = ref<any>(null);
const userLikes = ref<Set<string>>(new Set());

const activeTab = ref("gallery");

const topUploaders = ref<any[]>([]);
const uploadersLoading = ref(false);
const uploadersPeriod = ref("month");

const topLikedUsers = ref<any[]>([]);
const favoritesLoading = ref(false);
const favoritesPeriod = ref("month");

const userHistory = ref<any[]>([]);
const historyLoading = ref(false);

// Period options for dropdowns
const periodOptions = ref([
	{ label: "Last Day", value: "day" },
	{ label: "Last Week", value: "week" },
	{ label: "Last Month", value: "month" },
]);

onMounted(async () => {
	await loadPublicImages();
});

async function loadPublicImages() {
	try {
		loading.value = true;
		const response = await fetch(
			"http://localhost:5000/api/images/public",
			{
				credentials: "include",
			}
		);
		if (response.ok) {
			publicImages.value = await response.json();
			// Load user's like status for all images
			await loadUserLikes();
		}
	} catch (error) {
		console.error("Error loading public images:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to load public images",
		});
	} finally {
		loading.value = false;
	}
}

async function loadUserLikes() {
	try {
		// Get like status for each image
		const likePromises = publicImages.value.map(async (image) => {
			const response = await fetch(
				`http://localhost:5000/api/likes/${image.id}`,
				{
					credentials: "include",
				}
			);
			if (response.ok) {
				const data = await response.json();
				if (data.liked) {
					userLikes.value.add(image.id);
				}
			}
		});
		await Promise.all(likePromises);
	} catch (error) {
		console.error("Error loading user likes:", error);
	}
}

async function toggleLike(image: any) {
	try {
		const response = await fetch(
			`http://localhost:5000/api/likes/${image.id}`,
			{
				method: "POST",
				credentials: "include",
			}
		);

		if (response.ok) {
			const data = await response.json();
			if (data.liked) {
				userLikes.value.add(image.id);
				image._count.likes += 1;
			} else {
				userLikes.value.delete(image.id);
				image._count.likes -= 1;
			}

			// Update the selected image if it's the same
			if (selectedImage.value && selectedImage.value.id === image.id) {
				selectedImage.value._count.likes = image._count.likes;
			}

			toast.add({
				severity: "success",
				summary: "Success",
				detail: data.liked ? "Image liked" : "Image unliked",
				life: 2000,
			});
		} else {
			throw new Error("Failed to toggle like");
		}
	} catch (error) {
		console.error("Error toggling like:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to update like",
		});
	} finally {
		favoritesLoading.value = false;
	}
}

// Tab switching functions
function switchToUploaders() {
	activeTab.value = "uploaders";
	if (topUploaders.value.length === 0) {
		loadTopUploaders();
	}
}

function switchToFavorites() {
	activeTab.value = "favorites";
	if (topLikedUsers.value.length === 0) {
		loadTopLikedUsers();
	}
}

function switchToHistory() {
	activeTab.value = "history";
	if (userHistory.value.length === 0) {
		loadUserHistory();
	}
}

async function loadTopUploaders() {
	try {
		uploadersLoading.value = true;
		const response = await fetch(
			`http://localhost:5000/api/images/top-uploaders?period=${uploadersPeriod.value}`,
			{
				credentials: "include",
			}
		);
		if (response.ok) {
			topUploaders.value = await response.json();
		} else {
			throw new Error("Failed to load top uploaders");
		}
	} catch (error) {
		console.error("Error loading top uploaders:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to load top uploaders",
		});
	} finally {
		uploadersLoading.value = false;
	}
}

// Top Liked Users functions
async function loadTopLikedUsers() {
	try {
		favoritesLoading.value = true;
		const response = await fetch(
			`http://localhost:5000/api/images/top-liked?period=${favoritesPeriod.value}`,
			{
				credentials: "include",
			}
		);
		if (response.ok) {
			topLikedUsers.value = await response.json();
		} else {
			throw new Error("Failed to load top liked users");
		}
	} catch (error) {
		console.error("Error loading top liked users:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to load top liked users",
		});
	} finally {
		favoritesLoading.value = false;
	}
}

// History functions
async function loadUserHistory() {
	try {
		historyLoading.value = true;
		const response = await fetch(
			"http://localhost:5000/api/images/history",
			{
				credentials: "include",
			}
		);
		if (response.ok) {
			const historyData = await response.json();
			// Transform the data to include the image and viewing metadata
			userHistory.value = historyData.map((item: any) => ({
				...item.image,
				lastViewedAt: item.viewedAt,
				viewType: item.viewType,
			}));
		} else {
			throw new Error("Failed to load user history");
		}
	} catch (error) {
		console.error("Error loading user history:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to load viewing history",
		});
	} finally {
		historyLoading.value = false;
	}
}

function getUserLikeStatus(imageId: string): boolean {
	return userLikes.value.has(imageId);
}

function openImagePreview(image: any) {
	selectedImage.value = image;
	showPreviewDialog.value = true;
}

function getImageUrl(imageId: string): string {
	return `http://localhost:5000/api/images/${imageId}`;
}

function onImageError(event: Event) {
	const target = event.target as HTMLImageElement;
	target.src = "/placeholder-image.png"; // You can add a placeholder image
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
</script>
