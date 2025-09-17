<template>
	<div class="min-h-screen surface-ground">
		<Toolbar class="border-none shadow-2">
			<template #start>
				<div class="flex align-items-center">
					<i class="pi pi-images text-primary text-xl mr-2"></i>
					<span class="text-900 font-bold text-xl"
						>Nalagalnik Slik</span
					>
				</div>
			</template>
			<template #end>
				<!-- Desktop Navigation -->
				<div class="hidden md:flex gap-2 align-items-center">
					<template v-if="auth.user">
						<!-- Main Navigation -->
						<Button
							label="Moj album"
							icon="pi pi-images"
							text
							@click="$router.push('/')"
							:severity="
								$route.path === '/' ? 'primary' : 'secondary'
							"
						/>
						<Button
							label="Javna galerija"
							icon="pi pi-globe"
							text
							@click="$router.push('/public')"
							:severity="
								$route.path === '/public'
									? 'primary'
									: 'secondary'
							"
						/>
						<Button
							label="Skupine"
							icon="pi pi-users"
							text
							@click="$router.push('/groups')"
							:severity="
								$route.path === '/groups'
									? 'primary'
									: 'secondary'
							"
						/>

						<!-- User Info and Logout -->
						<Tag
							:value="auth.user.email"
							icon="pi pi-user"
							severity="success"
						/>
						<Button
							label="Odjavi se"
							icon="pi pi-sign-out"
							severity="secondary"
							@click="logout"
						/>
					</template>
					<template v-else>
						<Button
							v-for="item in guestMenuItems"
							:key="item.to"
							:label="item.label"
							:icon="item.icon"
							text
							@click="$router.push(item.to)"
							:severity="
								$route.path === item.to
									? 'primary'
									: 'secondary'
							"
						/>
					</template>
				</div>

				<!-- Mobile Navigation -->
				<div class="md:hidden flex align-items-center gap-2">
					<template v-if="auth.user">
						<Button
							icon="pi pi-bars"
							text
							@click="showMobileMenu = !showMobileMenu"
						/>
						<Button
							icon="pi pi-sign-out"
							severity="secondary"
							@click="logout"
							v-tooltip="'Odjavi se'"
						/>
					</template>
					<template v-else>
						<Button
							icon="pi pi-sign-in"
							text
							@click="$router.push('/login')"
						/>
					</template>
				</div>
			</template>
		</Toolbar>

		<!-- Mobile Menu Overlay -->
		<div
			v-if="showMobileMenu && auth.user"
			class="md:hidden fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-1000"
			@click="showMobileMenu = false"
		>
			<div class="surface-card shadow-2 border-round p-4 m-4 mt-20">
				<div class="flex flex-column gap-2">
					<Button
						label="Moj album"
						icon="pi pi-images"
						:severity="
							$route.path === '/' ? 'primary' : 'secondary'
						"
						@click="navigateAndClose('/')"
						class="w-full justify-content-start"
					/>
					<Button
						label="Javna galerija"
						icon="pi pi-globe"
						:severity="
							$route.path === '/public' ? 'primary' : 'secondary'
						"
						@click="navigateAndClose('/public')"
						class="w-full justify-content-start"
					/>
					<Button
						label="Skupine"
						icon="pi pi-users"
						:severity="
							$route.path === '/groups' ? 'primary' : 'secondary'
						"
						@click="navigateAndClose('/groups')"
						class="w-full justify-content-start"
					/>
				</div>
			</div>
		</div>

		<div class="p-4">
			<div class="max-w-6xl mx-auto">
				<RouterView />
			</div>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "./store/auth";
import Toolbar from "primevue/toolbar";
import Button from "primevue/button";
import Tag from "primevue/tag";

const auth = useAuth();
const router = useRouter();
const showMobileMenu = ref(false);

const guestMenuItems = [
	{ label: "Galerija", to: "/", icon: "pi pi-images" },
	{ label: "Prijava", to: "/login", icon: "pi pi-sign-in" },
	{ label: "Registracija", to: "/register", icon: "pi pi-user-plus" },
];

onMounted(async () => {
	// Check authentication status on app load
	await auth.me();
});

async function logout() {
	await auth.logout();
	showMobileMenu.value = false;
	router.push("/login");
}

function navigateAndClose(path) {
	router.push(path);
	showMobileMenu.value = false;
}
</script>
