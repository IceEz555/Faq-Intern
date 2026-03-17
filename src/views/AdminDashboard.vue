<template>
  <div class="admin-page">
    <div class="admin-topbar">
      <div>
        <h1 class="admin-title">🛠️ Admin Dashboard</h1>
        <p class="admin-subtitle">ข้อมูลเพื่อพัฒนา FAQ — ดู blind spots และการใช้งาน token ต่อ user</p>
      </div>
      <button class="logout-btn" @click="handleLogout">🚪 Logout</button>
    </div>

    <!-- ── Stat Cards ── -->
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-icon">👎</span>
        <span class="stat-value">{{ negativeFeedback.length }}</span>
        <span class="stat-label">คำตอบที่โดน Thumbs Down</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🤷</span>
        <span class="stat-value">{{ unknownAnswers.length }}</span>
        <span class="stat-label">บอทตอบว่าไม่รู้</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <span class="stat-value">{{ userStats.length }}</span>
        <span class="stat-label">ผู้ใช้ทั้งหมด</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔢</span>
        <span class="stat-value">{{ totalTokens.toLocaleString() }}</span>
        <span class="stat-label">Token รวมทั้งหมด</span>
      </div>
    </div>

    <!-- ── Tabs ── -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: tab === 'negative' }" @click="tab = 'negative'">
        👎 Negative Feedback
      </button>
      <button class="tab-btn" :class="{ active: tab === 'unknown' }" @click="tab = 'unknown'">
        🤷 บอทตอบว่าไม่รู้
      </button>
      <button class="tab-btn" :class="{ active: tab === 'stats' }" @click="tab = 'stats'">
        📊 Usage Stats
      </button>
      <button class="tab-btn" :class="{ active: tab === 'scrape' }" @click="tab = 'scrape'">
        🕷️ Web Scrape
      </button>
    </div>

    <!-- ── Search + Refresh ── -->
    <div class="search-bar">
      <input
        v-model="search"
        type="text"
        class="search-input"
        placeholder="🔍 ค้นหาคำถาม / user..."
      />
      <button class="refresh-btn" @click="loadAll">🔄 Refresh</button>
    </div>

    <!-- ── Tab: Negative Feedback ── -->
    <div v-if="tab === 'negative'">
      <div v-if="loading" class="loading-msg">⏳ กำลังโหลด...</div>
      <div v-else-if="filteredNegative.length === 0" class="empty-msg">ไม่พบข้อมูล 👌</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>คำถามของ User</th>
              <th>คำตอบของบอท</th>
              <th>User</th>
              <th>วันที่</th>
              <th>Copy</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filteredNegative" :key="row.feedback_id">
              <td>{{ i + 1 }}</td>
              <td class="cell-question">
                <span class="cell-truncate" :title="row.question">{{ row.question || '—' }}</span>
              </td>
              <td class="cell-answer">
                <span class="cell-truncate" :title="row.bot_answer">{{ row.bot_answer }}</span>
              </td>
              <td>{{ row.username }}</td>
              <td>{{ formatDate(row.answered_at) }}</td>
              <td>
                <button
                  class="copy-btn"
                  :class="{ copied: row._copied }"
                  @click="copyQuestion(row)"
                >{{ row._copied ? '✅ Copied' : '📋 Copy' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Tab: Unknown Answers ── -->
    <div v-if="tab === 'unknown'">
      <div v-if="loading" class="loading-msg">⏳ กำลังโหลด...</div>
      <div v-else-if="filteredUnknown.length === 0" class="empty-msg">ไม่พบข้อมูล 🎉</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>คำถามของ User</th>
              <th>คำตอบของบอท (ที่บอกว่าไม่รู้)</th>
              <th>User</th>
              <th>วันที่</th>
              <th>Copy</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filteredUnknown" :key="row.message_id">
              <td>{{ i + 1 }}</td>
              <td class="cell-question">
                <span class="cell-truncate" :title="row.question">{{ row.question || '—' }}</span>
              </td>
              <td class="cell-answer">
                <span class="cell-truncate" :title="row.bot_answer">{{ row.bot_answer }}</span>
              </td>
              <td>{{ row.username }}</td>
              <td>{{ formatDate(row.answered_at) }}</td>
              <td>
                <button
                  class="copy-btn"
                  :class="{ copied: row._copied }"
                  @click="copyQuestion(row)"
                >{{ row._copied ? '✅ Copied' : '📋 Copy' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Tab: User Stats ── -->
    <div v-if="tab === 'stats'">
      <div v-if="loading" class="loading-msg">⏳ กำลังโหลด...</div>
      <div v-else-if="filteredStats.length === 0" class="empty-msg">ไม่พบผู้ใช้</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>คำถามทั้งหมด</th>
              <th>Token ที่ใช้ไป</th>
              <th>👍</th>
              <th>👎</th>
              <th>ใช้งานล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filteredStats" :key="row.id">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ row.username }}</strong></td>
              <td>{{ row.total_questions }}</td>
              <td><span class="badge badge-token">{{ Number(row.total_tokens).toLocaleString() }}</span></td>
              <td><span class="badge badge-up">{{ row.thumbs_up }}</span></td>
              <td><span class="badge badge-down">{{ row.thumbs_down }}</span></td>
              <td>{{ row.last_active ? formatDate(row.last_active) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- ── Tab: Web Scrape ── -->
    <div v-if="tab === 'scrape'" class="scrape-panel">
      <p class="scrape-desc">ใส่ URL เพื่อ scrape เนื้อหาแล้ว embed ลง Qdrant</p>

      <!-- URL Input -->
      <div class="scrape-input-row">
        <input
          v-model="scrapeUrl"
          type="url"
          class="scrape-url-input"
          placeholder="https://example.com/page"
          @keyup.enter="doPreview"
        />
        <button class="scrape-btn" @click="doPreview" :disabled="scrapeLoading || !scrapeUrl.trim()">
          {{ scrapeLoading && scrapePhase === 'preview' ? '⏳ กำลังดูตัวอย่าง...' : '🔍 Preview' }}
        </button>
      </div>

      <!-- Error -->
      <div v-if="scrapeError" class="scrape-error">❌ {{ scrapeError }}</div>

      <!-- Preview Card -->
      <div v-if="scrapePreview" class="scrape-preview-card">
        <div class="preview-title">📄 {{ scrapePreview.title }}</div>
        <div class="preview-meta">
          <span class="badge badge-token">{{ scrapePreview.total_chars.toLocaleString() }} chars</span>
          <span class="badge badge-up">~{{ scrapePreview.estimated_chunks }} chunks</span>
        </div>
        <div class="preview-snippet">{{ scrapePreview.snippet }}</div>

        <!-- Embed Button -->
        <button
          class="embed-btn"
          @click="doEmbed"
          :disabled="scrapeLoading || scrapeEmbedDone"
        >
          {{ scrapeLoading && scrapePhase === 'embed' ? '⏳ กำลัง Embed...' : scrapeEmbedDone ? '✅ Embedded แล้ว!' : '🚀 Confirm & Embed' }}
        </button>

        <!-- Success -->
        <div v-if="scrapeSuccess" class="scrape-success">
          ✅ Embed สำเร็จ! {{ scrapeSuccess.chunks }} chunks จาก "{{ scrapeSuccess.title }}"
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiAuthFetch } from '@/utils/api.js';

const router  = useRouter();
const tab     = ref('negative');
const search  = ref('');
const loading = ref(false);

// ── Web Scrape state ───────────────────────────────────────────────────────────
const scrapeUrl      = ref('');
const scrapePreview  = ref(null);
const scrapeSuccess  = ref(null);
const scrapeError    = ref('');
const scrapeLoading  = ref(false);
const scrapeEmbedDone = ref(false);
const scrapePhase    = ref('');  // 'preview' | 'embed'

const negativeFeedback = ref([]);
const unknownAnswers   = ref([]);
const userStats        = ref([]);

// Redirect if not admin
if (localStorage.getItem('isAdmin') !== 'true') {
  router.replace('/admin-login');
}

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('isAdmin');
  router.push('/admin-login');
};

const totalTokens = computed(() =>
  userStats.value.reduce((sum, u) => sum + Number(u.total_tokens || 0), 0)
);

const filteredNegative = computed(() => {
  const q = search.value.toLowerCase();
  if (!q) return negativeFeedback.value;
  return negativeFeedback.value.filter(r =>
    (r.question || '').toLowerCase().includes(q) ||
    (r.bot_answer || '').toLowerCase().includes(q) ||
    (r.username   || '').toLowerCase().includes(q)
  );
});

const filteredUnknown = computed(() => {
  const q = search.value.toLowerCase();
  if (!q) return unknownAnswers.value;
  return unknownAnswers.value.filter(r =>
    (r.question || '').toLowerCase().includes(q) ||
    (r.bot_answer || '').toLowerCase().includes(q) ||
    (r.username   || '').toLowerCase().includes(q)
  );
});

const filteredStats = computed(() => {
  const q = search.value.toLowerCase();
  if (!q) return userStats.value;
  return userStats.value.filter(r => r.username.toLowerCase().includes(q));
});

const adminFetch = async (path) => {
  const token = localStorage.getItem('token');
  if (!token) { router.push('/admin-login'); return []; }
  const res = await apiAuthFetch(path);
  if (res.status === 401 || res.status === 403) { router.push('/admin-login'); return []; }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const loadAll = async () => {
  loading.value = true;
  try {
    const [neg, unk, stats] = await Promise.all([
      adminFetch('/api/admin/negative-feedback'),
      adminFetch('/api/admin/unknown-answers'),
      adminFetch('/api/admin/user-stats'),
    ]);
    negativeFeedback.value = (neg   || []).map(r => ({ ...r, _copied: false }));
    unknownAnswers.value   = (unk   || []).map(r => ({ ...r, _copied: false }));
    userStats.value        =  stats || [];
  } catch (e) {
    console.error('Admin load error:', e);
  } finally {
    loading.value = false;
  }
};

const copyQuestion = async (row) => {
  try {
    await navigator.clipboard.writeText(row.question || '');
    row._copied = true;
    setTimeout(() => { row._copied = false; }, 2000);
  } catch (e) {
    console.error('Clipboard error:', e);
  }
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

onMounted(loadAll);

// ── Web Scrape functions ──────────────────────────────────────────────────────────
const doPreview = async () => {
  const url = scrapeUrl.value.trim();
  if (!url) return;
  scrapePreview.value  = null;
  scrapeSuccess.value  = null;
  scrapeError.value    = '';
  scrapeEmbedDone.value = false;
  scrapeLoading.value  = true;
  scrapePhase.value    = 'preview';
  try {
    const res  = await apiAuthFetch('/llm/scrape/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) { scrapeError.value = data.detail || 'Preview failed'; return; }
    scrapePreview.value = data;
  } catch (e) {
    scrapeError.value = 'Network error: ' + e.message;
  } finally {
    scrapeLoading.value = false;
    scrapePhase.value   = '';
  }
};

const doEmbed = async () => {
  const url = scrapeUrl.value.trim();
  if (!url || scrapeEmbedDone.value) return;
  scrapeSuccess.value  = null;
  scrapeError.value    = '';
  scrapeLoading.value  = true;
  scrapePhase.value    = 'embed';
  try {
    const res  = await apiAuthFetch('/llm/scrape/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) { scrapeError.value = data.detail || 'Embed failed'; return; }
    scrapeSuccess.value  = data;
    scrapeEmbedDone.value = true;
  } catch (e) {
    scrapeError.value = 'Network error: ' + e.message;
  } finally {
    scrapeLoading.value = false;
    scrapePhase.value   = '';
  }
};
</script>

<style scoped>
@import '../assets/css/AdminDashboard.css';

/* ── Web Scrape Tab ───────────────────────────────────────────────── */
.scrape-panel { padding: 20px 0; max-width: 720px; }
.scrape-desc  { color: #666; margin-bottom: 16px; font-size: 0.9rem; }

.scrape-input-row {
  display: flex; gap: 10px; margin-bottom: 16px;
}
.scrape-url-input {
  flex: 1; padding: 10px 14px; border: 1.5px solid #c9d4e8;
  border-radius: 8px; font-size: 0.95rem;
  transition: border-color 0.2s;
}
.scrape-url-input:focus { outline: none; border-color: #003366; }

.scrape-btn {
  padding: 10px 20px; background: #003366; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
  font-weight: 600; white-space: nowrap;
  transition: background 0.2s;
}
.scrape-btn:hover:not(:disabled) { background: #004fa3; }
.scrape-btn:disabled { opacity: 0.5; cursor: default; }

.scrape-error   { color: #c00; background: #fff0f0; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; }
.scrape-success { color: #166534; background: #f0fdf4; padding: 10px 14px; border-radius: 8px; margin-top: 12px; font-weight: 500; }

.scrape-preview-card {
  background: #f7f9ff; border: 1.5px solid #d0d9f5;
  border-radius: 12px; padding: 20px;
}
.preview-title {
  font-size: 1rem; font-weight: 700; color: #003366;
  margin-bottom: 10px;
}
.preview-meta  { display: flex; gap: 8px; margin-bottom: 12px; }
.preview-snippet {
  font-size: 0.85rem; color: #444; line-height: 1.6;
  background: #fff; border: 1px solid #e0e7f5;
  border-radius: 8px; padding: 12px;
  max-height: 160px; overflow-y: auto;
  white-space: pre-wrap; margin-bottom: 16px;
}

.embed-btn {
  padding: 10px 24px; background: #16803c; color: #fff;
  border: none; border-radius: 8px; cursor: pointer;
  font-weight: 700; font-size: 0.95rem;
  transition: background 0.2s;
}
.embed-btn:hover:not(:disabled) { background: #15803d; }
.embed-btn:disabled { opacity: 0.6; cursor: default; }
</style>
