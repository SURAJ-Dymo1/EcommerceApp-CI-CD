import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CartContext } from '../App'
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react'
import axios from 'axios'

// Mock data list matching ProductList.jsx
const MOCK_PRODUCTS = [
  { id: "p1", name: "Apex Wireless Headphones", price: 299.99, description: "Active noise-canceling headphones with studio-quality audio reproduction.", category: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
  { id: "p2", name: "Tactile Mechanical Keyboard", price: 149.99, description: "RGB backlit mechanical keyboard with hot-swappable switches.", category: "Peripherals", image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80" },
  { id: "p3", name: "UltraWide Curved Monitor", price: 699.99, description: "34-inch curved gaming monitor with 144Hz refresh rate and HDR.", category: "Displays", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80" },
  { id: "p4", name: "Leather Commuter Backpack", price: 119.99, description: "Minimalist waterproof leather backpack for everyday office and travel use.", category: "Lifestyle", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80" },
  { id: "p5", name: "Ergonomic Wireless Mouse", price: 79.99, description: "Precision wireless mouse with customizable buttons and long battery life.", category: "Peripherals", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80" },
  { id: "p6", name: "True Wireless Earbuds", price: 129.99, description: "IPX7 waterproof earbuds with touch controls and wireless charging case.", category: "Audio", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80" }
]

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const { addToCart } = useContext(CartContext)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/products/${id}`)
      .then(res => {
        if (res.data) setProduct(res.data)
      })
      .catch(() => {
        // Fallback
        const mock = MOCK_PRODUCTS.find(p => p.id === id)
        if (mock) setProduct(mock)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = () => {
    if (product) {
      addToCart(product)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-cyan-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Link to="/" className="text-cyan-400 hover:underline mt-4 inline-block">Back to Products</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-10">
        {/* Product Image */}
        <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex justify-center items-center aspect-square">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-cyan-400 text-xs font-semibold tracking-widest uppercase bg-cyan-950/80 border border-cyan-900/60 px-3 py-1.5 rounded-full">
              {product.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100">{product.name}</h1>
            <p className="text-2xl font-black text-cyan-400">${product.price.toFixed(2)}</p>
            <div className="border-t border-slate-800 my-4"></div>
            <h3 className="text-slate-300 font-semibold text-lg">Product Description</h3>
            <p className="text-slate-400 leading-relaxed text-base">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 self-center"></span>
              <span className="text-slate-400 text-sm">In Stock & ready to ship</span>
            </div>
            
            <button
              onClick={handleAdd}
              disabled={added}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                added 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:glow-brand hover:brightness-110 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check size={20} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={20} /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
