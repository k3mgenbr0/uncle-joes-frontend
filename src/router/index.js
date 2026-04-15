import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import MenuView from '../views/MenuView.vue'
import MenuItemDetailView from '../views/MenuItemDetailView.vue'
import LocationsView from '../views/LocationsView.vue'
import LocationDetailView from '../views/LocationDetailView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import OrderDetailView from '../views/OrderDetailView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Uncle Joe\'s Coffee Company' },
    },
    {
      path: '/menu',
      name: 'menu',
      component: MenuView,
      meta: { title: 'Menu | Uncle Joe\'s Coffee Company' },
    },
    {
      path: '/menu/:itemId',
      name: 'menu-item-detail',
      component: MenuItemDetailView,
      meta: { title: 'Menu Item | Uncle Joe\'s Coffee Company' },
    },
    {
      path: '/locations',
      name: 'locations',
      component: LocationsView,
      meta: { title: 'Locations | Uncle Joe\'s Coffee Company' },
    },
    {
      path: '/locations/:locationId',
      name: 'location-detail',
      component: LocationDetailView,
      meta: { title: 'Location Details | Uncle Joe\'s Coffee Company' },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Coffee Club Login | Uncle Joe\'s Coffee Company', guestOnly: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard | Uncle Joe\'s Coffee Company', requiresAuth: true },
    },
    {
      path: '/dashboard/orders/:orderId',
      name: 'order-detail',
      component: OrderDetailView,
      meta: { title: 'Order Details | Uncle Joe\'s Coffee Company', requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: 'Page Not Found | Uncle Joe\'s Coffee Company' },
    },
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.hasRestoredSession) {
    await authStore.restoreSession()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ?? 'Uncle Joe\'s Coffee Company'
})

export default router
