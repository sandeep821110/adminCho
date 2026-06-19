# Role-Based Authentication System Implementation

## Overview
This document explains the complete role-based authentication system implemented in your admin dashboard application.

## Architecture

### 1. **Authentication Context** (`src/context/AuthContext.jsx`)
- Manages global authentication state
- Provides `useAuth()` hook for accessing auth data
- Stores user info, token, and authentication status
- Persists data to localStorage

#### Key Functions:
- `login(userData, token)` - Authenticates user
- `logout()` - Clears authentication
- `isAdmin()` - Checks if user is admin
- `hasRole(requiredRole)` - Checks role-based access

### 2. **Protected Route Component** (`src/components/ProtectedRoute.jsx`)
- Wraps routes that require authentication
- Enforces role-based access control
- Redirects unauthenticated users to login
- Shows access denied message for insufficient permissions

#### Features:
- **adminOnly**: Restricts route to admin users only
- **requiredRole**: Restricts route to specific roles
- **Admin Override**: Admins have access to all routes

### 3. **Login Component** (`src/components/auth/Login.jsx`)
- OTP-based authentication
- Integrates with AuthContext
- Stores user data including role

### 4. **Protected Components**

#### **Dashboard** (`src/pages/Dashboard.jsx`)
- Home page for authenticated users
- Shows user info and role
- Displays admin-only controls based on role
- Logout functionality

#### **Orders Management** (`src/components/order/GetallOrder.jsx`)
- Admin-only access
- CRUD operations on orders
- Authentication token included in all API calls

#### **Products Management** (`src/components/product/Product.jsx`)
- Admin-only access
- Product create/read/delete operations
- Authenticated API requests

#### **Pincodes Management** (`src/components/pincode/Pincode.jsx`)
- Admin-only access
- Pincode management operations
- Token-based API authentication

## File Structure

```
src/
├── context/
│   └── AuthContext.jsx          # Auth state management
├── components/
│   ├── ProtectedRoute.jsx        # Route protection component
│   ├── auth/
│   │   └── Login.jsx             # Login (OTP-based)
│   ├── order/
│   │   └── GetallOrder.jsx       # Orders management
│   ├── product/
│   │   └── Product.jsx           # Products management
│   └── pincode/
│       └── Pincode.jsx           # Pincodes management
├── pages/
│   ├── Dashboard.jsx             # Home page
│   └── NotFound.jsx              # 404 page
└── App.jsx                       # Main app with routing
```

## Route Configuration

### Public Routes
- `/login` - Login page (accessible to all)

### Protected Routes
- `/` - Dashboard (authentication required)

### Admin-Only Routes
- `/orders` - Orders management
- `/products` - Products management
- `/pincodes` - Pincodes management

## How It Works

### 1. **User Login**
1. User enters email and receives OTP
2. User enters OTP for verification
3. Backend returns user data with role (`user.role`)
4. AuthContext `login()` is called with user data and token
5. Data persists to localStorage
6. User is redirected to dashboard

### 2. **Route Protection**
```jsx
<Route 
  path="/products" 
  element={
    <ProtectedRoute adminOnly={true}>
      <Product />
    </ProtectedRoute>
  } 
/>
```

### 3. **Component Authentication Check**
```jsx
useEffect(() => {
    if (!isAdmin()) {
        navigate('/') // Redirect if not admin
    }
}, [isAdmin, navigate])
```

### 4. **API Requests with Token**
```jsx
const res = await axios.get('http://localhost:5000/api/orders', {
    headers: { Authorization: `Bearer ${token}` }
})
```

## Authentication Flow Diagram

```
User
  ↓
[Login Page] → Email → Send OTP
  ↓
[OTP Input] → Verify OTP → Backend
  ↓
Backend returns: { user: {name, email, role}, token }
  ↓
AuthContext.login() → Store in localStorage
  ↓
Redirect to Dashboard
  ↓
Check Route Protection:
  - If admin route → user.role === 'admin' ✓
  - If protected route → Check token ✓
  - If public route → Allow access ✓
```

## Role-Based Access Control

### Admin Role
- ✓ Access to all routes
- ✓ Full admin panel
- ✓ Can manage orders, products, pincodes

### Other Roles
- ✓ Access to dashboard
- ✗ Cannot access `/orders`
- ✗ Cannot access `/products`
- ✗ Cannot access `/pincodes`
- ✓ See limited dashboard view

## Usage Examples

### Using useAuth Hook
```jsx
import { useAuth } from '../context/AuthContext'

function MyComponent() {
    const { user, isAdmin, logout, hasRole } = useAuth()
    
    // Check if admin
    if (isAdmin()) {
        // Show admin features
    }
    
    // Check specific role
    if (hasRole('manager')) {
        // Show manager features
    }
    
    // Get user data
    console.log(user.name, user.email, user.role)
}
```

### Protecting Routes
```jsx
<Route 
  path="/admin"
  element={
    <ProtectedRoute adminOnly={true}>
      <AdminPanel />
    </ProtectedRoute>
  }
/>

// Or with specific role
<Route 
  path="/manager"
  element={
    <ProtectedRoute requiredRole="manager">
      <ManagerPanel />
    </ProtectedRoute>
  }
/>
```

## Security Features

1. **Token-Based Authentication**
   - JWT tokens stored in localStorage
   - Included in all API requests

2. **Route Protection**
   - Unauthenticated users redirected to login
   - Route-level and component-level checks

3. **Role-Based Access Control**
   - Admin role has full access
   - Other roles have limited access
   - Access checks enforce role restrictions

4. **Secure Logout**
   - Clears all stored data
   - Removes token from requests
   - Redirects to login page

## Potential Enhancements

1. **Token Refresh**
   - Implement token refresh mechanism
   - Handle token expiration

2. **Role Hierarchy**
   - Create role definitions (admin, manager, user)
   - Implement role inheritance

3. **Permission System**
   - Add granular permissions
   - Separate roles and permissions

4. **Audit Logging**
   - Log user actions
   - Track access attempts

5. **Two-Factor Authentication**
   - Enhance security with 2FA
   - Additional verification method

## Backend Requirements

Backend API should:
1. Return `user` object with `role` field on login
2. Include JWT `token` in response
3. Accept `Authorization: Bearer {token}` header
4. Validate token on protected endpoints
5. Return role information in user object

Example Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "123456",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## Troubleshooting

### Issue: User redirected to login after page refresh
**Solution**: Check localStorage for token and user data. AuthContext initializes from localStorage on mount.

### Issue: Admin features not appearing
**Solution**: Verify backend returns `role: "admin"` in user object. Check useAuth().isAdmin() returns true.

### Issue: Token not sent to API
**Solution**: Ensure axios includes Authorization header with token from useAuth().token

## Testing

1. **Admin User**
   - Login with admin account
   - Verify all routes accessible
   - Check admin panel displays

2. **Regular User**
   - Login with regular account
   - Verify dashboard accessible
   - Verify admin routes blocked
   - Check access denied message

3. **Unauthenticated**
   - Try accessing protected route
   - Verify redirected to login

4. **Token Expiration**
   - Logout and verify token cleared
   - Try accessing routes
   - Verify redirect to login
