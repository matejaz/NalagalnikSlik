<template>
	<div class="groups-page min-h-screen surface-ground">
		<div class="flex flex-col items-center py-5 px-3">
			<div
				class="surface-card shadow-2 border-round p-4 w-full max-w-6xl"
			>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-2xl font-semibold m-0">Moje skupine</h2>
					<Button
						label="Ustvari skupino"
						icon="pi pi-plus"
						@click="showCreateDialog = true"
					/>
				</div>

				<!-- Groups List -->
				<div
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
				>
					<div v-for="group in groups" :key="group.id" class="w-full">
						<div
							class="surface-card shadow-1 border-round p-3 h-full"
						>
							<div
								class="flex justify-content-between align-items-start mb-3"
							>
								<h3 class="text-lg font-medium m-0">
									{{ group.name }}
								</h3>
								<Badge
									:value="group._count.members"
									severity="info"
									v-tooltip="'Members'"
								/>
							</div>
							<p class="text-600 text-sm mb-3 line-height-3">
								{{ group.description || "No description" }}
							</p>
							<div
								class="flex justify-content-between align-items-center"
							>
								<small class="text-500">
									Owner: {{ group.owner.email }}
								</small>
								<div class="flex gap-2">
									<Button
										icon="pi pi-eye"
										size="small"
										severity="secondary"
										@click="viewGroup(group)"
										v-tooltip="'View'"
									/>
									<Button
										v-if="group.ownerId === auth.user?.id"
										icon="pi pi-pencil"
										size="small"
										@click="editGroup(group)"
										v-tooltip="'Edit'"
									/>
									<Button
										v-if="group.ownerId === auth.user?.id"
										icon="pi pi-trash"
										size="small"
										severity="danger"
										@click="deleteGroup(group)"
										v-tooltip="'Delete'"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div v-if="groups.length === 0" class="text-center py-8">
					<i class="pi pi-users text-6xl text-400 mb-3"></i>
					<h3 class="text-lg text-600 mb-2">
						Ni še ustvarjenih skupin
					</h3>
					<p class="text-500 mb-4">
						Ustvarite svojo prvo skupino in začnite sodelovati
					</p>
					<Button
						label="Ustvari skupino"
						icon="pi pi-plus"
						@click="showCreateDialog = true"
					/>
				</div>
			</div>
		</div>

		<Dialog
			v-model:visible="showCreateDialog"
			:style="{ width: '500px' }"
			:modal="true"
			:closable="true"
			:header="editingGroup ? 'Uredi skupino' : 'Ustvari skupino'"
		>
			<div class="flex flex-column gap-3">
				<div>
					<label class="block font-bold mb-2">Ime skupine</label>
					<InputText
						v-model="groupForm.name"
						placeholder="Vnesite ime skupine"
						class="w-full"
					/>
				</div>
				<div>
					<label class="block font-bold mb-2">Opis</label>
					<Textarea
						v-model="groupForm.description"
						placeholder="Vnesite opis skupine"
						rows="3"
						class="w-full"
					/>
				</div>
			</div>

			<div class="flex justify-content-end gap-2 mt-4">
				<Button
					label="Cancel"
					severity="secondary"
					@click="closeCreateDialog"
				/>
				<Button
					:label="editingGroup ? 'Posodobi' : 'Ustvari'"
					@click="saveGroup"
					:loading="saving"
				/>
			</div>
		</Dialog>

		<Dialog
			v-model:visible="showDetailsDialog"
			:style="{ width: '600px' }"
			:modal="true"
			:closable="true"
			header="Group Details"
		>
			<div v-if="selectedGroup" class="flex flex-column gap-4">
				<div>
					<h3 class="text-xl font-semibold mb-2">
						{{ selectedGroup.name }}
					</h3>
					<p class="text-600 mb-3">
						{{ selectedGroup.description || "No description" }}
					</p>
					<small class="text-500"
						>Created by {{ selectedGroup.owner.email }}</small
					>
				</div>

				<div>
					<div
						class="flex justify-content-between align-items-center mb-3"
					>
						<h4 class="text-lg font-medium m-0">Members</h4>
						<Button
							v-if="canManageMembers"
							label="Add Member"
							icon="pi pi-user-plus"
							size="small"
							@click="showAddMemberDialog = true"
						/>
					</div>
					<div class="flex flex-column gap-2">
						<div
							v-for="member in selectedGroup.members"
							:key="member.id"
							class="flex justify-content-between align-items-center p-2 border-round surface-100"
						>
							<div class="flex align-items-center gap-2">
								<i class="pi pi-user"></i>
								<span>{{ member.user.email }}</span>
								<Badge
									v-if="member.role === 'admin'"
									value="Admin"
									severity="info"
									size="small"
								/>
								<Badge
									v-if="
										member.userId === selectedGroup.ownerId
									"
									value="Owner"
									severity="success"
									size="small"
								/>
							</div>
							<Button
								v-if="
									canManageMembers &&
									member.userId !== selectedGroup.ownerId
								"
								icon="pi pi-times"
								size="small"
								severity="danger"
								@click="removeMember(member.userId)"
								v-tooltip="'Remove'"
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="flex justify-content-end gap-2 mt-4">
				<Button
					label="Close"
					severity="secondary"
					@click="showDetailsDialog = false"
				/>
			</div>
		</Dialog>

		<!-- Add Member Dialog -->
		<Dialog
			v-model:visible="showAddMemberDialog"
			:style="{ width: '400px' }"
			:modal="true"
			:closable="true"
			header="Add Member"
		>
			<div class="flex flex-column gap-3">
				<div>
					<label class="block font-bold mb-2">User Email</label>
					<InputText
						v-model="newMemberEmail"
						placeholder="Enter user email"
						class="w-full"
					/>
				</div>
			</div>

			<div class="flex justify-content-end gap-2 mt-4">
				<Button
					label="Cancel"
					severity="secondary"
					@click="showAddMemberDialog = false"
				/>
				<Button
					label="Add"
					@click="addMember"
					:loading="addingMember"
				/>
			</div>
		</Dialog>

		<ConfirmDialog />
		<Toast />
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useAuth } from "../store/auth";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuth();
const toast = useToast();
const confirm = useConfirm();

