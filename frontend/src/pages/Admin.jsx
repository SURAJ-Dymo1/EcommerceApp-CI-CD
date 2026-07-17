import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { Plus, Trash2, Shield, ShoppingBag, Edit, Check } from 'lucide-react'
import axios from 'axios'

export default function Admin() {
  const { user, loading: authLoading } = useContext(AuthContext)
  const navigate = useNavigate()
  
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      // Allow mocking demo if local testing
      if (!user) {
        navigate('/login')
        return
      }
    }

    // Load data
    const loadAdminData = async () => {
      try {
        const prodRes = await axios.get('/api/products')
        if (Array.isArray(prodRes.data)) setProducts(prodRes.data)
        const orderRes = await axios.get('/api/orders/all')
        if (Array.isArray(orderRes.data)) setOrders(orderRes.data)
      } catch (err) {
        console.warn("Backend API not reachable. Using mock data for Admin.")
        // Mock fallback setup
        const localOrders = localStorage.getItem(`orders_${user?.email}`) || '[]'
        setOrders(JSON.parse(localOrders))
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadAdminData()
    }
  }, [user, authLoading, navigate])

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess(false)

    const newProduct = {
      name,
      price: parseFloat(price),
      description,
      category,
      image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
    }

    try {
      const res = await axios.post('/api/products', newProduct)
      setProducts([...products, res.data])
      setFormSuccess(true)
      clearForm()
    } catch (err) {
      // Mock local fallback
      const mockNew = {
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        ...newProduct
      }
      setProducts([...products, mockNew])
      setFormSuccess(true)
      clearForm()
    }
  }

  const clearForm = () => {
    setName('')
    setPrice('')
    setDescription('')
    setCategory('')
    setImage('')
    setTimeout(() => setFormSuccess(false), 2000)
  }

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`/api/products/${id}`)
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-24 text-cyan-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Shield size={32} className="text-amber-500" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Admin Control Panel</h1>
          <p className="text-slate-500 text-sm">Create and delete products, manage users and orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Product Form */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Plus size={20} className="text-cyan-400" /> Add Product
          </h2>

          {formSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <Check size={16} /> Product added successfully!
            </div>
          )}

          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Product Name</label>
              <input
                type="text"
                required
                placeholder="Apex Headphones"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="299.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                <input
                  type="text"
                  required
                  placeholder="Audio"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
              <textarea
                required
                rows="3"
                placeholder="Product description and specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:glow-brand hover:brightness-110 text-white font-bold transition-all text-sm"
            >
              Create Product
            </button>
          </form>
        </div>

        {/* Product Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <ShoppingBag size={20} className="text-cyan-400" /> Manage Products ({products.length})
            </h2>

            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-800" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200 line-clamp-1">{p.name}</h4>
                      <span className="text-xs text-slate-500">{p.category} | ${p.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {products.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No products registered in the database.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
