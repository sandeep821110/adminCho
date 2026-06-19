# 🔍 Comprehensive Debugging Guide

## 📊 DEBUG MODULE OVERVIEW

A complete debug utility has been added to all files. Located at `src/utils/debug.js`

---

## 🎯 Quick Start - Using Debug Features

### Open Browser Console
```
Press: F12 (or Ctrl+Shift+I on Windows)
Go to: Console tab
```

### View Debug Logs
All components now log their actions automatically:

```
✅ [TIME] [Component] Action description
📡 API request details
❌ Error with full context
🎣 React hooks and lifecycle events
```

---

## 📝 Debug Functions Available

### 1. ℹ️ Info Logs
```javascript
debugInfo(component, action, data)
// Example: debugInfo('Pincode', 'Creating', { pincode: '110001' })
// Output: ℹ️ [TIME] [Pincode] Creating { pincode: "110001" }
```

### 2. ✅ Success Logs
```javascript
debugSuccess(component, action, data)
// Example: debugSuccess('Pincode', 'Created Successfully', res.data)
// Output: ✅ [TIME] [Pincode] Created Successfully {...}
```

### 3. ⚠️ Warning Logs
```javascript
debugWarn(component, action, data)
// Example: debugWarn('GetallOrder', 'Unexpected Format', res.data)
// Output: ⚠️ [TIME] [GetallOrder] Unexpected Format {...}
```

### 4. ❌ Error Logs
```javascript
debugError(component, action, error, context)
// Example: debugError('Product', 'Delete Failed', err, { productId: '123' })
// Output: ❌ [TIME] [Product] Delete Failed
// + Full error details, status code, response data
```

### 5. 📡 API Request
```javascript
debugAPI(method, endpoint, config)
// Example: debugAPI('GET', '/api/orders', { headers: {...} })
// Output: 📡 [API] GET /api/orders { token: 'Bearer ✅', ... }
```

### 6. 📥 API Response
```javascript
debugAPIResponse(method, endpoint, status, data)
// Example: debugAPIResponse('GET', '/api/orders', 200, { orders: [...] })
// Output: 📥 [API] 200 GET /api/orders { ... }
```

### 7. ⏱️ Performance Timer
```javascript
const stopTimer = debugTimer('Component Render')
// ... code to measure ...
stopTimer()
// Output: ⏱️ [PERF] Component Render: 45.23ms
```

### 8. 🔄 State Changes
```javascript
debugState(component, stateName, oldValue, newValue)
// Example: debugState('Pincode', 'pincodes', [], newPincodes)
// Output: 🔄 [STATE] Pincode - pincodes { from: [...], to: [...] }
```

### 9. 📍 Lifecycle Events
```javascript
debugMount(component)      // Component mounted
debugUnmount(component)    // Component unmounted
debugEffect(component, effectName)  // useEffect triggered
debugWarn(component, actionName)     // Warning
```

### 10. 🔐 Authentication Events
```javascript
debugAuth(action, user, status)
// Example: debugAuth('LOGIN', userData, 'Successful')
// Output: 🔐 [AUTH] LOGIN { user: 'email@...', role: 'admin', status: 'Successful' }
```

### 11. 🛣️ Route Navigation
```javascript
debugRoute(from, to, reason)
// Example: debugRoute('/orders', '/login', 'Not authenticated')
// Output: 🛣️ [ROUTE] /orders → /login 'Not authenticated'
```

---

## 🧭 Where Debugging is Implemented

### Components with Full Debugging:
- ✅ `AuthContext.jsx` - Auth state & login/logout
- ✅ `ProtectedRoute.jsx` - Route access control
- ✅ `GetallOrder.jsx` - Order API calls & operations
- ✅ `Product.jsx` - Product API calls & CRUD operations
- ✅ `Pincode.jsx` - Pincode API calls & CRUD operations
- ✅ `App.jsx` - Route initialization

---

## 💡 Example Debug Logs You'll See

