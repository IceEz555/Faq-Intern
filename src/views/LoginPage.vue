<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        
        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="auth-btn">Login</button>
      </form>
      
      <p class="auth-link">
        Don't have an account? <router-link to="/register">Register here</router-link>
      </p>
      <p class="auth-link admin-link">
        <router-link to="/admin-login">🛠️ Admin Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/utils/api.js';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const response = await apiFetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      window.dispatchEvent(new Event('storage'));
      router.push('/home');
    } else {
      error.value = data.error || 'Login failed';
    }
  } catch (err) {
    error.value = 'Network error. Is API Server running?';
    console.error(err);
  }
};
</script>

<style scoped>
@import '../assets/css/Auth.css';
</style>
