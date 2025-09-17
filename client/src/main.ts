import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { router } from "./router";

import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";

// Import all required components
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import Toast from "primevue/toast";
import Tooltip from "primevue/tooltip";
import Toolbar from "primevue/toolbar";
import Panel from "primevue/panel";
import Card from "primevue/card";
import Avatar from "primevue/avatar";
import FloatLabel from "primevue/floatlabel";
import Password from "primevue/password";
import Tag from "primevue/tag";
import { Form } from "@primevue/forms";
// Import styles in correct order
import "primeicons/primeicons.css";
import "./style.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
	theme: {
		preset: Aura,
		options: {
			prefix: "p",
			darkModeSelector: false, // Disable dark mode selector for consistent styling
			cssLayer: false,
		},
	},
});
app.use(ConfirmationService);
app.use(ToastService);

// Register global components
app.component("Button", Button);
app.component("FileUpload", FileUpload);
app.component("InputText", InputText);
app.component("DataTable", DataTable);
app.component("Column", Column);
app.component("Dialog", Dialog);
app.component("ConfirmDialog", ConfirmDialog);
app.component("Toast", Toast);
app.component("Toolbar", Toolbar);
app.component("Panel", Panel);
app.component("Card", Card);
app.component("Avatar", Avatar);
app.component("FloatLabel", FloatLabel);
app.component("Password", Password);
app.component("Tag", Tag);
app.component("Form", Form);

// Register directives
app.directive("tooltip", Tooltip);

app.mount("#app");
