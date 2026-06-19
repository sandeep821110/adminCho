# 🎯 Debug Commands Quick Reference

## 🚀 Copy & Paste Console Commands

Open DevTools (F12) → Console tab → Copy these commands:

---

## 📊 VIEW ERROR LOG

```javascript
getErrorLog()
```
**Shows:** All stored errors with timestamps and details

---

## 🧹 CLEAR ERROR LOG

```javascript
clearErrorLog()
```
**Shows:** "🧹 Error log cleared"

---

## 📋 PRINT FULL DEBUG REPORT

```javascript
printDebugReport()
```
**Shows:** 
- System info
- Error table
- Raw error details

---

## 🔧 TOGGLE DEBUG MODE

```javascript
// Turn OFF (disable all logs)
toggleDebug(false)

// Turn ON (enable all logs)
toggleDebug(true)

// Toggle current state
toggleDebug()
```

---

## 🔐 CHECK AUTHENTICATION

```javascript
// View stored user data
JSON.parse(localStorage.getItem('user'))

// View token
localStorage.getItem('token')

// Check if admin
JSON.parse(localStorage.getItem('user')).role === 'admin'

// Get all auth storage
localStorage
```

---

## 🧪 TEST API ENDPOINTS

### Test Orders API
```javascript
const token = localStorage.getItem('token')
fetch('http://localhost:5009/api/admin/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('✅ Orders:', d))
.catch(e => console.error('❌ Error:', e))
```

### Test Products API
```javascript
const token = localStorage.getItem('token')
fetch('http://localhost:5000/api/products', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('✅ Products:', d))
.catch(e => console.error('❌ Error:', e))
```

### Test Pincodes API
```javascript
const token = localStorage.getItem('token')
fetch('http://localhost:5005/api/pincodes', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('✅ Pincodes:', d))
.catch(e => console.error('❌ Error:', e))
```

---

## 🔍 DEBUG SPECIFIC ISSUES

### Find all errors related to "Orders"
```javascript
getErrorLog().filter(e => e.component === 'GetallOrder')
```

### Find all errors related to "Product"
```javascript
getErrorLog().filter(e => e.component === 'Product')
```

### Find all API errors with status 401
```javascript
getErrorLog().filter(e => e.errorDetails?.status === 401)
```

### Find all errors from a specific time
```javascript
getErrorLog().filter(e => 
  new Date(e.timestamp).getTime() > Date.now() - 60000  // Last 60 seconds
)
```

---

## 📊 INSPECT SPECIFIC ERRORS

```javascript
// Get the most recent error
getErrorLog()[getErrorLog().length - 1]

// Get error #5 (if it exists)
getErrorLog()[4]

// Get error by component
getErrorLog().find(e => e.component === 'Pincode')

// Get all error messages
getErrorLog().map(e => e.error)
```

---

## 🧪 SIMULATE SCENARIOS

### Simulate logout (check localStorage cleanup)
```javascript
localStorage.clear()
console.log('Cleared localStorage')
```

### Simulate token expiry
```javascript
localStorage.removeItem('token')
console.log('Token removed - will redirect to login on next action')
```

### Test route with manual redirect
```javascript
window.location.href = '/orders'  // Will test route protection
```

### Check localStorage size
```javascript
console.log('LocalStorage size:', 
  JSON.stringify(localStorage).length / 1024 + ' KB'
)
```

---

## 📱 RESPONSIVE DEBUGGING

### Check current breakpoint
```javascript
const width = window.innerWidth
console.log(`📱 Width: ${width}px (${
  width < 640 ? 'mobile' : 
  width < 1024 ? 'tablet' : 
  'desktop'
})`)
```

### Test responsive behavior
```javascript
// Add listener for window resize
window.addEventListener('resize', () => {
  console.log(`📱 [RESPONSIVE] ${window.innerWidth}px`)
})
```

---

## 🔍 NETWORK DEBUGGING

### View all network requests
```
DevTools → Network tab → Reload page (F5)
Look for requests to:
- localhost:5009 (Orders)
- localhost:5000 (Products)
- localhost:5005 (Pincodes)
```

### Filter by failed requests
```
Network tab → Filter red status codes
Check for 404, 500, 401, 403 errors
```

### Check request headers
```
Click request → Headers tab
Look for: Authorization: Bearer ...
```

### Check response data
```
Click request → Response tab
See what backend returned
```

---

## ⏱️ PERFORMANCE DEBUGGING

### Check page load time
```javascript
console.log('Page load time:', 
  performance.timing.loadEventEnd - performance.timing.navigationStart + 'ms'
)
```

### Monitor API response times
```javascript
// Will show in console logs with ⏱️ emoji
// Look for: ⏱️ [PERF] Operation: XXXms
```

