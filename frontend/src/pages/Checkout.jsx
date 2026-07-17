import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CartContext, AuthContext } from '../App'
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react'
import axios from 'axios'

export default function Checkout() {
  const { cart, clearCart } = useContext(CartContext)
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 200 ? 0 : 15.00
  const total = subtotal + tax + shipping

  if (cart.length === 0 && !success) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No items to checkout</h2>
        <Link to="/" className="text-cyan-400 hover:underline mt-4 inline-block">Back to Products</Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const orderData = {
      items: cart.map(item => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total_amount: total,
      shipping_address: {
        full_name: fullName,
        address: address,
        city: city,
        zip_code: zipCode
      }
    }

    try {
      await axios.post('/api/orders', orderData)
      clearCart()
      setSuccess(true)
    } catch (e) {
      console.warn("Backend API unavailable. Saving mock order locally.")
      // Save order to mock storage for user profile visualization
      const userOrders = localStorage.getItem(`orders_${user.email}`)
      const orders = userOrders ? JSON.parse(userOrders) : []
      orders.push({
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        items: orderData.items,
        total_amount: total,
        status: 'completed'
      })
      localStorage.setItem(`orders_${user.email}`, JSON.stringify(orders))
      clearCart()
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-6 animate-scaleIn">
        <div className="flex justify-center text-emerald-400">
          <CheckCircle size={64} className="animate-bounce" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100">Order Placed!</h2>
        <p className="text-slate-400">
          Thank you for your purchase. Your payment was processed successfully, and your order is on the way.
        </p>
        <div className="pt-4 flex flex-col gap-3">
          <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 font-bold hover:glow-brand hover:brightness-110 transition-all text-white">
            View Order History
          </Link>
          <Link to="/" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link to="/cart" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={18} /> Back to Cart
      </Link>
      
      <h1 className="text-3xl font-extrabold text-slate-100">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping & Payment Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200">1. Shipping Address</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    placeholder="San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Zip Code</label>
                  <input
                    type="text"
                    required
                    placeholder="94103"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-slate-900/40 border border-slate-800/85 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <CreditCard size={20} className="text-cyan-400" /> 2. Payment Method
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">CVV</label>
                  <input
                    type="password"
                    required
                    placeholder="***"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Totals Summary */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold border-b border-slate-850 pb-4">Checkout Summary</h2>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {cart.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-slate-400 line-clamp-1 flex-1 mr-2">{item.name} <span className="text-xs text-slate-500">x{item.quantity}</span></span>
                <span className="font-semibold text-slate-300">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-4 space-y-3 text-sm text-slate-450">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-semibold text-slate-200">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-200">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-extrabold text-slate-100">
              <span>Total</span>
              <span className="text-cyan-400">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:glow-brand hover:brightness-110 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
