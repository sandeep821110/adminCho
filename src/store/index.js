import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import productsReducer from './slices/productsSlice'
import pincodesReducer from './slices/pincodesSlice'
import ordersReducer from './slices/ordersSlice'

const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productsReducer,
        pincodes: pincodesReducer,
        orders: ordersReducer
    }
})

export default store
