import { useDispatch, useSelector } from 'react-redux'

// Auth hooks
export const useAuth = () => {
    const dispatch = useDispatch()
    const auth = useSelector((state) => state.auth)
    return { dispatch, ...auth }
}

// Products hooks
export const useProducts = () => {
    const dispatch = useDispatch()
    const products = useSelector((state) => state.products)
    return { dispatch, ...products }
}

// Pincodes hooks
export const usePincodes = () => {
    const dispatch = useDispatch()
    const pincodes = useSelector((state) => state.pincodes)
    return { dispatch, ...pincodes }
}

// Orders hooks
export const useOrders = () => {
    const dispatch = useDispatch()
    const orders = useSelector((state) => state.orders)
    return { dispatch, ...orders }
}
