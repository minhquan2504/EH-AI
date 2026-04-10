/**
 * LocalStorage Utilities
 * Helper functions cho persistence layer (bridge pattern)
 * Dùng khi backend API chưa sẵn sàng
 */

/**
 * Load dữ liệu từ localStorage, fallback sang giá trị mặc định
 * Kiểm tra `typeof window` mỗi lần gọi để tương thích SSR/Next.js
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored) as T;
    } catch (err) {
        console.warn(`[Storage] Error loading key "${key}":`, err);
    }
    return fallback;
}

/**
 * Lưu dữ liệu vào localStorage
 */
export function saveToStorage<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.warn(`[Storage] Error saving key "${key}":`, err);
    }
}

/**
 * Xoá key khỏi localStorage
 */
export function removeFromStorage(key: string): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(key);
    } catch {}
}

// Storage keys
export const STORAGE_KEYS = {
    PATIENT_PROFILES: "ehealth_patient_profiles",
    MEDICATION_REMINDERS: "ehealth_medication_reminders",
    MEDICATION_LOGS: "ehealth_medication_logs",
} as const;
