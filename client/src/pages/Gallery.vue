<template>
	<div class="gallery-page">
		<div v-if="auth.user">
			<div class="text-center mb-5">
				<h1 class="text-4xl font-bold text-900 mb-2">
					<i class="pi pi-images text-primary mr-2"></i>Album Slik
				</h1>
				<p class="text-600 text-lg">Upravljajte svojo zbirko slik</p>

				<div class="mt-4 flex flex-wrap justify-center gap-4">
					<Tag
						:value="`Prijavljeni kot: ${auth.user.email}`"
						severity="success"
						icon="pi pi-user"
					/>
					<Tag
						:value="`Skupaj slik: ${images.list.length}`"
						severity="info"
						icon="pi pi-images"
					/>
					<Tag
						:value="`Javnih: ${
							images.list.filter((img) => img.isPublic).length
						}`"
						severity="warning"
						icon="pi pi-globe"
					/>
					<Tag
						:value="`Zasebnih: ${
							images.list.filter((img) => !img.isPublic).length
						}`"
						severity="secondary"
						icon="pi pi-lock"
					/>
				</div>
			</div>

			<Panel header="Naloži novo sliko" class="mb-4">
				<template #icons>
					<i class="pi pi-cloud-upload"></i>
				</template>
				<div class="flex flex-col md:flex-row gap-3 items-center">
					<FileUpload
						mode="basic"
						name="file"
						accept="image/png, image/jpeg, image/svg, image/bmp"
						chooseLabel="Izberi sliko"
						class="shrink-0"
						@select="onPick"
					/>
					<InputText
						v-model="title"
						placeholder="Naslov slike"
						style="flex: 1"
					/>
					<div class="flex items-center gap-2">
						<Checkbox
							v-model="isPublic"
							inputId="isPublic"
							binary
						/>
						<label for="isPublic" class="text-sm"
							>Objavi javno</label
						>
					</div>
					<Button
						label="Naloži"
						icon="pi pi-upload"
						:disabled="!file"
						:loading="uploading"
						@click="onUpload"
					/>
				</div>
			</Panel>

			<div class="flex justify-between items-center mb-4">
				<h2 class="text-2xl font-bold text-900 m-0">
					<i class="pi pi-images text-primary mr-2"></i>
					Vaše slike ({{ images.list.length }})
				</h2>
				<div class="flex gap-2">
					<Button
						:icon="
							viewMode === 'grid'
								? 'pi pi-th-large'
								: 'pi pi-th-large'
						"
						:severity="
							viewMode === 'grid' ? 'primary' : 'secondary'
						"
						@click="viewMode = 'grid'"
						v-tooltip.top="'Mrežni pogled'"
					/>
					<Button
						:icon="
							viewMode === 'table' ? 'pi pi-list' : 'pi pi-list'
						"
						:severity="
							viewMode === 'table' ? 'primary' : 'secondary'
						"
						@click="viewMode = 'table'"
						v-tooltip.top="'Tabelarni pogled'"
					/>
				</div>
			</div>

			<div v-if="viewMode === 'grid'" class="mb-4">
				<div v-if="images.list.length === 0" class="text-center p-6">
					<i class="pi pi-image text-6xl text-300 mb-3 block"></i>
					<p class="text-500 text-lg">Ni naloženih slik</p>
					<small class="text-400"
						>Naložite svojo prvo sliko zgoraj</small
					>
				</div>
				<div
					v-else
					class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
				>
					<div
						v-for="image in images.list"
						:key="image.id"
						class="w-full"
					>
						<Card class="h-full">
							<template #header>
								<div class="relative">
									<!-- Show processing placeholder for pending/processing images -->
									<div
										v-if="
											image.processingStatus ===
												'pending' ||
											image.processingStatus ===
												'processing'
										"
										class="w-full h-12rem bg-gray-100 flex items-center justify-center cursor-pointer"
										@click="openImageDialog(image)"
									>
										<div class="text-center">
											<i
												class="pi pi-spin pi-spinner text-4xl text-gray-400 mb-2"
											></i>
											<p class="text-gray-500 text-sm">
												Procesiranje...
											</p>
										</div>
									</div>
									<img
										v-else
										:key="`img-${image.id}-${Date.now()}`"
										:src="getImageUrl(image.id)"
										:alt="image.title"
										class="w-full h-12rem object-cover cursor-pointer"
										@click="openImageDialog(image)"
										@error="onImageError"
									/>
									<div class="absolute top-0 right-0 p-2">
										<div
											class="flex flex-col gap-1 items-end"
										>
											<!-- Processing Status Indicator -->
											<Tag
												v-if="
													image.processingStatus ===
													'pending'
												"
												value="ČAKA"
												severity="info"
												class="opacity-90"
												icon="pi pi-clock"
											/>
											<Tag
												v-else-if="
													image.processingStatus ===
													'processing'
												"
												value="PROCESIRANJE"
												severity="warning"
												class="opacity-90"
												icon="pi pi-spin pi-spinner"
											/>
											<Tag
												v-else-if="
													image.processingStatus ===
													'failed'
												"
												value="NAPAKA"
												severity="danger"
												class="opacity-90"
												icon="pi pi-exclamation-triangle"
											/>
											<Tag
												v-else-if="image.encrypted"
												value="ZAŠČITENO"
												severity="success"
												class="opacity-90"
												icon="pi pi-shield"
											/>
											<Tag
												:value="
													image.mimeType
														.split('/')[1]
														.toUpperCase()
												"
												severity="secondary"
												class="opacity-90"
											/>
											<Tag
												v-if="image.isPublic"
												value="JAVNO"
												severity="success"
												class="opacity-90"
												icon="pi pi-globe"
											/>
										</div>
									</div>
								</div>
							</template>
							<template #title>
								<div
									class="text-lg font-semibold text-900 mb-2"
								>
									{{ image.title }}
								</div>
							</template>
							<template #content>
								<div
									class="flex justify-between items-center mb-3"
								>
									<small class="text-500">
										{{ sizeTemplate(image) }}
									</small>
									<small class="text-500">
										{{ formatDate(image.createdAt) }}
									</small>
								</div>
								<div class="flex gap-1">
									<Button
										icon="pi pi-eye"
										severity="info"
										size="small"
										@click="openImageDialog(image)"
										v-tooltip.top="'Ogled'"
										class="flex-1"
									/>
									<Button
										icon="pi pi-share-alt"
										severity="success"
										size="small"
										@click="openShareDialog(image)"
										v-tooltip.top="'Deli'"
										class="flex-1"
									/>
									<Button
										icon="pi pi-pencil"
										severity="warning"
										size="small"
										@click="openEditDialog(image)"
										v-tooltip.top="'Uredi'"
										class="flex-1"
									/>
									<Button
										icon="pi pi-trash"
										severity="danger"
										size="small"
										@click="confirmDelete(image.id)"
										v-tooltip.top="'Izbriši'"
										class="flex-1"
									/>
								</div>
							</template>
						</Card>
					</div>
				</div>
			</div>

			<!-- Images Table -->
			<Panel v-else header="Upravljanje slik">
				<template #icons>
					<i class="pi pi-table"></i>
				</template>
				<DataTable
					:value="images.list"
					dataKey="id"
					stripedRows
					responsiveLayout="scroll"
					:paginator="true"
					:rows="10"
					:loading="loading"
					class="p-datatable-sm"
				>
					<template #empty>
						<div class="text-center p-6">
							<i
								class="pi pi-image text-6xl text-300 mb-3 block"
							></i>
							<p class="text-500 text-lg">Ni naloženih slik</p>
							<small class="text-400"
								>Naložite svojo prvo sliko zgoraj</small
							>
						</div>
					</template>
					<Column field="title" header="Naslov" sortable>
						<template #body="slotProps">
							<div class="flex items-center">
								<i
									class="pi pi-file-image text-primary mr-2"
								></i>
								{{ slotProps.data.title }}
							</div>
						</template>
					</Column>
					<Column field="mimeType" header="Tip" sortable>
						<template #body="slotProps">
							<Tag
								:value="slotProps.data.mimeType"
								severity="info"
							/>
						</template>
					</Column>
					<Column field="size" header="Velikost" sortable>
						<template #body="slotProps">
							<div class="flex items-center">
								<i class="pi pi-info-circle text-400 mr-1"></i>
								{{ sizeTemplate(slotProps.data) }}
							</div>
						</template>
					</Column>
					<Column field="isPublic" header="Vidnost" sortable>
						<template #body="slotProps">
							<Tag
								:value="
									slotProps.data.isPublic
										? 'Javna'
										: 'Zasebna'
								"
								:severity="
									slotProps.data.isPublic
										? 'success'
										: 'secondary'
								"
								:icon="
									slotProps.data.isPublic
										? 'pi pi-globe'
										: 'pi pi-lock'
								"
							/>
						</template>
					</Column>
					<Column field="processingStatus" header="Status" sortable>
						<template #body="slotProps">
							<Tag
								v-if="
									slotProps.data.processingStatus ===
									'pending'
								"
								value="Čaka"
								severity="info"
								icon="pi pi-clock"
							/>
							<Tag
								v-else-if="
									slotProps.data.processingStatus ===
									'processing'
								"
								value="Procesiranje"
								severity="warning"
								icon="pi pi-spin pi-spinner"
							/>
							<Tag
								v-else-if="
									slotProps.data.processingStatus === 'failed'
								"
								value="Napaka"
								severity="danger"
								icon="pi pi-exclamation-triangle"
							/>
							<Tag
								v-else-if="slotProps.data.encrypted"
								value="Zaščiteno"
								severity="success"
								icon="pi pi-shield"
							/>
							<Tag
								v-else
								value="Končano"
								severity="secondary"
								icon="pi pi-check"
							/>
						</template>
					</Column>
					<Column header="Akcije" :exportable="false">
						<template #body="slotProps">
							<div
								class="flex flex-col md:flex-row gap-2 items-stretch"
							>
								<InputText
									v-model="editTitles[slotProps.data.id]"
									placeholder="Nov naslov"
									size="small"
									class="flex-1"
								/>
								<div class="flex gap-1">
									<Button
										icon="pi pi-save"
										severity="success"
										size="small"
										@click="save(slotProps.data.id)"
										v-tooltip.top="'Shrani naslov'"
									/>
									<Button
										icon="pi pi-share-alt"
										severity="info"
										size="small"
										@click="openShareDialog(slotProps.data)"
										v-tooltip.top="'Deli sliko'"
									/>
									<Button
										icon="pi pi-trash"
										severity="danger"
										size="small"
										@click="
											confirmDelete(slotProps.data.id)
										"
										v-tooltip.top="'Izbriši sliko'"
									/>
								</div>
							</div>
						</template>
					</Column>
				</DataTable>
			</Panel>
		</div>

		<!-- Show login prompt when user is not logged in -->
		<div v-else class="flex justify-center items-center min-h-screen">
			<Card class="w-full max-w-md text-center">
				<template #title>
					<Avatar icon="pi pi-lock" size="xlarge" class="mb-3" />
					<h2 class="text-2xl font-bold text-900 m-0">
						Prijava potrebna
					</h2>
				</template>
				<template #content>
					<p class="text-600 mb-4">
						Za dostop do galerije se morate prijaviti v svoj račun.
					</p>
					<div class="flex flex-col gap-2">
						<Button
							label="Prijavi se"
							icon="pi pi-sign-in"
							@click="$router.push('/login')"
							class="w-full"
						/>
						<Button
							label="Registriraj se"
							icon="pi pi-user-plus"
							severity="secondary"
							@click="$router.push('/register')"
							class="w-full"
						/>
					</div>
				</template>
			</Card>
		</div>

		<!-- Image View Dialog -->
		<Dialog
			v-model:visible="showImageDialog"
			:style="{ width: '90vw', maxWidth: '800px' }"
			:modal="true"
			:closable="true"
			:showHeader="true"
		>
			<template #header>
				<div class="flex align-items-center gap-2">
					<i class="pi pi-image text-primary"></i>
					<span class="font-bold">{{
						selectedImage?.title || "Slika"
					}}</span>
				</div>
			</template>
			<div v-if="selectedImage" class="text-center">
				<img
					:src="getImageUrl(selectedImage.id)"
					:alt="selectedImage.title"
					class="max-w-full max-h-70vh object-contain"
					@error="onImageError"
				/>
				<div class="mt-4 text-left">
					<div class="grid">
						<div class="col-6">
							<strong>Naslov:</strong> {{ selectedImage.title }}
						</div>
						<div class="col-6">
							<strong>Tip:</strong> {{ selectedImage.mimeType }}
						</div>
						<div class="col-6">
							<strong>Velikost:</strong>
							{{ sizeTemplate(selectedImage) }}
						</div>
						<div class="col-6" v-if="selectedImage.createdAt">
							<strong>Naloženo:</strong>
							{{ formatDate(selectedImage.createdAt) }}
						</div>
					</div>
				</div>
				<!-- Action buttons in image dialog -->
				<div class="flex justify-center gap-2 mt-4">
					<Button
						label="Deli"
						icon="pi pi-share-alt"
						severity="success"
						@click="openShareDialog(selectedImage)"
					/>
					<Button
						label="Uredi"
						icon="pi pi-pencil"
						severity="warning"
						@click="openEditDialog(selectedImage)"
					/>
				</div>
			</div>
		</Dialog>

		<!-- Edit Dialog -->
		<Dialog
			v-model:visible="showEditDialog"
			:style="{ width: '400px' }"
			:modal="true"
			:closable="true"
			header="Uredi sliko"
		>
			<div v-if="editingImage" class="flex flex-col gap-3">
				<div>
					<label class="block font-bold mb-2">Naslov slike</label>
					<InputText
						v-model="editingImage.title"
						placeholder="Vnesite naslov"
						class="w-full"
					/>
				</div>
				<div>
					<label class="block font-bold mb-2">Vidnost</label>
					<div class="flex align-items-center gap-2">
						<Checkbox
							v-model="editingImage.isPublic"
							inputId="editIsPublic"
							binary
						/>
						<label for="editIsPublic" class="text-sm"
							>Objavi javno</label
						>
					</div>
					<small class="text-500">
						{{
							editingImage.isPublic
								? "Ta slika bo vidna vsem"
								: "Ta slika je privatna"
						}}
					</small>
				</div>
				<div class="flex justify-content-end gap-2">
					<Button
						label="Prekliči"
						severity="secondary"
						@click="closeEditDialog"
					/>
					<Button
						label="Shrani"
						@click="saveEdit"
						:disabled="!editingImage?.title"
					/>
				</div>
			</div>
		</Dialog>

		<!-- Share Dialog -->
		<Dialog
			v-model:visible="showShareDialog"
			:style="{ width: '500px' }"
			:modal="true"
			:closable="true"
			header="Deli sliko"
		>
			<div v-if="sharingImage" class="flex flex-col gap-4">
				<!-- Image Preview -->
				<div class="text-center">
					<img
						:key="`share-${sharingImage.id}`"
						:src="getImageUrl(sharingImage.id)"
						:alt="sharingImage.title"
						class="max-w-full max-h-20rem object-contain border-round"
						@error="onImageError"
					/>
					<h3 class="mt-2 mb-0">{{ sharingImage.title }}</h3>
				</div>

				<!-- Generated Share URL -->
				<div v-if="shareUrl">
					<label class="block font-bold mb-2"
						>Povezava za deljenje</label
					>
					<div class="flex gap-2">
						<InputText :value="shareUrl" readonly class="flex-1" />
						<Button
							icon="pi pi-copy"
							severity="secondary"
							@click="copyToClipboard"
							v-tooltip.top="'Kopiraj'"
						/>
					</div>
					<small class="text-500"
						>Delite to povezavo z osebami, ki jim želite omogočiti
						dostop do slike</small
					>
				</div>

				<!-- Action Buttons -->
				<div class="flex justify-content-end gap-2">
					<Button
						label="Zapri"
						severity="secondary"
						@click="closeShareDialog"
					/>
					<Button
						v-if="!shareUrl"
						label="Generiraj povezavo"
						icon="pi pi-link"
						@click="generateShareLink"
						:loading="generating"
					/>
					<Button
						v-else
						label="Nova povezava"
						icon="pi pi-refresh"
						@click="generateShareLink"
						:loading="generating"
					/>
				</div>
			</div>
		</Dialog>

		<ConfirmDialog />
		<Toast />
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useImages } from "../store/images";
import { useAuth } from "../store/auth";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

import Panel from "primevue/panel";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FileUpload from "primevue/fileupload";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import Tag from "primevue/tag";
import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Dialog from "primevue/dialog";
import Checkbox from "primevue/checkbox";

const images = useImages();
const auth = useAuth();
const confirm = useConfirm();
const toast = useToast();
const file = ref<File | null>(null);
const title = ref("");
const isPublic = ref(false);
const editTitles = ref<Record<string, string>>({});
const loading = ref(false);
const uploading = ref(false);
const viewMode = ref<"grid" | "table">("grid");
const selectedImage = ref<any>(null);
const showImageDialog = ref(false);
const showEditDialog = ref(false);
const editingImage = ref<any>(null);
const showShareDialog = ref(false);
const sharingImage = ref<any>(null);
const shareUrl = ref("");
const generating = ref(false);
const refreshInterval = ref<number | null>(null);

onMounted(async () => {
	// Check if user is logged in
	await auth.me();

	// Load images only if user is authenticated
	if (auth.user) {
		loadImages();
		startAutoRefresh();
	}
});

// Start auto-refresh for processing images
function startAutoRefresh() {
	// Check every 3 seconds if there are images being processed
	refreshInterval.value = setInterval(async () => {
		const processingImages = images.getProcessingImages();
		if (processingImages.length > 0) {
			await images.checkProcessingStatus();
		}
	}, 3000);
}

// Stop auto-refresh when component unmounts
function stopAutoRefresh() {
	if (refreshInterval.value) {
		clearInterval(refreshInterval.value);
		refreshInterval.value = null;
	}
}

// Stop auto-refresh when component unmounts
onUnmounted(() => {
	stopAutoRefresh();
});

// Watch for image list changes and cleanup dialogs if needed
watch(
	() => images.list,
	() => {
		// Close dialogs if the selected/editing image no longer exists
		if (
			selectedImage.value &&
			!images.list.find((img) => img.id === selectedImage.value?.id)
		) {
			showImageDialog.value = false;
			selectedImage.value = null;
		}
		if (
			editingImage.value &&
			!images.list.find((img) => img.id === editingImage.value?.id)
		) {
			showEditDialog.value = false;
			editingImage.value = null;
		}
	},
	{ deep: true }
);

async function loadImages() {
	loading.value = true;
	try {
		await images.fetchAll();
	} finally {
		loading.value = false;
	}
}

function onPick(event: any) {
	file.value = event.files[0] || null;
}

async function onUpload() {
	if (!file.value) return;
	uploading.value = true;
	try {
		await images.upload(
			file.value,
			title.value || "Brez naslova",
			isPublic.value
		);
		file.value = null;
		title.value = "";
		isPublic.value = false;
		toast.add({
			severity: "success",
			summary: "Naloženo",
			detail: "Slika je bila uspešno naložena",
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Napaka pri nalaganju slike",
			life: 3000,
		});
	} finally {
		uploading.value = false;
	}
}

async function save(id: string) {
	try {
		await images.updateTitle(id, editTitles.value[id] || "Brez naslova");
		toast.add({
			severity: "success",
			summary: "Posodobljeno",
			detail: "Naslov je bil posodobljen",
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Napaka pri posodabljanju naslova",
			life: 3000,
		});
	}
}

function confirmDelete(id: string) {
	confirm.require({
		message: "Ali ste prepričani, da želite izbrisati to sliko?",
		header: "Potrditev brisanja",
		icon: "pi pi-exclamation-triangle",
		accept: () => remove(id),
	});
}

async function remove(id: string) {
	try {
		await images.remove(id);
		toast.add({
			severity: "success",
			summary: "Izbrisano",
			detail: "Slika je bila izbrisana",
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Napaka pri brisanju slike",
			life: 3000,
		});
	}
}

function sizeTemplate(row: any) {
	const sizeInKB = (row.size / 1024).toFixed(1);
	return `${sizeInKB} KB`;
}

function getImageUrl(imageId: string) {
	if (!imageId) return "";
	return `http://localhost:5000/api/images/${imageId}`;
}

