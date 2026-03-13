// Auth module exports

// Session management
export {
  createSession,
  validateSessionToken,
  invalidateSession,
  invalidateUserSessions,
  setSessionCookie,
  deleteSessionCookie,
  getSessionToken,
  getCurrentSession,
  requireAuth,
  type SessionValidationResult,
} from './session';

// Password utilities
export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateTemporaryPassword,
} from './password';

// OAuth utilities
export {
  google,
  apple,
  createGoogleAuthorizationUrl,
  createAppleAuthorizationUrl,
  validateOAuthState,
  getCodeVerifier,
  clearOAuthCookies,
  isOAuthConfigured,
  parseGoogleIdToken,
  parseAppleIdToken,
  type GoogleUserInfo,
  type AppleUserInfo,
} from './oauth';
