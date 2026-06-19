# Redux Toolkit Setup Guide

## Overview
Redux Toolkit has been integrated into your admin dashboard for centralized state management. This provides:
- ✅ Centralized state management
- ✅ Predictable state updates
- ✅ Easy debugging
- ✅ Reusable logic

## Project Structure

```
src/
├── store/
│   ├── index.js                 # Main store configuration
│   └── slices/
│       ├── authSlice.js         # Authentication state & actions
│       ├── productsSlice.js      # Products state & actions
│       ├── pincodesSlice.js      # Pincodes state & actions
│       └── ordersSlice.js        # Orders state & actions
├── hooks/
│   └── useRedux.js             # Custom Redux hooks
├── main.jsx                     # Provider setup
└── components/
    └── product/
        └── ProductRedux.jsx     # Redux integrated example
```

## Key Concepts

### 1. Slices
A slice is a collection of Redux reducer logic and actions for a single feature.

**Example: productsSlice.js**
```javascript
- State: { products: [], isLoading: false, error: null }
- Actions: fetchProducts, createProduct, deleteProduct
- Async Thunks: Handle API calls
```

### 2. Store
Combines all slices and provides central state access.

### 3. Selectors
Functions to access state from Redux store.

### 4. Async Thunks
Handle asynchronous operations (API calls) and dispatch actions based on result.

## How to Use

### Method 1: Using Custom Hooks (Recommended)

```javascript
import { useProducts } from '../../hooks/useRedux'
import { fetchProducts, createProduct, deleteProduct } from '../../store/slices/productsSlice'

const MyComponent = () => {
    const { dispatch, products, isLoading, error, success } = useProducts()

    useEffect(() => {
        dispatch(fetchProducts())
    }, [dispatch])

    const handleCreate = (productData) => {
        dispatch(createProduct(productData))
    }

    return (
        <div>
            {isLoading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            {success && <p>Success: {success}</p>}
            {/* Your JSX */}
        </div>
    )
}
```

### Method 2: Using useSelector & useDispatch

```javascript
import { useSelector, useDispatch } from 'react-redux'
import { fetchProducts } from '../../store/slices/productsSlice'

const MyComponent = () => {
    const dispatch = useDispatch()
    const { products, isLoading } = useSelector(state => state.products)

    useEffect(() => {
        dispatch(fetchProducts())
    }, [dispatch])

    return <div>{/* Your JSX */}</div>
}
```

## Available Slices & Actions

### Auth Slice
```javascript
Properties:
- user: Current user object
- token: Auth token
- isLoading: Loading state
- error: Error message
- isAuthenticated: Auth status

Actions:
- loginUser(credentials)
- registerUser(userData)
- logoutUser()
- clearError()
- setUser(userData)
```

### Products Slice
```javascript
Properties:
- products: Array of products
- currentProduct: Single product
- isLoading: Loading state
- error: Error message
- success: Success message

Actions:
- fetchProducts()
- fetchProductById(productId)
- createProduct(formData)
- updateProduct({ productId, formData })
- deleteProduct(productId)
- clearError()
- clearSuccess()
```

### Pincodes Slice
```javascript
Properties:
- pincodes: Array of pincodes
- isLoading: Loading state
- error: Error message
- success: Success message

Actions:
- fetchPincodes()
- createPincode(pincodeData)
- deletePincode(pincode)
- clearError()
- clearSuccess()
```

### Orders Slice
```javascript
Properties:
- orders: Array of orders
- currentOrder: Single order
- isLoading: Loading state
- error: Error message
- success: Success message

Actions:
- fetchOrders()
- fetchOrderById(orderId)
- createOrder(orderData)
- updateOrderStatus({ orderId, status })
- deleteOrder(orderId)
- clearError()
- clearSuccess()
```

## Migration from Context API to Redux

### Old Way (Context API):
```javascript
const createPincode = async (pincodeData) => {
    try {
        setLoading(true)
        const res = await axios.post(endpoint, pincodeData)
        setPincodes([...pincodes, res.data])
    } catch (err) {
        setError(err.message)
    }
}
```

### New Way (Redux):
```javascript
const handleCreatePincode = (pincodeData) => {
    dispatch(createPincode(pincodeData))
    // State automatically updates!
}
```

## Debugging with Redux DevTools

1. Install Redux DevTools browser extension
2. Open DevTools → Redux tab
3. See all actions and state changes in real-time
4. Time-travel debugging to any previous state

## Performance Tips

1. **Use Selectors**: Prevent unnecessary re-renders
```javascript
// Good
const products = useSelector(state => state.products.products)

// Better - Create reusable selector
const selectProducts = state => state.products.products
const products = useSelector(selectProducts)
```

2. **Normalize State**: Keep related data together
```javascript
// Avoid nested data - instead, use IDs
products: [{ _id: 1, name: 'Product' }]
```

3. **Memoize Selectors**: For complex calculations
```javascript
import { createSelector } from '@reduxjs/toolkit'

const selectExpensiveProducts = createSelector(
    state => state.products.products,
    products => products.filter(p => p.price > 1000)
)
```

## Converting Components to Redux

1. Import actions and custom hooks
2. Replace useState with useSelector for state
3. Replace API calls with dispatch(action)
4. Replace useState setters with reducer updates

## API Configuration

Update API URLs in each slice's async thunks:

```javascript
// productsSlice.js
const API_URL = 'http://localhost:5000/api/products'

// pincodesSlice.js
const API_URL = 'http://localhost:5005/api/pincodes'

// ordersSlice.js
const API_URL = 'http://localhost:5002/api/orders'
```

## Error Handling

All slices follow consistent error handling:

```javascript
// Automatic state updates
isLoading: false  // on request
error: null       // on success
success: message  // on success
error: message    // on failure
```

## Next Steps

1. Convert all components to use Redux
2. Replace Context API with Redux selectors
3. Combine related API calls into middleware
4. Implement Redux Persist to save state to localStorage
5. Add Redux Saga for complex side effects (optional)

## References

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux Async Thunks](https://redux-toolkit.js.org/usage/usage-guide#async-thunks)
