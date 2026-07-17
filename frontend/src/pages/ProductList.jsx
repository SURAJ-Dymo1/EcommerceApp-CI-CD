import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../App'
import { Search, ShoppingBag } from 'lucide-react'
import axios from 'axios'

// Mock products in case backend API isn't running yet
const MOCK_PRODUCTS = [
  { id: "p1", name: "Apex Wireless Headphones", price: 299.99, description: "Active noise-canceling headphones with studio-quality audio reproduction.", category: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
  { id: "p2", name: "Tactile Mechanical Keyboard", price: 149.99, description: "RGB backlit mechanical keyboard with hot-swappable switches.", category: "Peripherals", image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80" },
  { id: "p3", name: "UltraWide Curved Monitor", price: 699.99, description: "34-inch curved gaming monitor with 144Hz refresh rate and HDR.", category: "Displays", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80" },
  { id: "p4", name: "Leather Commuter Backpack", price: 119.99, description: "Minimalist waterproof leather backpack for everyday office and travel use.", category: "Lifestyle", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80" },
  { id: "p5", name: "Ergonomic Wireless Mouse", price: 79.99, description: "Precision wireless mouse with customizable buttons and long battery life.", category: "Peripherals", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80" },
  { id: "p6", name: "True Wireless Earbuds", price: 129.99, description: "IPX7 waterproof earbuds with touch controls and wireless charging case.", category: "Audio", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80" }
]

export default function ProductList() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const { addToCart } = useContext(CartContext)

  useEffect(() => {
    axios.get('/api/products')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data)
        }
      })
      .catch(() => {
        console.warn("Backend API not reachable. Using mock product data.")
      })
      .finally(() => setLoading(false))
  }, [])

  const categories = ['All', ...new Set(products.map(p => p.category))]

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || p.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 border border-slate-800 glow-brand">
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="text-cyan-400 text-sm font-semibold tracking-wider uppercase bg-cyan-950/60 px-3 py-1.5 rounded-full border border-cyan-800/40">Exclusive Launch</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Elevate Your Setup with <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">NexShop</span>
          </h1>
          <p className="text-slate-400 text-base">
            Discover a curated collection of premium workspace components, audio equipment, and everyday tech accessories.
          </p>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(14,150,233,0.15),transparent_50%)]"></div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 items-center justify-start w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat 
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(p => (
          <div key={p.id} className="group relative bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col">
            {/* Image container */}
            <div className="relative aspect-video overflow-hidden bg-slate-950">
              <img 
                src={p.image} 
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                {p.category}
              </span>
            </div>

            {/* Info */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <Link to={`/product/${p.id}`} className="block">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">{p.name}</h3>
                </Link>
                <p className="text-slate-400 text-sm line-clamp-2">{p.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xl font-extrabold text-slate-200">${p.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(p)}
                  className="p-2.5 rounded-full bg-slate-800 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-indigo-500 text-slate-300 hover:text-white transition-all border border-slate-700 hover:border-transparent flex items-center justify-center gap-2 group-hover:glow-brand"
                >
                  <ShoppingBag size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No products found matching your search criteria.
        </div>
      )}
    </div>
  )
}