const groups = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const addingMember = ref(false);

const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const showAddMemberDialog = ref(false);
const editingGroup = ref<any>(null);
const selectedGroup = ref<any>(null);
const newMemberEmail = ref("");

const groupForm = ref({
	name: "",
	description: "",
});

const canManageMembers = computed(() => {
	if (!selectedGroup.value || !auth.user) return false;
	return (
		selectedGroup.value.ownerId === auth.user.id ||
		selectedGroup.value.members.some(
			(m: any) => m.userId === auth.user?.id && m.role === "admin"
		)
	);
});

onMounted(async () => {
	await loadGroups();
});

async function loadGroups() {
	try {
		loading.value = true;
		const response = await fetch("http://localhost:5000/api/groups", {
			credentials: "include",
		});
		if (response.ok) {
			groups.value = await response.json();
		}
	} catch (error) {
		console.error("Error loading groups:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to load groups",
		});
	} finally {
		loading.value = false;
	}
}

async function saveGroup() {
	if (!groupForm.value.name.trim()) {
		toast.add({
			severity: "warn",
			summary: "Warning",
			detail: "Group name is required",
		});
		return;
	}

	try {
		saving.value = true;
		const url = editingGroup.value
			? `http://localhost:5000/api/groups/${editingGroup.value.id}`
			: "http://localhost:5000/api/groups";

		const method = editingGroup.value ? "PATCH" : "POST";

		const response = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(groupForm.value),
		});

		if (response.ok) {
			toast.add({
				severity: "success",
				summary: "Success",
				detail: editingGroup.value ? "Group updated" : "Group created",
			});
			closeCreateDialog();
			await loadGroups();
		} else {
			throw new Error("Failed to save group");
		}
	} catch (error) {
		console.error("Error saving group:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail: "Failed to save group",
		});
	} finally {
		saving.value = false;
	}
}

