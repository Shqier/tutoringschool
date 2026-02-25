// ============================================
// AUTH0 CONFIGURATION
// ============================================

/**
 * Auth0 configuration object
 * Loaded from environment variables
 */
export const auth0Config = {
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  authorizationParams: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  },
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
  },
  session: {
    absoluteDuration: 24 * 60 * 60, // 24 hours
    rollingDuration: 60 * 60, // 1 hour
    rolling: true,
  },
};

/**
 * Validate that all required Auth0 environment variables are set
 */
export function validateAuth0Config(): void {
  const required = [
    'AUTH0_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Auth0 environment variables: ${missing.join(', ')}\n` +
        `Please check your .env.local file and ensure all Auth0 credentials are set.`
    );
  }
}

/**
 * Auth0 user profile from session
 */
export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  org_id?: string;
  [key: string]: unknown;
}

/**
 * Session data structure
 */
export interface Session {
  user: Auth0User;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: number;
  createdAt: number;
}

// Validate config on load (but not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateAuth0Config();
  } catch (error) {
    // Only warn, don't throw, to allow builds to complete
    console.warn('Auth0 configuration warning:', (error as Error).message);
  }
}
