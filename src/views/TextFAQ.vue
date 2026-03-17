<template>
  <div class="page-container">
    <div class="header">
       <button @click="clearChat" class="clear-btn" v-if="messages.length > 0">Clear Chat</button>
    </div>

    <div class="chat-window" ref="chatWindow">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-wrapper"
        :class="msg.sender"
      >
        <!-- Message Bubble -->
        <div class="message" :class="msg.sender">{{ msg.text }}</div>

        <!-- 📚 Retrieved Context (bot only) -->
        <div v-if="msg.sender === 'bot' && msg.context && msg.context.length > 0" class="context-section">
          <button class="context-toggle" @click="msg.showContext = !msg.showContext">
            {{ msg.showContext ? '▲' : '▼' }} 📚 ข้อมูลที่ใช้ตอบ ({{ msg.context.length }} รายการ)
          </button>
          <div v-if="msg.showContext" class="context-list">
            <div v-for="(ctx, ci) in msg.context" :key="ci" class="context-card">
              <div v-if="ctx.question" class="ctx-question">❓ {{ ctx.question }}</div>
              <div v-if="ctx.answer"   class="ctx-answer">💡 {{ ctx.answer }}</div>
              <div v-if="!ctx.question && !ctx.answer" class="ctx-content">{{ ctx.content }}</div>
              <a v-if="ctx.source" :href="ctx.source" target="_blank" rel="noopener noreferrer" class="ctx-link">
                🔗 อ่านเพิ่มเติม
              </a>
            </div>
          </div>
        </div>

        <!-- 📎 Source URLs (bot only, fallback if no context detail) -->
        <div v-else-if="msg.sender === 'bot' && msg.sources && msg.sources.length > 0" class="sources-section">
          <span class="sources-label">📎 แหล่งอ้างอิง:</span>
          <a
            v-for="(src, si) in msg.sources"
            :key="si"
            :href="src"
            target="_blank"
            rel="noopener noreferrer"
            class="source-link"
          >อ่านเพิ่มเติม {{ msg.sources.length > 1 ? si + 1 : '' }}</a>
        </div>

        <!-- 👍 / 👎 Feedback (bot only) -->
        <div v-if="msg.sender === 'bot'" class="feedback-row">
          <button
            class="thumb-btn"
            :class="{ active: msg.vote === 'up', disabled: msg.vote !== null }"
            :disabled="msg.vote !== null"
            @click="submitFeedback(msg, 'up')"
            title="เป็นประโยชน์"
          >👍</button>
          <button
            class="thumb-btn"
            :class="{ active: msg.vote === 'down', disabled: msg.vote !== null }"
            :disabled="msg.vote !== null"
            @click="submitFeedback(msg, 'down')"
            title="ไม่เป็นประโยชน์"
          >👎</button>
          <span v-if="msg.vote" class="vote-label">
            {{ msg.vote === 'up' ? 'ขอบคุณ! 😊' : 'ขอบคุณ เราจะพัฒนาต่อไป 🙏' }}
          </span>
        </div>
      </div>

      <div v-if="isLoading" class="typing-indicator">AI กำลังพิมพ์...</div>
    </div>

    <div class="input-area">
      <input
        v-model="userInput"
        @keyup.enter="sendMessage"
        type="text"
        class="chat-input"
        placeholder="พิมพ์คำถามที่นี่..."
      />
      <button @click="sendMessage" class="send-button" :disabled="!userInput.trim()">➤</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiAuthFetch, apiFetch } from '@/utils/api.js';

const userInput  = ref('');
const chatWindow = ref(null);
const isLoading  = ref(false);
const messages   = ref([]);
const router     = useRouter();

const getToken = () => localStorage.getItem('token');

// ─── Load History ─────────────────────────────────────────────────────────────
const loadHistory = async () => {
  const token = getToken();
  if (!token) { router.push('/login'); return; }

  try {
    const res = await apiAuthFetch('/api/history');
    if (res.status === 401 || res.status === 403) { router.push('/login'); return; }

    const data = await res.json();
    messages.value = data.map(msg => ({
      id:          msg.id,
      text:        msg.text,
      sender:      msg.sender,
      sources:     msg.sources  || [],
      context:     [],
      vote:        null,
      showContext: false,
    }));
    await scrollToBottom();
  } catch (e) { console.error('Failed to load history:', e); }
};

