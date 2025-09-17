<template>
	<div class="flex justify-center items-center min-h-screen p-4">
		<Card class="w-full max-w-md">
			<template #title>
				<div class="text-center">
					<Avatar icon="pi pi-sign-in" size="xlarge" class="mb-3" />
					<h2 class="text-2xl font-bold text-900 m-0">
						Dobrodošli nazaj
					</h2>
				</div>
			</template>
			<template #subtitle>
				<p class="text-center text-600 mt-2">
					Prijavite se v svoj račun
				</p>
			</template>
			<template #content>
				<form
					@submit.prevent="onLogin"
					class="p-fluid gap-4 flex flex-col w-full"
				>
					<div class="w-full">
						<FloatLabel>
							<InputText
								id="email"
								v-model="email"
								type="email"
								required
								class="w-full"
							/>
							<label for="email">Email naslov</label>
						</FloatLabel>
					</div>
					<div class="w-full">
						<FloatLabel>
							<Password
								id="password"
								v-model="password"
								toggleMask
								:feedback="false"
								required
								class="w-full"
								inputClass="w-full"
							/>
							<label for="password">Geslo</label>
						</FloatLabel>
					</div>
					<Button
						type="submit"
						label="Prijavi se"
						icon="pi pi-sign-in"
						class="w-full"
						:loading="loading"
					/>
				</form>
			</template>
			<template #footer>
				<div class="text-center">
					<p class="text-600">
						Nimate računa?
						<router-link
							to="/register"
							class="text-primary no-underline hover:underline"
						>
							Registrirajte se
						</router-link>
					</p>
				</div>
			</template>
		</Card>
		<Toast />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../store/auth";

import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Toast from "primevue/toast";
import Avatar from "primevue/avatar";
import FloatLabel from "primevue/floatlabel";
import { useToast } from "primevue/usetoast";

const email = ref("");
const password = ref("");
const loading = ref(false);
const auth = useAuth();
const router = useRouter();
const toast = useToast();

async function onLogin() {
	if (!email.value || !password.value) {
		toast.add({
			severity: "warn",
			summary: "Opozorilo",
			detail: "Izpolnite vsa polja",
			life: 3000,
		});
		return;
	}

	loading.value = true;
	try {
		const ok = await auth.login(email.value, password.value);
		if (ok) {
			toast.add({
				severity: "success",
				summary: "Prijava uspešna",
				detail: "Vaša prijava je bila uspešna!",
				life: 2000,
			});
			setTimeout(() => router.push("/"), 1000);
		} else if (auth.error) {
			toast.add({
				severity: "error",
				summary: "Napaka",
				detail: auth.error,
				life: 3000,
			});
		}
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Prišlo je do napake pri prijavi",
			life: 3000,
		});
	} finally {
		loading.value = false;
	}
}
</script>
