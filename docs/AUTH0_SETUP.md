# Auth0 Setup Guide

This guide walks you through setting up Auth0 for Busala authentication.

---

## ✅ What's Already Done

I've implemented the authentication system:

- ✅ Auth0 SDK installed
- ✅ Login page (`/login`)
- ✅ Signup page (`/signup`)
- ✅ Auth0 API routes (`/api/auth/*`)
- ✅ Auth middleware for protected routes
- ✅ Authentication hooks (`useAuth`, `useUserRole`)
- ✅ User session management
- ✅ TopNav integration with real user data

---

## 🔧 What You Need to Do

### Step 1: Create Auth0 Account

1. Go to [https://auth0.com/signup](https://auth0.com/signup)
2. Sign up with your email or Google account
3. Create a new tenant (e.g., `busala-dev`)

### Step 2: Create an Application

1. In Auth0 Dashboard, go to **Applications** → **Applications**
2. Click **Create Application**
3. Select **Regular Web Applications**
4. Name it "Busala School Management"
5. Click **Create**

### Step 3: Configure Application Settings

In your new application settings:

**Application URIs:**
```
Allowed Callback URLs:  http://localhost:3000/api/auth/callback
Allowed Logout URLs:    http://localhost:3000/login
Allowed Web Origins:    http://localhost:3000
```

**For Production:**
```
Allowed Callback URLs:  https://yourdomain.com/api/auth/callback, http://localhost:3000/api/auth/callback
Allowed Logout URLs:    https://yourdomain.com/login, http://localhost:3000/login
Allowed Web Origins:    https://yourdomain.com, http://localhost:3000
```

### Step 4: Get Your Credentials

From the **Settings** tab, copy:
- **Domain** (e.g., `dev-abc123.us.auth0.com`)
- **Client ID**
- **Client Secret**

### Step 5: Generate Auth0 Secret

In your terminal:
```bash
openssl rand -hex 32
```

This generates a 64-character string.

### Step 6: Create Environment File

Create `.env.local` in your project root:

```bash
# Copy from example
cp .env.example .env.local
```

Edit `.env.local` and fill in your Auth0 credentials:

```bash
# Database (keep your existing)
DATABASE_URL="postgresql://..."

# Auth0 Configuration
AUTH0_SECRET='paste-your-64-char-secret-here'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://busala/api'
AUTH0_SCOPE='openid profile email'
```

### Step 7: Test Authentication

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000/login

3. Click "Sign in with Auth0"

4. You should be redirected to Auth0's login page

5. After logging in, you'll be redirected back to the dashboard

---

## 🔒 Security Features Implemented

| Feature | Status |
|---------|--------|
| JWT Token Validation | ✅ |
| HTTP-only Cookies | ✅ |
| CSRF Protection | ✅ |
| Session Management | ✅ |
| Protected Routes | ✅ |
| Role-based Access | ✅ |

---

## 🧪 Testing the Auth Flow

### Test 1: Login Flow
```
1. Visit http://localhost:3000/login
2. Click "Sign in with Auth0"
3. Complete Auth0 authentication
4. Verify redirect to dashboard
5. Check user name appears in TopNav
```

### Test 2: Protected Routes
```
1. Open incognito window
2. Visit http://localhost:3000/teachers
3. Should redirect to /login
4. Log in
5. Should redirect back to /teachers
```

### Test 3: Logout Flow
```
1. Click user avatar in TopNav
2. Click "Log out"
3. Should redirect to /login
4. Try accessing /students
5. Should redirect to /login
```

### Test 4: API Security
```
1. Open browser dev tools
2. Go to Network tab
3. Clear cookies/session
4. Try API call: fetch('/api/teachers')
5. Should return 401 Unauthorized
```

---

## 📁 Files Created/Modified

### New Files:
```
src/lib/auth/
├── config.ts              # Auth0 configuration
└── session.ts             # Session utilities

src/app/api/auth/[...auth0]/
└── route.ts               # Auth0 API routes

src/app/login/
└── page.tsx               # Login page

src/app/signup/
└── page.tsx               # Signup page

src/hooks/
└── useAuth.ts             # Authentication hooks

src/middleware.ts          # Auth middleware (NEW)
```

### Modified Files:
```
src/app/layout.tsx         # Added UserProvider
src/lib/api-utils.ts       # JWT-based auth
src/lib/api/client.ts      # Removed hardcoded headers
src/components/dashboard/TopNav.tsx  # Real user data
.env.example               # Auth0 config template
```

---

## 🚨 Troubleshooting

### Issue: "Missing required Auth0 environment variables"
**Solution:** Check `.env.local` has all required variables.

### Issue: "Callback URL mismatch"
**Solution:** In Auth0 Dashboard, verify Allowed Callback URLs includes `http://localhost:3000/api/auth/callback`

### Issue: "Cannot read property 'user' of undefined"
**Solution:** Make sure Auth0Provider wraps the app in layout.tsx

### Issue: "401 Unauthorized on API calls"
**Solution:** Check that middleware.ts is in src/ root, not in app/

### Issue: "User not syncing to database"
**Solution:** Check database connection and ensure User model exists

---

## 🔄 User Sync to Database

When users log in, they're automatically synced to the database:

1. First-time login → Creates new User record
2. Subsequent logins → Updates name/email
3. Role assignment → Defaults to 'staff'

To change a user's role, update the database directly:
```bash
npx prisma studio
# Navigate to User table and edit role field
```

---

## 🛠️ Next Steps

After Auth0 is working:

1. **Create default admin user**
   - Log in with your email
   - Use Prisma Studio to set role to 'admin'

2. **Test role-based access**
   - Create users with different roles
   - Verify permissions work correctly

3. **Production deployment**
   - Update AUTH0_BASE_URL to production domain
   - Add production URLs to Auth0 settings
   - Enable custom domain (optional)

---

## 📚 Additional Resources

- [Auth0 Next.js SDK Docs](https://github.com/auth0/nextjs-auth0)
- [Auth0 Dashboard](https://manage.auth0.com/)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Need help?** Check the Auth0 logs in their dashboard for detailed error messages.
