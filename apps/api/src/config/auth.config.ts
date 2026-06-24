import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  argon2Options: {
    type: 2, // argon2id
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  },
  passwordMinLength: 8,
  passwordMaxLength: 128,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  sessionDurationDays: 7,
  featureMfa: process.env.FEATURE_MFA === 'true',
}));
