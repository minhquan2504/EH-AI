import rateLimit from 'express-rate-limit';

/**
 * Khóa IP nếu gọi API Liên kết quá 5 lần trong 15 phút
 */
export const linkPatientRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error_code: 'TOO_MANY_REQUESTS',
        message: 'Bạn đã thử liên kết quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true, 
    legacyHeaders: false,
});