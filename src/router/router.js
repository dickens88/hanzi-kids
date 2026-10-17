import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotebookView from '../views/NotebookView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/notebook', name: 'notebook', component: NotebookView },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
