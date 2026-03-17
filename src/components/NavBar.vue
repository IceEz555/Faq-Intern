<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/home" class="brand-title">ETDA  FAQ Service</router-link>
      <p class="brand-subtitle">Electronic Transactions Development Agency</p>
    </div>
    <div class="navbar-nav">
      <router-link to="/home" class="nav-link">Home</router-link>
      <router-link to="/text-faq" class="nav-link">Text FAQ</router-link>
      <router-link to="/voice-faq" class="nav-link">Voice FAQ</router-link>
      
      <div v-if="isLoggedIn" class="auth-menu">
        <router-link to="/admin" class="nav-link">🛠️ Admin</router-link>
        <span class="username">Hi, {{ username }}</span>
        <button @click="logout" class="nav-link logout-btn">Logout</button>
      </div>
      <div v-else class="auth-menu">
        <router-link to="/" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link">Register</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const isLoggedIn = ref(false);
const username = ref('');
const router = useRouter();

const checkAuth = () => {
  const token = localStorage.getItem('token');
  isLoggedIn.value = !!token;
  if (isLoggedIn.value) {
    username.value = localStorage.getItem('username') || 'User';
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  checkAuth();
  router.push('/');
};

onMounted(() => {
  checkAuth();
  window.addEventListener('storage', checkAuth);
});

onUnmounted(() => {
  window.removeEventListener('storage', checkAuth);
});
</script>

<style scoped>
@import '../assets/css/NavBar.css';
</style>
