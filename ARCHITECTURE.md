# System Architecture & File Dependencies

## Component Dependency Tree

```
App.jsx (Router with AuthProvider)
│
├── AuthProvider (Context)
│   └── AuthContext.jsx
│
├── Route: /login
│   └── Login.jsx
│       └── uses: useAuth()
│           └── calls: login(user, token)
│
├── Route: / (Dashboard)
│   └── ProtectedRoute (adminOnly: false)
│       └── Dashboard.jsx
│           └── uses: useAuth()
│               ├── user data
│               ├── isAdmin()
│               └── logout()
│
├── Route: /orders
│   └── ProtectedRoute (adminOnly: true)
│       └── GetallOrder.jsx
│           └── uses: useAuth()
│               ├── token (for API)
│               └── isAdmin() (for redirect)
│
├── Route: /products
│   └── ProtectedRoute (adminOnly: true)
│       └── Product.jsx
│           └── uses: useAuth()
│               ├── token (for API)
│               └── isAdmin() (for redirect)
│
├── Route: /pincodes
│   └── ProtectedRoute (adminOnly: true)
│       └── Pincode.jsx
│           └── uses: useAuth()
│               ├── token (for API)
│               └── isAdmin() (for redirect)
│
└── Route: * (Catch-all)
    └── NotFound.jsx
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser                                 │
│                                                              │
│  ┌──────────────┐                                           │
│  │  localStorage│                                           │
│  ├──────────────┤                                           │
│  │ - token      │                                           │
│  │ - user       │                                           │
│  │ - email      │                                           │
│  │ - userId     │                                           │
│  └──────────────┘                                           │
│        ↑                                                     │
│        │ (persists)                                         │
│        │                                                     │
│  ┌──────────────────────────┐                              │
│  │   AuthContext            │                              │
│  ├──────────────────────────┤                              │
│  │ - user                   │                              │
│  │ - token                  │                              │
│  │ - isAuthenticated        │                              │
│  │ - loading                │                              │
│  └──────────────────────────┘                              │
│        ↑                                                     │
│        │ (via useAuth hook)                                │
│        │                                                     │
│  ┌──────────────────────────┐                              │
│  │  Components using Auth   │                              │
│  ├──────────────────────────┤                              │
│  │ - Login.jsx              │                              │
│  │ - Dashboard.jsx          │                              │
│  │ - GetallOrder.jsx        │                              │
│  │ - Product.jsx            │                              │
│  │ - Pincode.jsx            │                              │
│  └──────────────────────────┘                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ↓ (API Call with token)
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│                                                              │
│  ┌────────────────────┐                                     │
│  │  /api/auth/...     │ - login, OTP, verify              │
│  ├────────────────────┤                                     │
│  │  /api/orders       │ - requires: Authorization header   │
│  ├────────────────────┤                                     │
│  │  /api/products     │ - requires: Authorization header   │
│  ├────────────────────┤                                     │
│  │  /api/pincodes     │ - requires: Authorization header   │
│  └────────────────────┘                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow Diagram

```
START
  │
  ├─→ Is token in localStorage?
  │   ├─ YES → Restore auth from localStorage → READY
  │   └─ NO → Show LOGIN page
  │
  (User enters email & OTP)
  │
  ├─→ Send OTP & verify via API
  │
  ├─→ Backend returns:
  │   {
  │     token: "JWT...",
  │     user: { _id, email, name, role: "admin"|"user" }
  │   }
  │
  ├─→ Call: AuthContext.login(user, token)
  │   ├─ Set user state
  │   ├─ Set token state
  │   ├─ Set isAuthenticated = true
  │   └─ Save to localStorage
  │
  ├─→ Redirect to Dashboard
  │
  ├─→ User trying to access route?
  │   ├─ /login → Allowed if not authenticated
  │   ├─ / → Check isAuthenticated → Allowed
  │   ├─ /orders → Check isAuthenticated + isAdmin() → Allowed if admins
  │   ├─ /products → Check isAuthenticated + isAdmin() → Allowed if admin
  │   ├─ /pincodes → Check isAuthenticated + isAdmin() → Allowed if admin
  │   └─ * → Show 404 page
  │
  ├─→ User makes API request?
  │   └─ Include header: Authorization: Bearer {token}
  │
  ├─→ User clicks Logout?
  │   ├─ Clear all localStorage
  │   ├─ Reset auth state
  │   ├─ Reset isAuthenticated = false
  │   └─ Redirect to /login
  │
  END
