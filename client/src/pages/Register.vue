<template>
	<div class="flex justify-center items-center min-h-screen p-4">
		<Card class="w-full max-w-md">
			<template #title>
				<div class="text-center">
					<Avatar icon="pi pi-user-plus" size="xlarge" class="mb-3" />
					<h2 class="text-2xl font-bold text-900 m-0">
						Ustvarite račun
					</h2>
				</div>
			</template>
			<template #subtitle>
				<p class="text-center text-600 mt-2">
					Pridružite se naši skupnosti
				</p>
			</template>
			<template #content>
				<form
					@submit.prevent="onRegister"
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
								:feedback="true"
								required
								class="w-full"
								inputClass="w-full"
							/>
							<label for="password">Geslo</label>
						</FloatLabel>
					</div>
					<div class="w-full">
						<FloatLabel>
							<Password
								id="confirm"
								v-model="confirm"
								toggleMask
								:feedback="false"
								required
								class="w-full"
								inputClass="w-full"
							/>
							<label for="confirm">Potrdite geslo</label>
						</FloatLabel>
					</div>
					<Button
						type="submit"
						label="Registriraj se"
						icon="pi pi-user-plus"
						class="w-full"
						:loading="loading"
					/>
				</form>
			</template>
			<template #footer>
				<div class="text-center">
					<p class="text-600">
						Že imate račun?
						<router-link
							to="/login"
							class="text-primary no-underline hover:underline"
						>
							Prijavite se
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
const confirm = ref("");
const loading = ref(false);
const auth = useAuth();
const router = useRouter();
const toast = useToast();

async function onRegister() {
	if (!email.value || !password.value || !confirm.value) {
		toast.add({
			severity: "warn",
			summary: "Opozorilo",
			detail: "Prosimo, izpolnite vsa polja",
			life: 3000,
		});
		return;
	}

	if (password.value !== confirm.value) {
		toast.add({
			severity: "error",
			summary: "Napaka",
			detail: "Gesli se ne ujemata",
			life: 3000,
		});
		return;
	}

	if (password.value.length < 6) {
		toast.add({
			severity: "warn",
			summary: "Opozorilo",
			detail: "Geslo mora biti dolgo vsaj 6 znakov",
			life: 3000,
		});
		return;
	}

	loading.value = true;
	try {
		const ok = await auth.register(email.value, password.value);
		if (ok) {
			toast.add({
				severity: "success",
				summary: "Registracija uspešna",
				detail: "Registracija uspešna! Preusmerjamo vas na prijavo...",
				life: 3000,
			});
			setTimeout(() => router.push("/login"), 2000);
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
			detail: "Prišlo je do napake pri registraciji",
			life: 3000,
		});
	} finally {
		loading.value = false;
	}
}
</script>
