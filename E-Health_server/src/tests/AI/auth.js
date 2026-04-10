/**
 * auth.js — Xử lý đăng nhập / đăng xuất / quản lý token
 * Giao tiếp với endpoint: POST /api/auth/login
 */

const AUTH_BASE = 'http://localhost:3000/api';
const TOKEN_KEY  = 'ehealth_access_token';
const USER_KEY   = 'ehealth_user_info';
const DEVICE_KEY = 'ehealth_device_id';

/** Tạo hoặc lấy deviceId ổn định từ localStorage */
function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
        // Sinh UUID-like duy nhất cho browser này
        id = 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
}

/** Tạo clientInfo chuẩn để gửi kèm login request */
function buildClientInfo() {
    return {
        deviceId:   getDeviceId(),
        deviceName: `Web Test UI — ${navigator.platform || 'Browser'}`,
        userAgent:  navigator.userAgent,
    };
}

/** Lấy access token đang lưu */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/** Lấy thông tin user đang lưu */
export function getUserInfo() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
        return null;
    }
}

/** Kiểm tra đã đăng nhập chưa */
export function isLoggedIn() {
    return !!getToken();
}

/**
 * Đăng nhập — tự động detect email hay SĐT để gọi đúng endpoint.
 * Server có 2 route riêng:
 *   POST /api/auth/login/email  → field: { email, password }
 *   POST /api/auth/login/phone  → field: { phone, password }
 * @returns {{ success: boolean, message: string }}
 */
export async function login(identifier, password) {
    // Detect loại identifier
    const isPhone = /^[\d\s\+\-\(\)]{8,15}$/.test(identifier.trim());
    const endpoint = isPhone
        ? `${AUTH_BASE}/auth/login/phone`
        : `${AUTH_BASE}/auth/login/email`;

    const body = isPhone
        ? { phone: identifier.trim(), password, clientInfo: buildClientInfo() }
        : { email: identifier.trim(), password, clientInfo: buildClientInfo() };

    let res, result;
    try {
        res    = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        result = await res.json();
    } catch (e) {
        return { success: false, message: `Không thể kết nối server: ${e.message}` };
    }

    if (res.ok && result.success) {
        // Tìm access_token trong nhiều cấu trúc response khác nhau
        const token = result.data?.access_token
            || result.data?.accessToken
            || result.data?.token
            || result.data?.tokens?.access_token;
        const user  = result.data?.user || result.data;

        if (!token) {
            console.error('[auth] Response data:', result.data);
            return { success: false, message: 'Không tìm thấy access_token trong response.' };
        }

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return { success: true, message: 'Đăng nhập thành công' };
    }

    return { success: false, message: result.message || result.error || `Lỗi ${res.status}` };
}

/** Đăng xuất — xóa token khỏi localStorage */
export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Tạo headers chuẩn cho API call (có hoặc không Bearer token).
 * Guest sẽ không có Authorization header.
 */
export function buildHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
