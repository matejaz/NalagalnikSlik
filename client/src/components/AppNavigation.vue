<template>
	<div class="flex flex-wrap justify-center gap-2 mb-4">
		<div class="flex gap-2 mb-2">
			<Button
				label="Moj album"
				icon="pi pi-images"
				:severity="currentPath === '/' ? 'primary' : 'secondary'"
				@click="navigateTo('/')"
				class="text-sm"
			/>
			<Button
				label="Javna galerija"
				icon="pi pi-globe"
				:severity="currentPath === '/public' ? 'primary' : 'secondary'"
				@click="navigateTo('/public')"
				class="text-sm"
			/>
			<Button
				label="Skupine"
				icon="pi pi-users"
				:severity="currentPath === '/groups' ? 'primary' : 'secondary'"
				@click="navigateTo('/groups')"
				class="text-sm"
			/>
		</div>

		<!-- Additional Options -->
		<div class="flex gap-2" v-if="showExtended">
			<Button
				label="Priljubljene"
				icon="pi pi-heart"
				severity="secondary"
				@click="$emit('showFavorites')"
				class="text-sm"
				v-tooltip="'Prikaži slike, ki ste jih označili z všeč'"
			/>
			<Button
				label="Moje deljene"
				icon="pi pi-share-alt"
				severity="secondary"
				@click="$emit('showMyShared')"
				class="text-sm"
				v-tooltip="'Prikaži slike, ki ste jih delili z drugimi'"
			/>
			<Button
				label="Nastavitve"
				icon="pi pi-cog"
				severity="secondary"
				@click="$emit('showSettings')"
				class="text-sm"
				v-tooltip="'Nastavitve računa in zasebnosti'"
			/>
			<Button
				label="Odjava"
				icon="pi pi-sign-out"
				severity="danger"
				@click="$emit('handleLogout')"
				class="text-sm"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";

interface Props {
	showExtended?: boolean;
}

withDefaults(defineProps<Props>(), {
	showExtended: false,
});

defineEmits<{
	showFavorites: [];
	showMyShared: [];
	showSettings: [];
	handleLogout: [];
}>();

const route = useRoute();
const router = useRouter();

const currentPath = computed(() => route.path);

function navigateTo(path: string) {
	router.push(path);
}
</script>
