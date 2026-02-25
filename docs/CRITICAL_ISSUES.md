# Critical Issues - Busala SaaS

## 🔴 BLOCKERS (Must Fix Before Launch)

### 1. No Authentication System
**Issue**: Anyone can access the app and API by setting headers  
**Current Code**:
```typescript
// src/lib/api/client.ts - HARDCODED AUTH
'x-user-role': 'admin',
'x-user-id': 'user_default',
'x-org-id': 'org_busala_default',
```
**Fix Required**: Implement Auth0 or NextAuth.js

### 2. No Landing Page
**Issue**: Root URL shows dashboard immediately - no marketing site  
**Current**: `/` → Dashboard (no auth check)  
**Fix Required**: Create public landing page with auth gate

### 3. Header-Based Auth in Production
**Issue**: API accepts auth from headers - easily spoofed  
**Current Code**:
```typescript
// src/lib/api-utils.ts
const roleHeader = request.headers.get('x-user-role') as UserRole | null;
return {
  id: userIdHeader || 'user_default',
  role: roleHeader || 'admin',  // DEFAULTS TO ADMIN!
  orgId: orgIdHeader || 'org_busala_default',
};
```
**Fix Required**: Remove header auth, use JWT validation only

---

## 🟡 HIGH PRIORITY (Fix Before Beta)

### 4. No Role-Based UI
**Issue**: All users see the same interface regardless of role  
**Impact**: Teachers see "Add Teacher" button, staff sees delete options  
**Fix Required**: Add role checks to UI components

### 5. Single Tenant Only
**Issue**: orgId exists but no way to create/manage organizations  
**Impact**: Can't onboard new schools/customers  
**Fix Required**: Build organization signup and management

### 6. No API Documentation
**Issue**: 274 tests exist but no public API docs  
**Fix Required**: Add Swagger/OpenAPI documentation

---

## 🟢 MEDIUM PRIORITY (Fix Before GA)

### 7. No Frontend Tests
**Issue**: 274 backend tests, 0 frontend component tests  
**Fix Required**: Add Cypress or Playwright E2E tests

### 8. No Error Boundaries
**Issue**: Single React error crashes entire app  
**Fix Required**: Add React error boundaries

### 9. Legacy Mock Data
**Issue**: `src/data/mock-data.ts` still exists, confusing developers  
**Fix Required**: Remove or move to storybook

---

## Summary Table

| Issue | Severity | Effort | File |
|-------|----------|--------|------|
| No Auth | 🔴 Critical | 1 week | `src/lib/api/client.ts` |
| No Landing | 🔴 Critical | 3 days | `src/app/page.tsx` |
| Header Auth | 🔴 Critical | 2 days | `src/lib/api-utils.ts` |
| No RBAC UI | 🟡 High | 1 week | All page components |
| Single Tenant | 🟡 High | 2 weeks | `prisma/schema.prisma` |
| No API Docs | 🟡 High | 3 days | New files |
| No FE Tests | 🟢 Medium | 1 week | New test files |
| No Error Boundaries | 🟢 Medium | 2 days | `src/app/layout.tsx` |
| Legacy Mock Data | 🟢 Medium | 1 day | `src/data/mock-data.ts` |

---

## Recommended Fix Order

```
Week 1:
  1. Implement Auth0 authentication
  2. Remove header-based auth
  3. Add login/logout pages

Week 2:
  4. Create landing page
  5. Add role-based UI guards
  6. Build organization signup

Week 3:
  7. Add API documentation
  8. Add E2E tests
  9. Security audit
```
