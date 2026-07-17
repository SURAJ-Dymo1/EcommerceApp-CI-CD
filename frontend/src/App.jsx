import React, { createContext, useState, useEffect, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Package, CreditCard, Shield, Plus, Trash2, Edit, CheckCircle } from 'lucide-react'
import axios from 'axios'

// API base URL configuration
const API_URL = '/api'

// Contexts
export const AuthContext = createContext(null)
export const CartContext = createContext(null)

// Providers
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Fetch user profile
      axios.get(`${API_URL}/auth/me`)
        .then(res => {
          setUser(res.data)
        })
        .catch(() => {
          logout()
        })
        .finally(() => setLoading(false))
    } else {
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email) // OAuth2 password flow uses username
    params.append('password', password)
    
    const res = await axios.post(`${API_URL}/auth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    const accessToken = res.data.access_token
    localStorage.setItem('token', accessToken)
    setToken(accessToken)
    return res.data
  }

  const register = async (username, email, password) => {
    const res = await axios.post(`${API_URL}/auth/register`, { username, email, password })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const { user } = useContext(AuthContext)

  // Load cart on startup / user change
  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/cart`)
        .then(res => {
          setCart(Array.isArray(res.data.items) ? res.data.items : [])
        })
        .catch(() => {
          // Fallback to local storage if API fails or backend is not running
          const localCart = localStorage.getItem(`cart_${user.email}`)
          if (localCart) setCart(JSON.parse(localCart))
        })
    } else {
      setCart([])
    }
  }, [user])

  // Sync to local storage for persistence fallback
  const saveCartLocally = (newCart) => {
    if (user) {
      localStorage.setItem(`cart_${user.email}`, JSON.stringify(newCart))
    }
  }

  const addToCart = async (product, quantity = 1) => {
    if (!user) return false
    
    const updatedCart = [...cart]
    const existingIndex = updatedCart.findIndex(item => item.product_id === product.id)
    
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += quantity
    } else {
      updatedCart.push({ product_id: product.id, name: product.name, price: product.price, image: product.image, quantity })
    }
    
    setCart(updatedCart)
    saveCartLocally(updatedCart)

    try {
      await axios.post(`${API_URL}/cart/items`, { product_id: product.id, quantity })
    } catch (e) {
      console.warn("Backend unavailable, cart saved locally.")
    }
    return true
  }

  const removeFromCart = async (productId) => {
    const updatedCart = cart.filter(item => item.product_id !== productId)
    setCart(updatedCart)
    saveCartLocally(updatedCart)

    try {
      await axios.delete(`${API_URL}/cart/items/${productId}`)
    } catch (e) {
      console.warn("Backend unavailable, cart updated locally.")
    }
  }

  const clearCart = async () => {
    setCart([])
    if (user) {
      localStorage.removeItem(`cart_${user.email}`)
    }
    try {
      await axios.delete(`${API_URL}/cart`)
    } catch (e) {
      console.warn("Backend unavailable.")
    }
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

// Layout wrapper
function Layout({ children }) {
  const { user, logout } = useContext(AuthContext)
  const { cart } = useContext(CartContext)
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
          <span>🛒</span> NexShop
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors">Products</Link>
          
          {user && (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                <Package size={18} /> Orders
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-medium">
                  <Shield size={18} /> Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                {user.username}
              </span>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-full hover:bg-slate-900">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-sm font-semibold hover:glow-brand hover:brightness-110 transition-all">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} NexShop DevOps Demo. Built with React, FastAPI, MongoDB, and Kubernetes.</p>
      </footer>
    </div>
  )
}

// Router pages placeholder
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
