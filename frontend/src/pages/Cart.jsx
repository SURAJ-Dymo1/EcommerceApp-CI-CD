import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartContext, AuthContext } from '../App'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useContext(CartContext)
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 15.00
  const total = subtotal + tax + shipping

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=checkout')
    } else {
      navigate('/checkout')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/20 border border-slate-800/80 rounded-3xl p-8 space-y-6">
        <div className="text-5xl">🛒</div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-slate-500 max-w-md mx-auto">Fill it with high quality hardware and setup accessories, then come back to check out!</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 font-semibold hover:glow-brand hover:brightness-110 transition-all text-white">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-extrabold text-slate-100">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            {cart.map(item => (
              <div key={item.product_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-slate-800 last:border-0 last:pb-0 first:pt-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-800">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">{item.name}</h3>
                    <p className="text-slate-400 text-sm">${item.price.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-slate-300 text-sm font-medium">
                    Qty: <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700 ml-1">{item.quantity}</span>
                  </div>
                  <div className="font-bold text-slate-200 min-w-[70px] text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-4">
            <button 
              onClick={clearCart}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Clear Cart
            </button>
            <Link to="/" className="text-sm text-cyan-400 hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold border-b border-slate-850 pb-4">Order Summary</h2>

          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax (8%)</span>
              <span className="font-semibold text-slate-200">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-200">
                {shipping === 0 ? <span className="text-emerald-400 font-bold">Free</span> : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-slate-500">Free shipping on orders over $200.00!</p>
            )}
            <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-extrabold text-slate-100">
              <span>Total</span>
              <span className="text-cyan-400">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:glow-brand hover:brightness-110 text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