// ─── Clear Chat ───────────────────────────────────────────────────────────────
const clearChat = async () => {
  const token = getToken();
  if (!token || !confirm('ลบประวัติแชทหรือไม่?')) return;

  const res = await apiAuthFetch('/api/clearhistory', { method: 'DELETE' });
  if (res.status === 401 || res.status === 403) { router.push('/login'); return; }
  if (res.ok) messages.value = [];
};

// ─── Send Message ─────────────────────────────────────────────────────────────
const sendMessage = async () => {
  const text = userInput.value.trim();
  if (!text) return;

  const token = getToken();
  if (!token) { router.push('/login'); return; }

  messages.value.push({ id: null, text, sender: 'user', sources: [], context: [], vote: null, showContext: false });
  userInput.value = '';
  await scrollToBottom();
  isLoading.value = true;

  try {
    const res = await apiAuthFetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    if (res.status === 401 || res.status === 403) { router.push('/login'); return; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    messages.value.push({
      id:          data.messageId || null,
      text:        data.reply || 'ขออภัย ไม่สามารถรับคำตอบได้',
      sender:      'bot',
      sources:     data.sources  || [],
      context:     data.context  || [],
      vote:        null,
      showContext: false,
    });

  } catch (e) {
    console.error(e);
    messages.value.push({
      id: null, text: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่',
      sender: 'bot', sources: [], context: [], vote: null, showContext: false
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

// ─── Feedback (👍/👎) ────────────────────────────────────────────────────────
const submitFeedback = async (msg, vote) => {
  if (msg.vote !== null) return;
  msg.vote = vote;
  if (!msg.id) return;

  const token = getToken();
  if (!token) return;

  try {
    await apiAuthFetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id, vote }),
    });
  } catch (e) { console.error(e); msg.vote = null; }
};

// ─── Scroll ───────────────────────────────────────────────────────────────────
const scrollToBottom = async () => {
  await nextTick();
  if (chatWindow.value) chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
};

onMounted(loadHistory);
</script>

<style scoped>
@import '../assets/css/TextFAQ.css';

/* ── Header ── */
.header { display: flex; justify-content: flex-end; padding: 10px; }
.clear-btn { background: #ff4d4d; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.clear-btn:hover { background: #cc0000; }

/* ── Wrappers ── */
.message-wrapper { display: flex; flex-direction: column; gap: 4px; }
.message-wrapper.user { align-items: flex-end; }
.message-wrapper.bot  { align-items: flex-start; }

/* ── Context section ── */
.context-section { max-width: 80%; width: 100%; }
.context-toggle {
  background: none; border: 1px solid #c9d4e8; border-radius: 8px;
  padding: 4px 10px; font-size: 0.78rem; color: #003366;
  cursor: pointer; transition: background 0.15s;
}
.context-toggle:hover { background: #eef2ff; }
.context-list { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.context-card {
  background: #f7f9ff; border: 1px solid #d0d9f5;
  border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: #333;
}
.ctx-question { font-weight: 600; color: #003366; margin-bottom: 4px; }
.ctx-answer   { color: #444; margin-bottom: 4px; }
.ctx-content  { color: #555; margin-bottom: 4px; white-space: pre-wrap; }
.ctx-link { font-size: 0.77rem; color: #003366; text-decoration: underline; }

/* ── Sources (URL fallback) ── */
.sources-section { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.78rem; }
.sources-label   { color: #666; font-weight: 600; }
.source-link {
  color: #003366; text-decoration: underline;
  background: #eef2ff; padding: 2px 8px; border-radius: 12px;
  font-size: 0.77rem; transition: background 0.2s;
}
.source-link:hover { background: #d0d9f5; }

/* ── Feedback ── */
.feedback-row { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.thumb-btn {
  background: none; border: 1px solid #ddd; border-radius: 8px;
  padding: 3px 8px; font-size: 1rem; cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.thumb-btn:hover:not(:disabled) { background: #f0f0f0; transform: scale(1.15); }
.thumb-btn.active { background: #003366; border-color: #003366; color: #fff; }
.thumb-btn.disabled, .thumb-btn:disabled { opacity: 0.5; cursor: default; }
.vote-label { font-size: 0.78rem; color: #555; font-style: italic; }
</style>