```

## Protected Route Logic

```
User requests protected route
    │
    ├─→ Check: isAuthenticated?
    │   ├─ NO → Redirect to /login with referrer
    │   └─ YES → Continue
    │
    ├─→ Check: adminOnly parameter?
    │   ├─ YES → Check: isAdmin()?
    │   │   ├─ NO → Show "Access Denied" page
    │   │   └─ YES → Render component
    │   │
    │   └─ NO → Continue
    │
    ├─→ Check: requiredRole parameter?
    │   ├─ YES → Check: hasRole(requiredRole)?
    │   │   ├─ NO → Show "Access Denied" page
    │   │   └─ YES → Render component
    │   │
    │   └─ NO → Render component
    │
    └─ END
```

## File Relationships Map

```
src/App.jsx
├── imports: BrowserRouter, Routes, Route, Navigate
├── imports: AuthProvider from context/AuthContext
├── imports: ProtectedRoute from components/ProtectedRoute
├── imports: All page/component files
│
├── App.jsx provides:
│   └── <BrowserRouter>
│       └── <AuthProvider>
│           └── <Routes>
│
src/context/AuthContext.jsx
├── exports: AuthProvider component
├── exports: useAuth hook
├── provides: 
│   ├── user state
│   ├── token state
│   ├── login() function
│   ├── logout() function
│   ├── isAdmin() function
│   └── hasRole() function
│
src/components/ProtectedRoute.jsx
├── imports: useAuth from context/AuthContext
├── imports: Navigate, useLocation from react-router-dom
├── logic:
│   ├── Checks isAuthenticated
│   ├── Checks adminOnly flag
│   ├── Checks requiredRole
│   └── Returns component or access denied
│
src/pages/Dashboard.jsx
├── imports: useAuth, useNavigate
├── displays:
│   ├── User information
│   ├── Role information
│   └── Admin-only links (if admin)
│
src/components/auth/Login.jsx
├── imports: useAuth, useNavigate, useLocation
├── flow:
│   ├── User enters email
│   ├── Sends OTP via API
│   ├── User enters OTP
│   ├── Verifies OTP via API
│   └── Calls login() from useAuth
│
src/components/order/GetallOrder.jsx
src/components/product/Product.jsx
src/components/pincode/Pincode.jsx
├── imports: useAuth, useNavigate
├── logic:
│   ├── Check isAdmin() -> redirect if not
│   ├── Make API calls with token header
│   └── Display results
│
localStorage
├── Stores: token
├── Stores: user (JSON string)
├── Stores: email
├── Stores: userId
└── Persists: auth state across refresh
```

## Role Hierarchy

```
┌─────────────────────────────────┐
│          User Roles             │
├─────────────────────────────────┤
│                                 │
│  Admin (role: 'admin')          │
│  ├─ All routes                  │
│  ├─ All operations              │
│  └─ Full system access          │
│                                 │
│  Manager (role: 'manager')      │
│  ├─ Dashboard                   │
│  ├─ Limited operations          │
│  └─ No admin routes (current)   │
│                                 │
│  User (role: 'user')            │
│  ├─ Dashboard only              │
│  ├─ View-only access            │
│  └─ No admin routes             │
│                                 │
│  Other roles                    │
│  ├─ Dashboard only              │
│  └─ No admin routes             │
│                                 │
└─────────────────────────────────┘

Note: Currently, only "admin" role has full access.
Use requiredRole parameter to add granular access.
```

## API Request Format

```
With Token Authentication:

GET /api/orders
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json

POST /api/products
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
Body:
  { name: "Product 1", ... }

PUT /api/orders/:id/status
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
Body:
  { status: "shipped" }
```

## Error Handling Flow

```
API Request
    │
    ├─→ Success (200-299)
    │   └─ Use response data
    │
    ├─→ Unauthorized (401)
    │   ├─ Token expired or invalid
    │   ├─ Call logout()
    │   └─ Redirect to /login
    │
    ├─→ Forbidden (403)
    │   └─ User lacks permissions
    │
    ├─→ Not Found (404)
    │   └─ Resource not found
    │
    └─→ Server Error (500+)
        └─ Show error message
```

## Summary of Key Files

| File | Purpose | Key Exports/Functions |
|------|---------|----------------------|
| AuthContext.jsx | State management | useAuth, AuthProvider |
| ProtectedRoute.jsx | Route protection | ProtectedRoute component |
| Login.jsx | OTP authentication | Login form |
| Dashboard.jsx | Home page | Dashboard component |
| App.jsx | Main routing | All routes |
| GetallOrder.jsx | Orders admin | List/manage orders |
| Product.jsx | Products admin | List/manage products |
| Pincode.jsx | Pincodes admin | List/manage pincodes |
