import { createRouter, createWebHistory } from "vue-router";
import Gallery from "../pages/Gallery.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import SharedImage from "../pages/SharedImage.vue";
import Groups from "../pages/Groups.vue";
import PublicGallery from "../pages/PublicGallery.vue";

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: "/", component: Gallery },
		{ path: "/public", component: PublicGallery },
		{ path: "/groups", component: Groups },
		{ path: "/login", component: Login },
		{ path: "/register", component: Register },
		{ path: "/shared/:token", component: SharedImage, props: true },
	],
});