### Find slow operations
```javascript
getErrorLog()
  .filter(e => e.component === 'FunctionName')
  .map(e => e.timestamp)
```

---

## 📝 LOG EXAMPLES

### What you'll see when logging in:
```
🔐 [AUTH] LOGIN { user: 'email@...', role: 'admin', status: 'Successful' }
✅ [AUTH] Login Success { email: 'email@...', role: 'admin' }
```

### What you'll see fetching orders:
```
📡 [API] GET http://localhost:5009/api/admin/orders
📥 [API] 200 GET http://localhost:5009/api/admin/orders { count: 5 }
✅ [GetallOrder] Loaded 5 Orders
```

### What you'll see on error:
```
📡 [API] GET http://localhost:5005/api/pincodes
❌ [API response] 500 error or connection refused
❌ [Pincode] Fetch Failed
```

---

## 🆘 TROUBLESHOOTING WITH DEBUG INFO

### Problem: "I can't see any logs"
**Solution:**
```javascript
// Check if debugging is enabled
toggleDebug()  // Should show current state

// If disabled, enable it
toggleDebug(true)
```

### Problem: "Too many logs, can't read"
**Solution:**
```javascript
// Disable debug mode
toggleDebug(false)

// Clear error log
clearErrorLog()

// Reload page
location.reload()

// Enable again
toggleDebug(true)
```

### Problem: "Need to find a specific error"
**Solution:**
```javascript
// Search by component
getErrorLog().filter(e => 
  e.component.includes('Order')
)

// Search by error type
getErrorLog().filter(e => 
  e.error.includes('401') || e.error.includes('Unauthorized')
)
```

---

## 🎯 DEBUGGING WORKFLOW

### Step 1: Reproduce Issue
```
1. Do action that causes problem
2. Watch DevTools console for logs
3. Look for ❌ red error indicators
```

### Step 2: Gather Information
```javascript
// Get all recent errors
getErrorLog().slice(-10)

// Get error details
getErrorLog()[getErrorLog().length - 1]
```

### Step 3: Analyze Error
```
Look for:
- Component name
- Action that failed
- Error message
- HTTP status code
- Response data
```

### Step 4: Check Prerequisites
```javascript
// Is user logged in?
localStorage.getItem('token')

// Is user admin?
JSON.parse(localStorage.getItem('user')).role

// Is backend running?
fetch('http://localhost:XXXX').catch(e => console.log(e))
```

### Step 5: Generate Report
```javascript
// Share this info with developer
printDebugReport()
copy(getErrorLog())
```

---

## 🔧 ADVANCED QUERIES

### Find all 401 errors (auth failures)
```javascript
getErrorLog()
  .filter(e => e.errorDetails?.status === 401)
  .map(e => ({ time: e.timestamp, error: e.error }))
```

### Find all network errors
```javascript
getErrorLog()
  .filter(e => e.error.includes('ECONNREFUSED'))
  .map(e => ({ component: e.component, endpoint: e.context.endpoint }))
```

### Find slowest operations
```javascript
getErrorLog()
  .filter(e => e.timestamp)
  .slice(-20)
  .map(e => ({
    component: e.component,
    time: e.timestamp,
    action: e.action
  }))
```

### Group errors by component
```javascript
getErrorLog()
  .reduce((acc, e) => {
    acc[e.component] = (acc[e.component] || 0) + 1
    return acc
  }, {})
```

---

## 📋 CHECKLIST FOR DEBUGGING

- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Check for red ❌ errors
- [ ] Identify the component name
- [ ] Check API status code
- [ ] Verify token exists
- [ ] Check user role (admin?)
- [ ] Review error details
- [ ] Run `printDebugReport()`
- [ ] Check Network tab
- [ ] Verify backend running
- [ ] Share logs if needed

---

## 🎓 Common Debug Scenarios

### Scenario: "Orders not loading"
```javascript
// 1. Check API endpoint
const token = localStorage.getItem('token')
fetch('http://localhost:5009/api/admin/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d))

// 2. Check logs
getErrorLog().filter(e => e.component === 'GetallOrder')

// 3. Get report
printDebugReport()
```

### Scenario: "Access Denied on /orders"
```javascript
// 1. Check token
localStorage.getItem('token')

// 2. Check role
JSON.parse(localStorage.getItem('user')).role

// 3. Check logs
getErrorLog().filter(e => e.component === 'ProtectedRoute')
```

### Scenario: "Delete button not working"
```javascript
// 1. Check for errors
getErrorLog().filter(e => e.action.includes('Delete'))

// 2. Check API
getErrorLog().filter(e => e.errorDetails?.status)

// 3. Check token
localStorage.getItem('token')
```

---

**🚀 Use these commands to debug and troubleshoot your application!**

Copy any command and paste in browser console (F12 → Console tab)

