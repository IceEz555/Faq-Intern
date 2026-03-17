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
</script>

<style scoped>
@import '../assets/css/AdminDashboard.css';
</style>
