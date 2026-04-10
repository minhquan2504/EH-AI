// constants/token.constant.ts

export const TOKEN_CONFIG = {
  ACCESS_TOKEN: {
    EXPIRES_IN: '30m',
    EXPIRES_IN_SECONDS: 30 * 60,
    SECRET_ENV: 'JWT_ACCESS_SECRET',
  },

  REFRESH_TOKEN: {
    EXPIRES_IN: '14d',
    EXPIRES_IN_SECONDS: 14 * 24 * 60 * 60,
    SECRET_ENV: 'JWT_REFRESH_SECRET',
  },
} as const;