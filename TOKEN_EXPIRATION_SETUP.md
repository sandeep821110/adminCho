# Token Expiration & Authentication Flow Guide

## Overview
This implementation ensures proper token lifecycle management with automatic expiration detection, data cleanup, and user redirection to the login page.

## What Was Implemented

### 1. **Token Utilities** (`src/utils/tokenUtils.js`)
Creates JWT token utilities for managing token lifecycle:

- **`decodeToken(token)`** - Decodes JWT token payload (client-side only, no verification)
- **`isTokenExpired(token)`** - Checks if token is expired by comparing `exp` claim with current time
- **`getTokenTimeRemaining(token)`** - Returns remaining time in seconds before token expiration
- **`clearAllAuthData()`** - Clears all authentication data from localStorage:
  - `token`
  - `user`
  - `email`
  - `userId`
  - `otp_verify_response`

### 2. **Redux Auth Slice Updates** (`src/store/slices/authSlice.js`)
Added new reducers for token expiration handling:

```javascript
// Handle token expiration - clears all data and sets error
handleTokenExpired: (state) => {
    clearAllAuthData()
    state.user = null
    state.token = null
    state.isAuthenticated = false
    state.error = 'Token expired. Please login again'
}

// Clear all auth data reducer
clearAllAuthData: (state) => {
    clearAllAuthData()
    state.user = null
    state.token = null
    state.isAuthenticated = false
}
```

### 3. **Auth Context Enhancements** (`src/context/AuthContext.jsx`)

#### On App Load:
- **Checks token expiration** before restoring from localStorage
- **Automatically clears data** if token is expired
- **Redirects user flow** (handled in ProtectedRoute)

#### New Methods:
```javascript
// Validate token - returns true if valid, false and clears if expired
validateToken(tokenToValidate = token) 

// Handle token expiration - clears all auth state
handleTokenExpired()

// Check token expiration without validation
isTokenExpired(tokenToCheck)

// Get remaining time before expiration
getTokenTimeRemaining(tokenToCheck)
```

#### Periodic Validation:
- Background interval (every 60 seconds) checks if token has expired
- Automatically logs out user if token expires during session

#### Exported in Context Value:
```javascript
{
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    isAdmin,
    hasRole,
    validateToken,      // NEW
    handleTokenExpired, // NEW
    isTokenExpired,     // NEW
    getTokenTimeRemaining // NEW
}
```

### 4. **Protected Route Updates** (`src/components/ProtectedRoute.jsx`)

#### Token Expiration Check:
```javascript
// Check if token is expired
if (isAuthenticated && isTokenExpired()) {
    return <Navigate to="/login" state={{ from: location.pathname, expired: true }} replace />
}
```

#### Validation on Route Access:
- Validates token every time user navigates to protected route
- Automatically clears data if expired
- Redirects to login immediately

### 5. **Login Page Enhancement** (`src/components/auth/Login.jsx`)

#### Shows Session Expiration Message:
```javascript
useEffect(() => {
    if (location.state?.expired) {
        setTokenExpiredMessage('Your session has expired. Please login again.')
    }
}, [location.state])
```

Displays orange warning banner when redirected due to token expiration.

---

## Flow Diagrams

### On App Load:
```
App Loads
    ↓
AuthContext initializes
    ↓
Retrieves token from localStorage
    ↓
Checks: isTokenExpired(token)?
    ├─ YES → Clear ALL data → User status: Not authenticated
    └─ NO → Restore user state → User status: Authenticated
```

### On Route Access (Protected Routes):
```
User navigates to /orders, /products, etc.
    ↓
ProtectedRoute component loads
    ↓
Validates token: validateToken()
    ├─ EXPIRED → Clear all data → Redirect to /login with expired=true
    └─ VALID → Check permissions → Render protected content
```

### Token Expiration During Session:
```
User is logged in and browsing
    ↓
Background interval checks token (every 60 seconds)
    ↓
Is token expired?
    ├─ YES → handleTokenExpired() → Clear all data → Next route access redirects to login
    └─ NO → Continue session
```

### On Logout:
```
User clicks logout
    ↓
logout() called
    ↓
clearAllAuthData() clears localStorage
    ↓
Auth state cleared
    ↓
Auto-redirect to login (optional - implement in Navbar if needed)
```

---

## Key Features

✅ **Automatic Expiration Detection**
- Token expiration checked on app load
- Checked on every protected route access
- Checked periodically (every 60 seconds) during session

✅ **Complete Data Cleanup**
- All localStorage data removed when token expires
- Includes user, email, userId, OTP response, etc.

✅ **User Feedback**
- Orange warning banner on login page when session expires
- Debug logs for monitoring token state

✅ **Seamless Redirect Flow**
- Users automatically redirected to login when token expires
- Current location preserved in state (can redirect back after re-login)

✅ **No Manual Checks Needed**
- Token validation is automatic in ProtectedRoute
- Background periodic checks catch long-session expirations

---

## Usage Examples

### In Components - Check Token Status:
```javascript
const { isTokenExpired, getTokenTimeRemaining } = useAuth()

// Check if token is expired
if (isTokenExpired()) {
    console.log('Token has expired')
}

// Get remaining time (in seconds)
const remaining = getTokenTimeRemaining()
console.log(`Token expires in ${remaining} seconds`) // ~1800 for 30 min token
```

### In Components - Manual Validation:
```javascript
const { validateToken, handleTokenExpired } = useAuth()

// Validate before API call
if (!validateToken()) {
    // Token expired - automatically cleared
    // User will be redirected on next route access
}
```

### In Axios Interceptor (Optional Enhancement):
```javascript
// Add to axios interceptor for API calls
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Backend says token invalid/expired
            handleTokenExpired()
            navigate('/login')
        }
        return Promise.reject(error)
    }
)
```

---

## Testing Token Expiration

### Manual Test:
1. Create token with short expiration (e.g., 1 minute in backend)
2. Login successfully
3. Wait for expiration
4. Try accessing `/orders` or other protected route
5. Should redirect to login with "session expired" message
6. localStorage should be cleared

### Check Browser DevTools:
```javascript
// In console
localStorage.getItem('token')           // Should be null after expiration
localStorage.getItem('user')            // Should be null after expiration
localStorage.getItem('userId')          // Should be null after expiration
```

---

## Environment Setup

Token expiration is determined by backend JWT's `exp` claim. Example token payload:
```json
{
  "userId": "6548f2d8...",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1699500000,
  "exp": 1699586400
}
```

The `exp` is Unix timestamp in seconds. Token valid until that time.

---

## Important Notes

⚠️ **Client-Side Only**
- Token decoding is client-side (no security risk)
- Backend token is never exposed
- Only `exp` claim is used for expiration check

⚠️ **Debug Mode**
- All token operations are logged in console
- Check "Auth" section in debug logs
- Helpful for troubleshooting session issues

⚠️ **Refresh Token (Optional)**
- Current implementation: token expires → user must re-login
- For better UX: implement refresh token mechanism in backend
- When: backend returns 401, frontend requests new token using refresh token

---

## Files Modified

1. ✨ **NEW**: `src/utils/tokenUtils.js` - Token validation utilities
2. 📝 `src/store/slices/authSlice.js` - Added expiration handlers
3. 📝 `src/context/AuthContext.jsx` - Enhanced with token validation
4. 📝 `src/components/ProtectedRoute.jsx` - Token expiration checks
5. 📝 `src/components/auth/Login.jsx` - Session expiration messaging

