// ── Centralized API utility ────────────────────────────────────────────────
// ใช้เป็น wrapper สำหรับทุก fetch call เพื่อ:
// 1. inject VITE_API_BASE_URL อัตโนมัติ
// 2. เพิ่ม ngrok-skip-browser-warning header เพื่อข้าม ngrok warning page
// 3. แนบ Authorization token อัตโนมัติ (optional)

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * apiFetch — wrapper รอบ fetch ที่ inject header ที่จำเป็นทั้งหมด
 * @param {string} path     - API path เช่น '/api/login'
 * @param {RequestInit} options - fetch options (method, body, headers ...)
 * @param {boolean} withAuth    - แนบ Authorization Bearer token ด้วยหรือไม่
 */
export async function apiFetch(path, options = {}, withAuth = false) {
  const headers = {
    // ข้าม ngrok browser warning page (จำเป็นสำหรับ ngrok free plan)
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };

  if (withAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
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
