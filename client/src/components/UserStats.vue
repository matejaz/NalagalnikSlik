<template>
	<div class="flex flex-wrap justify-center gap-4 mt-4">
		<Tag
			:value="`Prijavljeni kot: ${userEmail}`"
			severity="success"
			icon="pi pi-user"
		/>
		<Tag
			:value="`Skupaj slik: ${totalImages}`"
			severity="info"
			icon="pi pi-images"
		/>
		<Tag
			:value="`Javnih: ${publicImages}`"
			severity="warning"
			icon="pi pi-globe"
		/>
		<Tag
			:value="`Zasebnih: ${privateImages}`"
			severity="secondary"
			icon="pi pi-lock"
		/>
	</div>
</template>

<script setup lang="ts">
import Tag from "primevue/tag";

interface Props {
	userEmail: string;
	totalImages: number;
	publicImages: number;
	privateImages: number;
}

defineProps<Props>();
</script>
