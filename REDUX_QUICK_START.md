# Redux Implementation - Quick Start

## Setup Complete ✅

Redux Toolkit has been successfully configured! Here's what was added:

## Package Installed
```bash
npm install react-redux
```

## Files Created

### Store Configuration
- ✅ `src/store/index.js` - Main store with all slices combined
- ✅ `src/store/slices/authSlice.js` - Auth state & actions
- ✅ `src/store/slices/productsSlice.js` - Products state & actions  
- ✅ `src/store/slices/pincodesSlice.js` - Pincodes state & actions
- ✅ `src/store/slices/ordersSlice.js` - Orders state & actions

### Hooks & Components
- ✅ `src/hooks/useRedux.js` - Custom Redux hooks for easy access
- ✅ `src/components/product/ProductRedux.jsx` - Redux integrated example
- ✅ `src/main.jsx` - Updated with Redux Provider

### Documentation
- ✅ `REDUX_SETUP.md` - Complete guide

## How to Use in Your Components

### Example 1: Using Products (Redux Way)

**Before (Context API):**
```javascript
const Product = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const res = await axios.get(endpoint)
            setProducts(res.data)
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }
}
```

**After (Redux):**
```javascript
import { useProducts } from '../../hooks/useRedux'
import { fetchProducts, createProduct, deleteProduct } from '../../store/slices/productsSlice'

const Product = () => {
    const { dispatch, products, isLoading, error, success } = useProducts()

    useEffect(() => {
        dispatch(fetchProducts()) // That's it!
    }, [dispatch])

    const handleCreate = (formData) => {
        dispatch(createProduct(formData))
    }

    const handleDelete = (id) => {
        dispatch(deleteProduct(id))
    }
}
```

### Example 2: Using Pincodes

```javascript
import { usePincodes } from '../../hooks/useRedux'
import { fetchPincodes, createPincode, deletePincode, clearSuccess } from '../../store/slices/pincodesSlice'

const Pincode = () => {
    const { dispatch, pincodes, isLoading, error, success } = usePincodes()

    useEffect(() => {
        dispatch(fetchPincodes())
    }, [dispatch])

    useEffect(() => {
        if (success) {
            setTimeout(() => dispatch(clearSuccess()), 3000)
        }
    }, [success, dispatch])

    const handleAdd = (pincodeData) => {
        dispatch(createPincode(pincodeData))
    }

    const handleDelete = (pincode) => {
        dispatch(deletePincode(pincode))
    }

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            {isLoading && <div>Loading...</div>}
            {/* Rest of component */}
        </div>
    )
}
```

### Example 3: Authentication

```javascript
import { useAuth } from '../../hooks/useRedux'
import { loginUser, logoutUser } from '../../store/slices/authSlice'

const Login = () => {
    const { dispatch, isAuthenticated, isLoading, error, user } = useAuth()

    const handleLogin = async (credentials) => {
        const result = await dispatch(loginUser(credentials))
        if (result.payload) {
            // Login successful
            navigate('/dashboard')
        }
    }

    const handleLogout = () => {
        dispatch(logoutUser())
    }

    return (
        <div>
            {error && <p>{error}</p>}
            {isLoading && <p>Logging in...</p>}
            {isAuthenticated && <p>Welcome {user.name}</p>}
        </div>
    )
}
```

## Converting Your Existing Components

### Step 1: Import Redux
```javascript
import { useProducts } from '../../hooks/useRedux'
import { fetchProducts, createProduct, deleteProduct } from '../../store/slices/productsSlice'
```

### Step 2: Replace State Hook
```javascript
// Remove this:
const [products, setProducts] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

// Add this:
const { dispatch, products, isLoading, error, success } = useProducts()
```

### Step 3: Replace API Calls
```javascript
// Remove:
const fetchProducts = async () => {
    setLoading(true)
    try {
        const res = await axios.get(endpoint)
        setProducts(res.data)
    } catch (err) {
        setError(err.message)
    }
}

// Replace with:
useEffect(() => {
    dispatch(fetchProducts())
}, [dispatch])
```

### Step 4: Replace State Setters
```javascript
// Remove:
setProducts([...products, newProduct])

// Replace with:
dispatch(createProduct(newProduct))
```

## Redux Actions Available

### Products
- `fetchProducts()` - Get all products
- `fetchProductById(id)` - Get single product
- `createProduct(formData)` - Create new product
- `updateProduct({ productId, formData })` - Update product
- `deleteProduct(id)` - Delete product
- `clearError()` - Clear error message
- `clearSuccess()` - Clear success message

### Pincodes
- `fetchPincodes()` - Get all pincodes
- `createPincode(data)` - Create pincode
- `deletePincode(pincode)` - Delete pincode
- `clearError()` - Clear error
- `clearSuccess()` - Clear success

### Orders
- `fetchOrders()` - Get all orders
- `fetchOrderById(id)` - Get single order
- `createOrder(data)` - Create order
- `updateOrderStatus({ orderId, status })` - Update order status
- `deleteOrder(id)` - Delete order
- `clearError()` - Clear error
- `clearSuccess()` - Clear success

### Auth
- `loginUser(credentials)` - Login
- `registerUser(userData)` - Register
- `logoutUser()` - Logout
- `clearError()` - Clear error
- `setUser(userData)` - Set user

## Benefits of Redux

1. **Single Source of Truth** - All state in one place
2. **Predictable Updates** - Actions describe what happened
3. **Easy Debugging** - Redux DevTools show all actions
4. **Reusable Logic** - Share state across many components
5. **Better Performance** - Memoization and selectors
6. **Scalability** - Easy to add new features

## Next Steps

1. ✅ Redux Toolkit installed
2. ✅ Store configured with slices
3. ✅ Provider setup in main.jsx
4. ⏳ **Convert existing components to use Redux**
   - Start with Pincode component
   - Then Product component
   - Then Order component
5. ⏳ Implement Redux Persist (optional) - Save state to localStorage
6. ⏳ Add Redux DevTools for debugging

## Common Patterns

### Auto-clear Messages
```javascript
useEffect(() => {
    if (success) {
        const timer = setTimeout(() => dispatch(clearSuccess()), 3000)
        return () => clearTimeout(timer)
    }
}, [success, dispatch])
```

### Handle Async Errors
```javascript
useEffect(() => {
    if (error) {
        console.error('Error occurred:', error)
        // Show toast, alert, etc
    }
}, [error])
```

### Loading Indicators
```javascript
{isLoading && <LoadingSpinner />}
{!isLoading && products.length === 0 && <EmptyState />}
```

## Documentation
See `REDUX_SETUP.md` for complete documentation and advanced patterns.
