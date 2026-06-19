# Quick Reference: Adding Protected Routes & Components

## How to Add a New Admin-Only Route

### Step 1: Create Your Component
```jsx
// src/components/reports/Reports.jsx
import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Reports = () => {
    const { isAdmin, token } = useAuth()
    const navigate = useNavigate()

    // Ensure admin access
    useEffect(() => {
        if (!isAdmin()) {
            navigate('/')
        }
    }, [isAdmin, navigate])

    return (
        <div className="p-6">
            <h1>Reports</h1>
            {/* Your component content */}
        </div>
    )
}

export default Reports
```

### Step 2: Add Route in App.jsx
```jsx
import Reports from './components/reports/Reports'

// Inside Routes component:
<Route 
  path="/reports" 
  element={
    <ProtectedRoute adminOnly={true}>
      <Reports />
    </ProtectedRoute>
  } 
/>
```

## How to Add a Role-Specific Route

### Step 1: Create Component with Role Check
```jsx
const ManagerPanel = () => {
    const { hasRole } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!hasRole('manager')) {
            navigate('/')
        }
    }, [hasRole, navigate])

    return <div>Manager only content</div>
}
```

### Step 2: Add Route with Role Requirement
```jsx
<Route 
  path="/manager-panel" 
  element={
    <ProtectedRoute requiredRole="manager">
      <ManagerPanel />
    </ProtectedRoute>
  } 
/>
```

## How to Use Auth in Components

### Get Auth Data
```jsx
import { useAuth } from '../context/AuthContext'

function MyComponent() {
    const { user, token, isAdmin, hasRole, logout } = useAuth()

    // Use in component
    if (isAdmin()) {
        // Show admin features
    }

    // Make API call with token
    const fetchData = async () => {
        const res = await axios.get('/api/data', {
            headers: { Authorization: `Bearer ${token}` }
        })
    }

    // Logout
    const handleLogout = () => {
        logout()
        navigate('/login')
    }
}
```

## Authorization Header Format (For API Calls)
```jsx
headers: { 
    Authorization: `Bearer ${token}` 
}
```

## User Object Structure
```js
user = {
    _id: "string",
    email: "string",
    name: "string",
    role: "admin" | "manager" | "user" | "other"
}
```

## Testing Authentication

### Test Admin Access
```jsx
// Mock admin user
const mockAdmin = {
    _id: "123",
    email: "admin@test.com",
    name: "Admin User",
    role: "admin"
}

// Login
const { login } = useAuth()
login(mockAdmin, "mock-token")

// Navigate to admin route
navigate('/orders') // Should work
```

### Test Regular User Access
```jsx
const mockUser = {
    _id: "456",
    email: "user@test.com",
    name: "Regular User",
    role: "user"
}

login(mockUser, "mock-token")
navigate('/orders') // Should redirect to /
```

## Common Patterns

### Pattern 1: Conditional Rendering Based on Role
```jsx
{isAdmin() && (
    <button onClick={deleteItem}>Delete</button>
)}

{hasRole('manager') && (
    <button onClick={approveRequest}>Approve</button>
)}
```

### Pattern 2: API Call with Authentication
```jsx
const fetchSecureData = async () => {
    try {
        const response = await axios.get('/api/secure-endpoint', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setData(response.data)
    } catch (error) {
        if (error.response?.status === 401) {
            logout() // Token expired
            navigate('/login')
        }
    }
}
```

### Pattern 3: Redirect After Login
```jsx
const navigate = useNavigate()
const location = useLocation()

// After successful login:
const dest = location.state?.from || "/"
navigate(dest)
```

### Pattern 4: Protected Button Component
```jsx
function AdminButton({ onClick, children }) {
    const { isAdmin } = useAuth()
    
    if (!isAdmin()) return null
    
    return <button onClick={onClick}>{children}</button>
}
```

## Debugging Auth Issues

### Check Current Auth State
```jsx
const { user, token, isAuthenticated, isAdmin } = useAuth()
console.log({ user, token, isAuthenticated, isAdmin })
```

### Check localStorage
```js
// In browser console:
localStorage.getItem('token')
localStorage.getItem('user')
JSON.parse(localStorage.getItem('user'))
```

### Verify Token Format
```js
// Token should start with "eyJ"
console.log(token.substring(0, 3))
```

### Check Role Value
```js
const { user } = useAuth()
console.log('User role:', user?.role)
// Should output: admin, manager, user, etc.
```

## Role Comparison Logic
```jsx
// Admin always has access
if (user?.role === 'admin') return true

// Case-insensitive comparison
if (user?.role?.toLowerCase() === requiredRole?.toLowerCase()) return true

// Multiple roles
if (['admin', 'manager'].includes(user?.role)) return true
```

## Next Steps for Enhancement

1. **Add More Routes**: Follow the pattern above
2. **Add Role Hierarchy**: Create roles with inheritance
3. **Implement Permission System**: Store granular permissions on backend
4. **Add Token Refresh**: Handle token expiration
5. **Add Audit Logging**: Track user actions

## Useful Resources

- AuthContext: `src/context/AuthContext.jsx`
- ProtectedRoute: `src/components/ProtectedRoute.jsx`
- Full Guide: `AUTHENTICATION_GUIDE.md`
- App Routes: `src/App.jsx`