### Example 1: Successful Order Fetch
```
📍 [MOUNT] GetallOrder
🎣 [EFFECT] GetallOrder - Initial Load
📡 [API] GET http://localhost:5009/api/admin/orders
📥 [API] 200 GET http://localhost:5009/api/admin/orders { count: 5 }
✅ [TIME] [GetallOrder] Loaded 5 Orders
```

### Example 2: API Error
```
📡 [API] GET http://localhost:5005/api/pincodes
❌ Fetch error: Error: connect ECONNREFUSED 127.0.0.1:5005
Response status: undefined
Error message: connect ECONNREFUSED 127.0.0.1:5005
❌ [TIME] [Pincode] Fetch Failed
```

### Example 3: Authentication Flow
```
🔐 [AUTH] AUTO-RESTORE { user: 'email@...', role: 'admin', status: 'Restored' }
📍 [MOUNT] AuthProvider
📍 [MOUNT] App
✅ [TIME] [AuthContext] Restored from localStorage
```

### Example 4: Access Control
```
🎣 [EFFECT] Pincode - Admin Access Check
📍 Route access check: adminOnly=true
ℹ️ [TIME] [ProtectedRoute] Checking Access admin: true, path: /pincodes
✅ [TIME] [ProtectedRoute] Access Granted /pincodes
```

---

## 🛠️ Advanced Debug Features

### Get Error Log
```javascript
// In browser console:
getErrorLog()
// Returns all stored errors
```

### Clear Error Log
```javascript
// In browser console:
clearErrorLog()
// Removes all stored errors
```

### Print Full Debug Report
```javascript
// In browser console:
printDebugReport()
// Shows:
// - System information
// - All errors in table format
// - Raw error log
```

### Toggle Debug Mode
```javascript
// In browser console:
toggleDebug(true)   // Turn on
toggleDebug(false)  // Turn off
toggleDebug()       // Toggle current state
```

---

## 📊 Debug Console Commands

Copy and paste these in browser console (F12):

### Get all errors
```javascript
console.log(getErrorLog())
```

### Print debug report
```javascript
printDebugReport()
```

### View current user
```javascript
JSON.parse(localStorage.getItem('user'))
```

### View token
```javascript
localStorage.getItem('token')
```

### Check admin status
```javascript
const user = JSON.parse(localStorage.getItem('user'))
user.role === 'admin'
```

### Test API endpoint
```javascript
const token = localStorage.getItem('token')
fetch('http://localhost:5009/api/admin/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('✅ Response:', d))
.catch(e => console.error('❌ Error:', e))
```

---

## 🎯 Debugging Specific Issues

### Issue: "Orders not loading"

**Steps to debug:**

1. Open console (F12)
2. Click "Refresh Orders" button
3. Look for logs with these patterns:

```
📡 [API] GET http://localhost:5009/api/admin/orders
↓
📥 [API] 200/404/500 GET ...
↓
✅ OR ❌ results
```

**Expected Success Flow:**
```
📡 API request sent
✅ Response 200 received
📊 Data parsed correctly
✅ [GetallOrder] Loaded X Orders
```

**Expected Error Flow:**
```
📡 API request sent
❌ Response error (status code shown)
❌ Error logged with:
  - Response data
  - Status code
  - Error message
```

---

### Issue: "Access Denied on /orders"

**Steps to debug:**

1. Check token exists:
```javascript
const token = localStorage.getItem('token')
console.log('Token exists:', !!token)
```

2. Check user role:
```javascript
const user = JSON.parse(localStorage.getItem('user'))
console.log('User role:', user?.role)
console.log('Is admin:', user?.role === 'admin')
```

3. Check console logs:
```
✅ [AUTH] AUTO-RESTORE { role: 'admin' }
❌ OR
❌ [AUTH] NOT RESTORED (check localStorage)
```

---

### Issue: "Products create/delete not working"

**Steps to debug:**

1. Open console (F12)
2. Try creating/deleting
3. Look for sequence:

```
📡 [API] POST http://localhost:5000/api/products
📥 [API] 200 POST ...
✅ [Product] Created Successfully
```

**If it fails:**
```
📡 [API] POST ...
❌ Error with details:
  - Status: 404/500/401
  - Error message
  - Response data (if any)
```

---

