export const AUTH_CONSTANTS = {
    VERIFY_EMAIL: {             
        EXPIRES_IN_MS: 5 * 60 * 1000, 
    },

    RESET_PASSWORD: {
        TOKEN_LENGTH: 32,
        EXPIRES_IN_MS: 5 * 60 * 1000, 
    },

    ACCOUNT_STATUS: {
        PENDING: 'PENDING',
        ACTIVE: 'ACTIVE',
        LOCKED: 'LOCKED',
    },

    LOGIN_LIMIT: {
        MAX_ATTEMPTS: 7,      
        LOCK_DURATION_MINUTES: 30, 
        LOCK_DURATION_MS: 30 * 60 * 1000 
    },
    SESSION: {
        IDLE_TIMEOUT_DAYS: 7,
        IDLE_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000,
    }

} as const;