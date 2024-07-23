import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from '@/App.vue'
import HomeView from '@/views/HomeView.vue'
import DeskView from '@/views/DeskView.vue'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/main.css'
import Keycloak, { type KeycloakConfig } from 'keycloak-js'
import { keycloakKey } from '@/provide-keys'

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_AUTHORIZATION_ENDPOINT,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
} as KeycloakConfig

const keycloak = new Keycloak(keycloakConfig)

axios.defaults.baseURL = ""

axios.interceptors.request.use(async config => {
  await keycloak.updateToken(5)
  config.headers.Authorization = `Bearer ${keycloak.token}`
  return config
})

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "Home", component: HomeView },
    { path: "/desks", name: "Desk", component: DeskView }
  ]
})

router.beforeEach((to, _, next) => {
  document.title = `${to.name?.toString()} - Dorikell` 
  next()
})

const app = createApp(App)

keycloak.init({
  onLoad: "login-required",
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  checkLoginIframe: false,
  responseMode: "query"
}).then(async () => {
  app
    .provide(keycloakKey, keycloak)
    .use(router)
    .mount('#app')
})
