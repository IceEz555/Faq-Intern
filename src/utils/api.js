// ── Centralized API utility ────────────────────────────────────────────────
// ใช้เป็น wrapper สำหรับทุก fetch call เพื่อ:
// 1. inject VITE_API_BASE_URL อัตโนมัติ
// 2. ส่ง query param ngrok-skip-browser-warning เพื่อข้าม ngrok warning page
//    (ใช้ query param แทน header เพื่อหลีกเลี่ยงปัญหา CORS preflight)
// 3. แนบ Authorization token อัตโนมัติ (optional)

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * buildUrl — สร้าง URL พร้อม query param สำหรับ ngrok bypass
 */
function buildUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, '');
  // เพิ่ม ngrok-skip-browser-warning เป็น query param เพื่อข้าม ngrok warning
  // วิธีนี้ไม่ทำให้เกิด CORS preflight error ต่างจากการใช้ custom header
  const sep = path.includes('?') ? '&' : '?';
  return `${base}${path}${sep}ngrok-skip-browser-warning=true`;
}

/**
 * apiFetch — wrapper รอบ fetch ที่ inject header ที่จำเป็นทั้งหมด
 * @param {string} path     - API path เช่น '/api/login'
 * @param {RequestInit} options - fetch options (method, body, headers ...)
 * @param {boolean} withAuth    - แนบ Authorization Bearer token ด้วยหรือไม่
 */
export async function apiFetch(path, options = {}, withAuth = false) {
  const headers = {
    ...(options.headers || {}),
  };

  if (withAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(buildUrl(path), {
    ...options,
    headers,
  });
}

/**
 * apiAuthFetch — shortcut สำหรับ apiFetch ที่มี Auth token เสมอ
 */
export function apiAuthFetch(path, options = {}) {
  return apiFetch(path, options, true);
}
