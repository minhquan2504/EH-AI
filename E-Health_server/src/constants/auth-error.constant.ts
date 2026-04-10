export const AUTH_ERRORS = {
    INVALID_INPUT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Thiếu thông tin đăng nhập',
    },

    INVALID_EMAIL_FORMAT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Email không đúng định dạng',
    },

    INVALID_PHONE_FORMAT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Số điện thoại không đúng định dạng',
    },

    INVALID_PASSWORD_FORMAT: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Mật khẩu không hợp lệ',
    },
    INVALID_CREDENTIAL: {
        httpCode: 401,
        code: 'AUTH_002',
        message: 'Tài khoản hoặc mật khẩu không chính xác',
    },
    ACCOUNT_NOT_ACTIVE: {
        httpCode: 403,
        code: 'AUTH_003',
        message: 'Tài khoản đã bị khóa hoặc chưa kích hoạt',
    },
    INVALID_DEVICE: {
        httpCode: 400,
        code: 'AUTH_006',
        message: 'Thiết bị đăng nhập không hợp lệ',
    },
    UNAUTHORIZED: {
        httpCode: 401,
        code: 'AUTH_401',
        message: 'Không tồn tại quyền truy cập',
    },

    SESSION_NOT_FOUND: {
        httpCode: 404,
        code: 'AUTH_404',
        message: 'Session không tồn tại',
    },

    INVALID_REFRESH_TOKEN: {
        httpCode: 401,
        code: 'AUTH_002',
        message: 'Refresh token không hợp lệ',
    },

    INVALID_RESET_TOKEN: {
        httpCode: 400,
        code: 'AUTH_004',
        message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
    },
    INVALID_DATA: {
        httpCode: 400,
        code: 'AUTH_001',
        message: 'Dữ liệu không hợp lệ',
    },
    EMAIL_EXISTED: {
        httpCode: 409,
        code: 'AUTH_007',
        message: 'Email đã được sử dụng',
    },
    PHONE_EXISTED: {
        httpCode: 409,
        code: 'AUTH_008',
        message: 'Số điện thoại đã được sử dụng',
    },
    ACCOUNT_LOCKED: {
        httpCode: 403,
        code: 'AUTH_006',
        message: 'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.',
    },
    SESSION_EXPIRED: {
        httpCode: 401,
        code: 'AUTH_007',
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    },
    LINK_FAILED: {
        httpCode: 400,
        code: 'LINK_FAILED',
        message: 'Thông tin xác minh không khớp hoặc hồ sơ không khả dụng để liên kết.',
    },
    
} as const;