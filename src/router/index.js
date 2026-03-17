import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import TextFAQ from '../views/TextFAQ.vue'
import VoiceFAQ from '../views/VoiceFAQ.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import AdminLoginPage from '../views/AdminLoginPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomePage
    },
    {
      path: '/',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage
    },
    {
      path: '/text-faq',
      name: 'text-faq',
      component: TextFAQ,
      meta: { requiresAuth: true }
    },
    {
      path: '/voice-faq',
      name: 'voice-faq',
      component: VoiceFAQ
    },
    {
      path: '/admin-login',
      name: 'admin-login',
      component: AdminLoginPage
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAdmin: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token   = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (to.meta.requiresAdmin) {
    if (!token || !isAdmin) return next('/admin-login');
  } else if (to.meta.requiresAuth && !token) {
    return next('/');
  }
  next();
});

export default router
