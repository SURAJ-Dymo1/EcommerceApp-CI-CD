import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { Package, Clock, ShieldCheck, User } from 'lucide-react'
import axios from 'axios'

export default function Dashboard() {
  const { user, loading: authLoading } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    if (user) {
      axios.get('/api/orders')
        .then(res => {
          setOrders(Array.isArray(res.data) ? res.data : [])
        })
        .catch(() => {
          // Fallback to local storage
          const localOrders = localStorage.getItem(`orders_${user.email}`)
          if (localOrders) {
            setOrders(JSON.parse(localOrders))
          }
        })
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, navigate])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-24 text-cyan-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Profile summary banner */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/20">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              {user?.username}
              {user?.is_admin && <span className="text-xs bg-amber-950/80 border border-amber-900/60 text-amber-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl text-center">
            <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Orders Placed</span>
            <span className="text-xl font-black text-cyan-400">{orders.length}</span>
          </div>
          {user?.is_admin && (
            <Link to="/admin" className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 transition-colors text-slate-950 font-bold text-sm flex items-center gap-2">
              <ShieldCheck size={18} /> Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <Package size={20} className="text-cyan-400" /> Order History
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-8 text-slate-500">
            No orders found. Once you checkout, your items will be listed here!
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">ORDER ID</span>
                    <p className="text-sm font-bold text-slate-300">{order.id}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">DATE</span>
                    <p className="text-sm text-slate-300">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">STATUS</span>
                    <p className="text-sm flex items-center gap-1 text-emerald-400 font-bold capitalize">
                      <Clock size={14} /> {order.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">TOTAL</span>
                    <p className="text-sm font-extrabold text-cyan-400">${order.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items ({order.items.reduce((a, b) => a + b.quantity, 0)})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/60 border border-slate-900 px-4 py-2.5 rounded-xl text-sm">
                        <span className="text-slate-300 line-clamp-1">{item.name} <span className="text-xs text-slate-500">x{item.quantity}</span></span>
                        <span className="font-semibold text-slate-200">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
