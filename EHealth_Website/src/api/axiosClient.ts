/**
 * Axios Client Configuration
 * Cấu hình Axios cho việc gọi API
 * 
 * @description
 * - Tự động thêm token vào header
 * - Xử lý refresh token khi hết hạn
 * - Xử lý lỗi chung
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config';

// ============================================
// Khởi tạo Axios Instance
// ============================================

const axiosClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// Request Interceptor
// Thêm access token vào mỗi request
// ============================================

axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Lấy token từ localStorage (guard SSR Next.js)
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// ============================================
// Response Interceptor
// Xử lý response và refresh token khi hết hạn
// ============================================

axiosClient.interceptors.response.use(
    (response) => {
        // Trả về data trực tiếp thay vì toàn bộ response
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Xử lý lỗi 401 (Unauthorized) - Token hết hạn
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Thử refresh token (guard SSR Next.js)
                const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

                if (refreshToken) {
                    const response = await axios.post(
                        `${API_CONFIG.BASE_URL}/api/auth/refresh-token`,
                        { refresh_token: refreshToken }
                    );

                    const newAccessToken = response.data?.data?.access_token;

                    if (newAccessToken) {
                        // Lưu token mới
                        localStorage.setItem('accessToken', newAccessToken);

                        // Thử lại request ban đầu với token mới
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        }
                        return axiosClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Refresh token thất bại - Đăng xuất user
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    // Thông báo cho AuthContext reset state trước khi redirect
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // Xử lý các lỗi khác
        return Promise.reject(error);
    }
);

export default axiosClient;
