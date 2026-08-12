import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './components/auth/Login'
import GetallOrder from './components/order/GetallOrder'
import Product from './components/product/Product'
import CarouselSlider from './components/carouselSlider/CarouselSlider'
import Pincode from './components/pincode/Pincode'
import UserQuery from './components/userQuery/UserQuery'
import OrderTracking from './components/orderTracking/OrderTracking'
import Coupon from './components/coupon/Coupon'
import RefundList from './components/refund/RefundList'
import PaymentList from './components/payment/PaymentList'
import SecuritySettings from './components/auth/SecuritySettings'
import RiderManagement from './components/rider/RiderManagement'
import RiderTracking from './components/rider/RiderTracking'
import RiderOrderAssignment from './components/rider/RiderOrderAssignment'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import { debugMount, debugInfo } from './utils/debug'

debugMount('App')

function AppLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen page-bg">
      <Navbar />
      <div className="flex flex-col flex-1 lg:ml-64 pt-14 lg:pt-0">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute adminOnly={true}><GetallOrder /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute adminOnly={true}><Product /></ProtectedRoute>} />
            <Route path="/carousel" element={<ProtectedRoute adminOnly={true}><CarouselSlider /></ProtectedRoute>} />
            <Route path="/pincodes" element={<ProtectedRoute adminOnly={true}><Pincode /></ProtectedRoute>} />
            <Route path="/queries" element={<ProtectedRoute adminOnly={true}><UserQuery /></ProtectedRoute>} />
            <Route path="/tracking" element={<ProtectedRoute adminOnly={true}><OrderTracking /></ProtectedRoute>} />
            <Route path="/coupons" element={<ProtectedRoute adminOnly={true}><Coupon /></ProtectedRoute>} />
            <Route path="/refunds" element={<ProtectedRoute adminOnly={true}><RefundList /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute adminOnly={true}><PaymentList /></ProtectedRoute>} />
            <Route path="/riders" element={<ProtectedRoute adminOnly={true}><RiderManagement /></ProtectedRoute>} />
            <Route path="/rider-tracking" element={<ProtectedRoute adminOnly={true}><RiderTracking /></ProtectedRoute>} />
            <Route path="/rider-assign" element={<ProtectedRoute adminOnly={true}><RiderOrderAssignment /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}

function App() {
  debugInfo('App', 'Initializing Routes')

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
