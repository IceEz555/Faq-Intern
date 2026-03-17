<template>
  <div class="home-container">
    <main class="main-content">
      <div class="card-container">
        <router-link to="/text-faq" class="card">
          <div class="icon">📄</div>
          <h2>Text FAQ</h2>
          <p>Browse common questions and answers.</p>
        </router-link>

        <router-link to="/voice-faq" class="card">
          <div class="icon">🎙️</div>
          <h2>Voice FAQ</h2>
          <p>Ask questions using your voice.</p>
        </router-link>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import '../assets/css/HomePage.css';
</style>
