<template>
	<div class="shared-image-page min-h-screen surface-ground">
		<div
			class="flex flex-column align-items-center justify-content-center min-h-screen p-4"
		>
			<!-- Loading State -->
			<Card v-if="loading" class="w-full max-w-md text-center">
				<template #content>
					<div class="flex flex-column align-items-center gap-3">
						<i
							class="pi pi-spin pi-spinner text-4xl text-primary"
						></i>
						<p class="text-600">Nalagam sliko...</p>
					</div>
				</template>
			</Card>

			<!-- Error State -->
			<Card v-else-if="error" class="w-full max-w-md text-center">
				<template #content>
					<div class="flex flex-column align-items-center gap-3">
						<i
							class="pi pi-exclamation-triangle text-4xl text-orange-500"
						></i>
						<h3 class="text-900 m-0">{{ error }}</h3>
						<p class="text-600">
							Povezava morda ni več veljavna ali pa slika ne
							obstaja.
						</p>
						<Button
							label="Nazaj na domačo stran"
							icon="pi pi-home"
							@click="$router.push('/')"
						/>
					</div>
				</template>
			</Card>

			<!-- Image Display -->
			<Card v-else-if="imageData" class="w-full" style="max-width: 90vw">
				<template #header>
					<div class="text-center p-4">
						<h1 class="text-3xl font-bold text-900 mb-2">
							{{ imageData.title }}
						</h1>
						<div class="flex justify-content-center gap-4 text-600">
							<span>
								<i class="pi pi-file mr-1"></i>
								{{ imageData.mimeType }}
							</span>
							<span>
								<i class="pi pi-info-circle mr-1"></i>
								{{ sizeTemplate(imageData) }}
							</span>
							<span v-if="imageData.createdAt">
								<i class="pi pi-calendar mr-1"></i>
								{{ formatDate(imageData.createdAt) }}
							</span>
						</div>
					</div>
				</template>
				<template #content>
					<div class="text-center">
						<img
							:src="imageUrl"
							:alt="imageData.title"
							class="max-w-full max-h-80vh object-contain border-round shadow-3"
							@error="onImageError"
						/>
					</div>
				</template>
				<template #footer>
					<div class="flex justify-content-center gap-2">
						<Button
							label="Prenesi"
							icon="pi pi-download"
							@click="downloadImage"
						/>
						<Button
							label="Domov"
							icon="pi pi-home"
							severity="secondary"
							@click="$router.push('/')"
						/>
					</div>
				</template>
			</Card>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import Button from "primevue/button";

const route = useRoute();
const toast = useToast();

const loading = ref(true);
const error = ref("");
const imageData = ref<any>(null);
const imageUrl = ref("");

onMounted(async () => {
	const shareToken = route.params.token as string;
	if (!shareToken) {
		error.value = "Neveljavna povezava";
		loading.value = false;
		return;
	}

	try {
		const response = await fetch(
			`http://localhost:5000/api/shared/${shareToken}`,
			{
				credentials: "include",
			}
		);

		if (!response.ok) {
			if (response.status === 404) {
				error.value = "Slika ni najdena";
			} else if (response.status === 410) {
				error.value = "Povezava je potekla";
			} else {
				error.value = "Napaka pri nalaganju slike";
			}
			return;
		}

		const data = await response.json();
		imageData.value = data.image;
		imageUrl.value = `http://localhost:5000/api/shared/${shareToken}/file`;
	} catch (err) {
		error.value = "Napaka pri nalaganju slike";
		console.error("Error loading shared image:", err);
	} finally {
		loading.value = false;
	}
});

function sizeTemplate(image: any) {
	if (!image.size) return "";
	const sizeInKB = (image.size / 1024).toFixed(1);
	return `${sizeInKB} KB`;
}

function formatDate(dateString: string) {
	if (!dateString) return "";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("sl-SI", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch (error) {
		return "";
	}
}

function onImageError(event: any) {
	event.target.src =
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5hcGFrYSBwcmkgbmFsYWdhbmp1PC90ZXh0Pjwvc3ZnPg==";
}

async function downloadImage() {
	if (!imageData.value || !imageUrl.value) return;

	try {
		const response = await fetch(imageUrl.value);
		const blob = await response.blob();

		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = imageData.value.title || "slika";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);

		toast.add({
			severity: "success",
			summary: "Preneseno",
			detail: "Slika je bila prenesena",
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Napaka pri prenosu slike",
			life: 3000,
		});
	}
}
</script>
