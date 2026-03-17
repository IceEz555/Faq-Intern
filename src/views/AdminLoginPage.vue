<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="admin-login-header">
        <span class="admin-lock-icon">🔐</span>
        <h2>Admin Login</h2>
        <p>เข้าสู่ระบบสำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="admin-username">Username</label>
          <input type="text" id="admin-username" v-model="username" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="admin-password">Password</label>
          <input type="password" id="admin-password" v-model="password" required autocomplete="current-password" />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="auth-btn" :disabled="loading">
          <span v-if="loading">⏳ กำลังเข้าสู่ระบบ...</span>
          <span v-else>🛠️ เข้าสู่ระบบ Admin</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/utils/api.js';

const username = ref('');
const password = ref('');
const error    = ref('');
const loading  = ref(false);
const router   = useRouter();

const handleLogin = async () => {
  error.value   = '';
  loading.value = true;
  try {
    const response = await apiFetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token',    data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('isAdmin',  'true');
      router.push('/admin');
    } else {
      error.value = data.error || 'Login failed';
    }
  } catch (err) {
    error.value = 'Network error. Is the API server running?';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@import '../assets/css/Auth.css';

.admin-login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.admin-lock-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.admin-login-header h2 {
  color: #003366;
  margin-bottom: 0.25rem;
}

.admin-login-header p {
  font-size: 0.82rem;
  color: #888;
  margin: 0;
}
</style>
