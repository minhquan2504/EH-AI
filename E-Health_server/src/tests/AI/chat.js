/**
 * chat.js — Xử lý toàn bộ logic chat với AI Health Chat API
 * Import module: auth.js
 */

import { buildHeaders, getToken } from './auth.js';

const CHAT_BASE = 'http://localhost:3000/api/ai/health-chat';

/** Session đang active */
export let currentSessionId = null;
export let isProcessing = false;

/** Callback functions (set từ index.html) */
let onNewMessage = null;
let onTypingStart = null;
let onTypingEnd   = null;
let onSessionsChange = null;
let onSessionError = null;

export function setChatCallbacks({ newMessage, typingStart, typingEnd, sessionsChange, sessionError }) {
    onNewMessage = newMessage;
    onTypingStart = typingStart;
    onTypingEnd = typingEnd;
    onSessionsChange = sessionsChange;
    onSessionError = sessionError;
}

// ═══════════════════════════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════════════════════════

/** Load danh sách phiên chat của user (chỉ hoạt động khi đã đăng nhập) */
export async function loadSessions() {
    if (!getToken()) {
        onSessionsChange?.([]);
        return;
    }
    try {
        const res = await fetch(`${CHAT_BASE}/sessions?limit=30`, { headers: buildHeaders() });
        if (res.status === 401) return handleAuthError();
        const result = await res.json();
        // Controller trả: { success, data: [...sessions], pagination: {...} }
        const sessions = Array.isArray(result.data) ? result.data : [];
        onSessionsChange?.(sessions);
    } catch (e) {
        console.error('[chat] loadSessions error:', e);
        onSessionsChange?.([]);
    }
}

/** Load lịch sử 1 phiên cụ thể */
export async function loadSession(sessionId) {
    try {
        const res = await fetch(`${CHAT_BASE}/sessions/${sessionId}`, { headers: buildHeaders() });
        if (res.status === 401) { handleAuthError(); throw new Error("Phiên đăng nhập hết hạn."); }
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        currentSessionId = sessionId;
        return result.data; // { session, messages }
    } catch (e) {
        onSessionError?.(e.message);
        return null;
    }
}

/** Reset về trạng thái không có session */
export function resetSession() {
    currentSessionId = null;
}

// ═══════════════════════════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════════════════════════

/**
 * Gửi tin nhắn (tạo session mới nếu chưa có).
 * @param {string} message
 * @param {boolean} useStream
 */
export async function sendMessage(message, useStream = true) {
    if (!message.trim() || isProcessing) return;
    isProcessing = true;

    try {
        if (!currentSessionId) {
            await _startNewSession(message);
        } else if (useStream) {
            await _sendStream(message);
        } else {
            await _sendJSON(message);
        }
    } finally {
        isProcessing = false;
    }
}

/** Tạo phiên chat mới và gửi tin nhắn đầu tiên */
async function _startNewSession(message) {
    onTypingStart?.();
    try {
        const res = await fetch(`${CHAT_BASE}/sessions`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({ message }),
        });
        if (res.status === 401) { handleAuthError(); throw new Error("Phiên đăng nhập hết hạn."); }
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || `${res.status}`);

        currentSessionId = result.data.session.session_id;
        onTypingEnd?.();
        onNewMessage?.('assistant', result.data.ai_reply, result.data.analysis, null, null, result.data.session);
        await loadSessions();
    } catch (e) {
        onTypingEnd?.();
        onNewMessage?.('assistant', `❌ Lỗi tạo phiên: ${e.message}`, null, null, null, null);
    }
}

/** Gửi tin nhắn không stream (JSON response) */
async function _sendJSON(message) {
    const typingId = onTypingStart?.();
    try {
        const res = await fetch(`${CHAT_BASE}/sessions/${currentSessionId}/messages`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({ message }),
        });
        if (res.status === 401) { handleAuthError(); throw new Error("Phiên đăng nhập hết hạn."); }
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || `${res.status}`);
        onTypingEnd?.(typingId);
        // Controller trả: { data: { session, ai_reply, analysis } }
        onNewMessage?.('assistant', result.data.ai_reply, result.data.analysis, null, null, result.data.session);
    } catch (e) {
        onTypingEnd?.(typingId);
        onNewMessage?.('assistant', `❌ Lỗi: ${e.message}`);
    }
}

/**
 * Gửi tin nhắn với SSE streaming.
 * Trả về qua callback onNewMessage với streaming updates.
 */
async function _sendStream(message) {
    // Báo UI bắt đầu stream (không dùng typing thông thường)
    onTypingStart?.('stream');

    try {
        const res = await fetch(`${CHAT_BASE}/sessions/${currentSessionId}/messages/stream`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({ message }),
        });

        if (res.status === 401) { handleAuthError(); throw new Error("Phiên đăng nhập hết hạn."); }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
            throw new Error(err.message || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamChunks = '';
        let analysisData = null;
        let finalSession = null;

        // Báo UI: bắt đầu nhận streaming text
        onTypingEnd?.('stream');
        onNewMessage?.('stream-start', '', null, null, null, null);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // phần chưa hoàn chỉnh

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const data = JSON.parse(line.substring(6));
                    switch (data.type) {
                        case 'chunk':
                            streamChunks += data.content;
                            onNewMessage?.('stream-chunk', data.content, null, null, null, null);
                            break;
                        case 'replace':
                            onNewMessage?.('stream-replace', data.content, null, null, null, null);
                            break;
                        case 'analysis':
                            analysisData = data.data;
                            break;
                        case 'done':
                            finalSession = data.session;
                            break;
                        case 'error':
                            throw new Error(data.message);
                    }
                } catch { /* skip partial parse */ }
            }
        }

        // Kết thúc stream: đẩy analysis card
        onNewMessage?.('stream-end', streamChunks, analysisData, null, null, finalSession);
        await loadSessions();
    } catch (e) {
        onTypingEnd?.('stream');
        onNewMessage?.('assistant', `❌ Stream lỗi: ${e.message}`);
    }
}

// ═══════════════════════════════════════════════════════════
// END SESSION
// ═══════════════════════════════════════════════════════════

/** Kết thúc phiên tư vấn hiện tại */
export async function endSession() {
    if (!currentSessionId) return;
    try {
        const res = await fetch(`${CHAT_BASE}/sessions/${currentSessionId}/complete`, {
            method: 'PATCH',
            headers: buildHeaders(),
        });
        if (res.status === 401) { handleAuthError(); throw new Error("Phiên đăng nhập hết hạn."); }
        await loadSessions();
    } catch (e) {
        onSessionError?.(e.message);
    }
}

function handleAuthError() {
    window.dispatchEvent(new Event('auth-expired'));
}