function formatDate(dateString: string) {
	if (!dateString) return "";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("sl-SI", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch (error) {
		return "";
	}
}

function openImageDialog(image: any) {
	if (!image) return;
	selectedImage.value = { ...image };
	showImageDialog.value = true;
}

function openEditDialog(image: any) {
	if (!image) return;
	editingImage.value = { ...image };
	showEditDialog.value = true;
}

function onImageError(event: any) {
	console.error("Image failed to load:", event.target.src);
	event.target.src =
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5pIHNsaWtlPC90ZXh0Pjwvc3ZnPg==";
}

async function saveEdit() {
	if (!editingImage.value) return;
	try {
		// Get the original image to compare changes
		const originalImage = images.list.find(
			(img) => img.id === editingImage.value!.id
		);
		const updates: { title?: string; isPublic?: boolean } = {};

		// Check if title changed
		if (editingImage.value.title !== originalImage?.title) {
			updates.title = editingImage.value.title;
		}

		// Check if visibility changed
		if (editingImage.value.isPublic !== originalImage?.isPublic) {
			updates.isPublic = editingImage.value.isPublic;
		}

		// Only make API calls if something changed
		if (Object.keys(updates).length > 0) {
			await images.updateImage(editingImage.value.id, updates);
		}

		closeEditDialog();
		toast.add({
			severity: "success",
			summary: "Posodobljeno",
			detail: "Slika je bila posodobljena",
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Napaka pri posodabljanju slike",
			life: 3000,
		});
	}
}

function closeEditDialog() {
	showEditDialog.value = false;
	editingImage.value = null;
}

function openShareDialog(image: any) {
	if (!image) return;
	sharingImage.value = { ...image };
	shareUrl.value = "";
	showShareDialog.value = true;
	// Automatically generate share link when dialog opens
	generateShareLink();
}

function closeShareDialog() {
	showShareDialog.value = false;
	sharingImage.value = null;
	shareUrl.value = "";
}

async function generateShareLink() {
	if (!sharingImage.value) return;

	generating.value = true;
	try {
		const response = await fetch(
			`http://localhost:5000/api/images/${sharingImage.value.id}/share`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					expirationHours: 24,
				}),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to generate share link");
		}

		const data = await response.json();
		shareUrl.value = `${window.location.origin}/shared/${data.shareToken}`;

		toast.add({
			severity: "success",
			summary: "Povezava ustvarjena",
			detail: "Povezava za deljenje je bila ustvarjena",
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Napaka pri ustvarjanju povezave za deljenje",
			life: 3000,
		});
	} finally {
		generating.value = false;
	}
}

async function copyToClipboard() {
	if (!shareUrl.value) return;

	try {
		await navigator.clipboard.writeText(shareUrl.value);
		toast.add({
			severity: "success",
			summary: "Kopirano",
			detail: "Povezava je bila kopirana v odložišče",
			life: 2000,
		});
	} catch (error) {
		// Fallback for browsers that don't support clipboard API
		const textArea = document.createElement("textarea");
		textArea.value = shareUrl.value;
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			document.execCommand("copy");
			toast.add({
				severity: "success",
				summary: "Kopirano",
				detail: "Povezava je bila kopirana v odložišče",
				life: 2000,
			});
		} catch (fallbackError) {
			toast.add({
				severity: "error",
				summary: "Napaka",
				detail: "Kopiranje ni uspešno",
				life: 3000,
			});
		}
		document.body.removeChild(textArea);
	}
}
</script>