## 🧪 Testing with Debug Information

### 1. Test Authentication
- Login with OTP
- Check console for: `🔐 [AUTH] LOGIN`
- Verify localStorage shows token and user

### 2. Test Route Protection
- Try accessing /orders without login
- Should see: `🛣️ [ROUTE] ... → /login`
- Should redirect to login page

### 3. Test Admin Access
- Login as non-admin user
- Try accessing /orders
- Should see: `❌ [ProtectedRoute] Admin Only Access Denied`
- Should show Access Denied page

### 4. Test API Calls
- Click refresh on any management page
- Check console for API logs
- Look for either success (✅, 📊) or error (❌) sequence

### 5. Test Performance
- Check how long operations take
- Look for ⏱️ [PERF] logs
- Should be under 500ms for most operations

---

## 📋 Debug Configuration

Debug utility settings (in `src/utils/debug.js`):

```javascript
const DEBUG_CONFIG = {
    enabled: true,              // Set to false to disable all logs
    logLevel: 'info',          // 'error', 'warn', 'info', 'debug'
    timestamp: true,           // Show timestamps
    storeErrors: true,         // Store errors for later review
    maxErrors: 50              // Maximum errors to store
}
```

---

## 🎨 Console Log Colors

| Emoji | Color | Meaning |
|-------|-------|---------|
| ✅ | Green | Success |
| ❌ | Red | Error |
| ⚠️ | Yellow | Warning |
| ℹ️ | Blue | Information |
| 📡 | Purple | API Request |
| 📥 | Purple | API Response |
| ⏱️ | Red | Performance |
| 🔄 | Indigo | State Change |
| 📍 | Cyan | Lifecycle |
| 🔐 | Pink | Authentication |
| 🛣️ | Green | Navigation |

---

## 🚀 Quick Debug Checklist

When investigating issues, check in this order:

- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for error emoji (❌)
- [ ] Check error message detail
- [ ] Check API status code (200, 404, 500, 401)
- [ ] Verify token exists
- [ ] Check user role
- [ ] Review full error log with `getErrorLog()`
- [ ] Print report with `printDebugReport()`
- [ ] Check Network tab for API calls
- [ ] Verify backend service is running

---

## 📞 Sharing Debug Information

When reporting issues, share:

1. Screenshot of console errors
2. Output of `getErrorLog()`
3. Output of `printDebugReport()`
4. Network tab screenshots
5. Steps to reproduce

### Export errors for sharing:
```javascript
copy(getErrorLog())  // Copy to clipboard
```

---

## ✅ What's Being Debugged

### Authentication & Auth Flow
- ✅ Login attempts and success
- ✅ Token storage and restoration
- ✅ Role checking
- ✅ Admin access verification

### Routes & Navigation
- ✅ Route access checks
- ✅ Admin-only route enforcement
- ✅ Role-based access
- ✅ Redirects and guards

### API Calls
- ✅ Request headers (Bearer token)
- ✅ Response status codes
- ✅ Response data format
- ✅ Error details

### Component Lifecycle
- ✅ Mount/Unmount events
- ✅ useEffect triggers
- ✅ State changes
- ✅ Props updates

### Error Handling
- ✅ Exception catching
- ✅ Error context
- ✅ Error storage
- ✅ Error reporting

---

## 🎓 Learning From Debug Logs

### Understand API Flow
1. Logs show exact request/response cycle
2. Learn what backends expect
3. See data transformations
4. Understand error patterns

### Identify Performance Issues
1. Use ⏱️ timers
2. Find slow operations
3. Optimize based on data

### Debug Complex Flows
1. Follow emoji sequence
2. See exact order of operations
3. Identify where things fail
4. Understand dependencies

---

## 🔧 Enabling/Disabling Debug Mode

### Disable all logs (if chatty)
```javascript
toggleDebug(false)
```

### Re-enable logs
```javascript
toggleDebug(true)
```

### Check current status
```javascript
toggleDebug()  // Shows current state
```

---

**All files are now instrumented with comprehensive debugging!**

Open the browser console (F12) and watch the detailed logs as you navigate and interact with the application. 🎉