function viewGroup(group: any) {
	selectedGroup.value = group;
	showDetailsDialog.value = true;
}

function editGroup(group: any) {
	editingGroup.value = group;
	groupForm.value = {
		name: group.name,
		description: group.description || "",
	};
	showCreateDialog.value = true;
}

function deleteGroup(group: any) {
	confirm.require({
		message: `Are you sure you want to delete "${group.name}"?`,
		header: "Confirm Delete",
		icon: "pi pi-exclamation-triangle",
		rejectClass: "p-button-secondary p-button-outlined",
		rejectLabel: "Cancel",
		acceptLabel: "Delete",
		accept: async () => {
			try {
				const response = await fetch(
					`http://localhost:5000/api/groups/${group.id}`,
					{
						method: "DELETE",
						credentials: "include",
					}
				);

				if (response.ok) {
					toast.add({
						severity: "success",
						summary: "Success",
						detail: "Group deleted",
					});
					await loadGroups();
				} else {
					throw new Error("Failed to delete group");
				}
			} catch (error) {
				console.error("Error deleting group:", error);
				toast.add({
					severity: "error",
					summary: "Error",
					detail: "Failed to delete group",
				});
			}
		},
	});
}

async function addMember() {
	if (!newMemberEmail.value.trim()) {
		toast.add({
			severity: "warn",
			summary: "Warning",
			detail: "Email is required",
		});
		return;
	}

	try {
		addingMember.value = true;
		const response = await fetch(
			"http://localhost:5000/api/groups/members",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					groupId: selectedGroup.value.id,
					userEmail: newMemberEmail.value,
				}),
			}
		);

		if (response.ok) {
			toast.add({
				severity: "success",
				summary: "Success",
				detail: "Member added",
			});
			newMemberEmail.value = "";
			showAddMemberDialog.value = false;
			await loadGroups();
			// Refresh the selected group details
			const updatedGroup = groups.value.find(
				(g) => g.id === selectedGroup.value.id
			);
			if (updatedGroup) {
				selectedGroup.value = updatedGroup;
			}
		} else {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to add member");
		}
	} catch (error) {
		console.error("Error adding member:", error);
		toast.add({
			severity: "error",
			summary: "Error",
			detail:
				error instanceof Error ? error.message : "Failed to add member",
		});
	} finally {
		addingMember.value = false;
	}
}

async function removeMember(memberId: string) {
	confirm.require({
		message: "Are you sure you want to remove this member?",
		header: "Confirm Remove",
		icon: "pi pi-exclamation-triangle",
		rejectClass: "p-button-secondary p-button-outlined",
		rejectLabel: "Cancel",
		acceptLabel: "Remove",
		accept: async () => {
			try {
				const response = await fetch(
					`http://localhost:5000/api/groups/${selectedGroup.value.id}/members/${memberId}`,
					{
						method: "DELETE",
						credentials: "include",
					}
				);

				if (response.ok) {
					toast.add({
						severity: "success",
						summary: "Success",
						detail: "Member removed",
					});
					await loadGroups();
					// Refresh the selected group details
					const updatedGroup = groups.value.find(
						(g) => g.id === selectedGroup.value.id
					);
					if (updatedGroup) {
						selectedGroup.value = updatedGroup;
					}
				} else {
					throw new Error("Failed to remove member");
				}
			} catch (error) {
				console.error("Error removing member:", error);
				toast.add({
					severity: "error",
					summary: "Error",
					detail: "Failed to remove member",
				});
			}
		},
	});
}

function closeCreateDialog() {
	showCreateDialog.value = false;
	editingGroup.value = null;
	groupForm.value = { name: "", description: "" };
}
</script>
