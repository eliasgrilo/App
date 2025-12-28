import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Products - Apple-Quality Product Catalog & Inventory History
 * Track all products with entry/exit dates, suppliers, quantities, prices
 */

const STORAGE_KEY = 'padoca_products_v1'

// Spring animations
const spring = {
    type: "spring",
    stiffness: 400,
    damping: 30
}

// Default product categories
const defaultCategories = ['Ingredientes', 'Embalagens', 'Utensílios', 'Produtos de Limpeza', 'Outros']

// Subcategories (primarily for Ingredientes)
const defaultSubcategories = {
    'Ingredientes': ['Laticínios', 'Embutidos', 'Farináceos', 'Temperos', 'Vegetais', 'Carnes', 'Molhos', 'Queijos', 'Óleos', 'Outros'],
    'Embalagens': ['Caixas', 'Sacolas', 'Papéis', 'Plásticos', 'Outros'],
    'Utensílios': ['Cozinha', 'Mesa', 'Limpeza', 'Outros'],
    'Produtos de Limpeza': ['Detergentes', 'Desinfetantes', 'Acessórios', 'Outros'],
    'Outros': ['Geral']
}

export default function Products() {
    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    const [products, setProducts] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    const [categories, setCategories] = useState(defaultCategories)
    const [suppliers, setSuppliers] = useState([])
    const [isCloudSynced, setIsCloudSynced] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [activeSubcategory, setActiveSubcategory] = useState('all')
    const [sortBy, setSortBy] = useState('recent') // 'recent' | 'name' | 'quantity' | 'price'
    const [isAddingProduct, setIsAddingProduct] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [viewingProduct, setViewingProduct] = useState(null)
    const [confirmModal, setConfirmModal] = useState(null)

    // Toast system
    const [toastMessage, setToastMessage] = useState(null)
    const toastTimeoutRef = useRef(null)

    const showToast = useCallback((message, type = 'info') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setToastMessage({ message, type })
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000)
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // CLOUD SYNC
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const loadCloud = async () => {
            try {
                // Load suppliers for linking
                const suppliersData = await FirebaseService.getSuppliers()
                if (suppliersData?.suppliers) {
                    setSuppliers(suppliersData.suppliers)
                }

                // Load products
                const data = await FirebaseService.getProducts?.()
                if (data?.products) {
                    setProducts(data.products)
                }
                if (data?.categories) {
                    setCategories(data.categories)
                }
            } catch (err) {
                console.warn("Products cloud load failed", err)
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadCloud()
    }, [])

    // Save to localStorage and cloud
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
        if (isCloudSynced) {
            const timeout = setTimeout(() => {
                try {
                    FirebaseService.syncProducts?.(products, categories)
                } catch { }
            }, 2000)
            return () => clearTimeout(timeout)
        }
    }, [products, categories, isCloudSynced])

    // ═══════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════
    const filteredProducts = useMemo(() => {
        let result = [...products]

        // Filter by category
        if (activeCategory !== 'all') {
            result = result.filter(p => p.category === activeCategory)
        }

        // Filter by subcategory
        if (activeSubcategory !== 'all') {
            result = result.filter(p => p.subcategory === activeSubcategory)
        }

        // Filter by search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.supplier?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q)
            )
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                break
            case 'quantity':
                result.sort((a, b) => (b.currentStock || 0) - (a.currentStock || 0))
                break
            case 'price':
                result.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0))
                break
            case 'recent':
            default:
                result.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        }

        return result
    }, [products, activeCategory, activeSubcategory, searchQuery, sortBy])

    // Get available subcategories based on active category
    const availableSubcategories = useMemo(() => {
        if (activeCategory === 'all') {
            // Get all unique subcategories from products
            return [...new Set(products.map(p => p.subcategory).filter(Boolean))]
        }
        return defaultSubcategories[activeCategory] || []
    }, [activeCategory, products])

    const stats = useMemo(() => {
        const totalProducts = products.length
        const totalValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.unitPrice || 0)), 0)
        const lowStock = products.filter(p => p.minStock && p.currentStock < p.minStock).length
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))].length
        return { totalProducts, totalValue, lowStock, categories }
    }, [products])

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const addProduct = useCallback((productData) => {
        const newProduct = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...productData,
            currentStock: productData.initialStock || 0,
            history: [{
                id: Date.now(),
                type: 'entry',
                quantity: productData.initialStock || 0,
                date: new Date().toISOString(),
                notes: 'Estoque inicial',
                unitPrice: productData.unitPrice || 0
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        setProducts(prev => [newProduct, ...prev])
        setIsAddingProduct(false)
        showToast('Produto adicionado com sucesso', 'success')
    }, [showToast])

    const updateProduct = useCallback((productData) => {
        setProducts(prev => prev.map(p =>
            p.id === productData.id
                ? { ...p, ...productData, updatedAt: new Date().toISOString() }
                : p
        ))
        setEditingProduct(null)
        showToast('Produto atualizado', 'success')
    }, [showToast])

    const deleteProduct = useCallback((productId) => {
        setConfirmModal({
            title: "Excluir Produto",
            message: "Este produto e todo seu histórico serão removidos permanentemente.",
            type: 'danger',
            onConfirm: () => {
                setProducts(prev => prev.filter(p => p.id !== productId))
                setViewingProduct(null)
                setConfirmModal(null)
                showToast('Produto excluído', 'success')
            },
            onCancel: () => setConfirmModal(null)
        })
    }, [showToast])

    const addMovement = useCallback((productId, movement) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p
            const newStock = movement.type === 'entry'
                ? (p.currentStock || 0) + movement.quantity
                : Math.max(0, (p.currentStock || 0) - movement.quantity)
            return {
                ...p,
                currentStock: newStock,
                history: [...(p.history || []), {
                    id: Date.now(),
                    ...movement,
                    date: new Date().toISOString()
                }],
                updatedAt: new Date().toISOString()
            }
        }))
        showToast(movement.type === 'entry' ? 'Entrada registrada' : 'Saída registrada', 'success')
    }, [showToast])

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen pb-24 md:pb-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                Produtos
                            </h1>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-500 ${isCloudSynced
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {isCloudSynced ? 'Synced' : 'Syncing'}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            Catálogo completo com histórico de movimentações
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddingProduct(true)}
                        className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Novo Produto
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 border border-zinc-200/50 dark:border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Produtos</p>
                        <p className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tabular-nums">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 border border-zinc-200/50 dark:border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Valor em Estoque</p>
                        <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 border border-zinc-200/50 dark:border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estoque Baixo</p>
                        <p className={`text-2xl md:text-3xl font-bold tabular-nums ${stats.lowStock > 0 ? 'text-rose-500' : 'text-zinc-900 dark:text-white'}`}>
                            {stats.lowStock}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-5 border border-zinc-200/50 dark:border-white/5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Categorias</p>
                        <p className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tabular-nums">{stats.categories}</p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 rounded-2xl text-sm font-medium outline-none border border-zinc-200/50 dark:border-white/5 focus:ring-2 focus:ring-zinc-500/20 transition-all"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="px-4 py-4 bg-white dark:bg-zinc-900 rounded-2xl text-sm font-medium outline-none border border-zinc-200/50 dark:border-white/5 focus:ring-2 focus:ring-zinc-500/20 appearance-none cursor-pointer min-w-[140px]"
                    >
                        <option value="recent">Mais Recentes</option>
                        <option value="name">Nome A-Z</option>
                        <option value="quantity">Maior Estoque</option>
                        <option value="price">Maior Preço</option>
                    </select>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
                    <button
                        onClick={() => { setActiveCategory('all'); setActiveSubcategory('all'); }}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeCategory === 'all'
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setActiveSubcategory('all'); }}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeCategory === cat
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Subcategory Filter */}
                {availableSubcategories.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-2">
                        <button
                            onClick={() => setActiveSubcategory('all')}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategory === 'all'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            Todas
                        </button>
                        {availableSubcategories.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setActiveSubcategory(sub)}
                                className={`flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeSubcategory === sub
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredProducts.map(product => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={spring}
                            onClick={() => setViewingProduct(product)}
                            className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/50 dark:border-white/5 hover:shadow-xl hover:border-zinc-300 dark:hover:border-white/10 transition-all cursor-pointer group"
                        >
                            {/* Category & Subcategory Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {product.category && (
                                    <div className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        {product.category}
                                    </div>
                                )}
                                {product.subcategory && (
                                    <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                        {product.subcategory}
                                    </div>
                                )}
                            </div>

                            {/* Product Name */}
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {product.name}
                            </h3>

                            {/* SKU */}
                            {product.sku && (
                                <p className="text-xs text-zinc-400 mb-3 font-mono">
                                    SKU: {product.sku}
                                </p>
                            )}

                            {/* Stats Row */}
                            <div className="flex items-center gap-4 mb-4">
                                <div>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Estoque</p>
                                    <p className={`text-xl font-bold tabular-nums ${product.minStock && product.currentStock < product.minStock
                                        ? 'text-rose-500'
                                        : 'text-zinc-900 dark:text-white'
                                        }`}>
                                        {product.currentStock || 0}
                                        <span className="text-xs font-medium text-zinc-400 ml-1">{product.unit || 'un'}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Preço Unit.</p>
                                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        R$ {(product.unitPrice || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Supplier */}
                            {product.supplier && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {product.supplier}
                                </div>
                            )}

                            {/* Last Movement */}
                            {product.history?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] text-zinc-400">
                                        Última movimentação: {new Date(product.history[product.history.length - 1].date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                        {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                        {searchQuery ? 'Tente uma busca diferente' : 'Adicione seu primeiro produto para começar'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsAddingProduct(true)}
                            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold"
                        >
                            Adicionar Produto
                        </button>
                    )}
                </motion.div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isAddingProduct && (
                    <ProductFormModal
                        suppliers={suppliers}
                        categories={categories}
                        onSave={addProduct}
                        onClose={() => setIsAddingProduct(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingProduct && (
                    <ProductFormModal
                        product={editingProduct}
                        suppliers={suppliers}
                        categories={categories}
                        onSave={updateProduct}
                        onClose={() => setEditingProduct(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingProduct && (
                    <ProductDetailModal
                        product={viewingProduct}
                        onClose={() => setViewingProduct(null)}
                        onEdit={() => { setEditingProduct(viewingProduct); setViewingProduct(null) }}
                        onDelete={() => deleteProduct(viewingProduct.id)}
                        onAddMovement={(movement) => addMovement(viewingProduct.id, movement)}
                        suppliers={suppliers}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmModal && <ConfirmationModal {...confirmModal} />}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toastMessage && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${toastMessage.type === 'error' ? 'bg-rose-500/90 border-rose-400/20 text-white' :
                            toastMessage.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
                                'bg-zinc-900/90 border-white/10 text-white'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-white animate-pulse' :
                            toastMessage.type === 'success' ? 'bg-white' : 'bg-indigo-400'
                            }`} />
                        <span className="text-sm font-semibold">{toastMessage.message}</span>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT FORM MODAL
// ═══════════════════════════════════════════════════════════════
function ProductFormModal({ product, suppliers, categories, onSave, onClose }) {
    useScrollLock(true)
    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        category: product?.category || categories[0] || '',
        subcategory: product?.subcategory || '',
        supplier: product?.supplier || '',
        unit: product?.unit || 'un',
        unitPrice: product?.unitPrice || '',
        initialStock: product?.currentStock || '',
        minStock: product?.minStock || '',
        maxStock: product?.maxStock || '',
        notes: product?.notes || ''
    })

    // Get available subcategories for selected category
    const formSubcategories = defaultSubcategories[formData.category] || []

    const handleSubmit = () => {
        if (!formData.name.trim()) return
        onSave({
            ...(product || {}),
            ...formData,
            unitPrice: parseFloat(formData.unitPrice) || 0,
            initialStock: parseFloat(formData.initialStock) || 0,
            minStock: parseFloat(formData.minStock) || 0,
            maxStock: parseFloat(formData.maxStock) || 0
        })
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={spring}
                className="relative w-full md:max-w-lg bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border-t md:border border-zinc-200/50 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 p-5 md:p-6 border-b border-zinc-100 dark:border-white/5">
                    <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 md:hidden" />
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                            {product ? 'Editar Produto' : 'Novo Produto'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Nome do Produto *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Farinha de Trigo 1kg"
                            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                        />
                    </div>

                    {/* SKU & Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">SKU</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                placeholder="FAR-001"
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 appearance-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Subcategory */}
                    {formSubcategories.length > 0 && (
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Subcategoria</label>
                            <div className="flex flex-wrap gap-2">
                                {formSubcategories.map(sub => (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, subcategory: sub }))}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] ${formData.subcategory === sub
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Supplier */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Fornecedor</label>
                        <select
                            value={formData.supplier}
                            onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 appearance-none"
                        >
                            <option value="">Selecione...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Unit & Price */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Unidade</label>
                            <select
                                value={formData.unit}
                                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 appearance-none"
                            >
                                <option value="un">Unidade</option>
                                <option value="kg">Kg</option>
                                <option value="g">g</option>
                                <option value="L">Litro</option>
                                <option value="ml">ml</option>
                                <option value="cx">Caixa</option>
                                <option value="pct">Pacote</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Preço Unitário</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={formData.unitPrice}
                                onChange={e => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                                placeholder="0.00"
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{product ? 'Estoque Atual' : 'Estoque Inicial'}</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={formData.initialStock}
                                onChange={e => setFormData(prev => ({ ...prev, initialStock: e.target.value }))}
                                placeholder="0"
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Mínimo</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={formData.minStock}
                                onChange={e => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                                placeholder="0"
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Máximo</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={formData.maxStock}
                                onChange={e => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
                                placeholder="0"
                                className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notas adicionais..."
                            rows={3}
                            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 p-5 md:p-6 border-t border-zinc-100 dark:border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.name.trim()}
                        className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {product ? 'Salvar' : 'Adicionar'}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
function ProductDetailModal({ product, onClose, onEdit, onDelete, onAddMovement, suppliers }) {
    useScrollLock(true)
    const [activeTab, setActiveTab] = useState('info') // 'info' | 'history' | 'movement'
    const [movementType, setMovementType] = useState('entry')
    const [movementQty, setMovementQty] = useState('')
    const [movementNotes, setMovementNotes] = useState('')

    const handleAddMovement = () => {
        if (!movementQty || parseFloat(movementQty) <= 0) return
        onAddMovement({
            type: movementType,
            quantity: parseFloat(movementQty),
            notes: movementNotes
        })
        setMovementQty('')
        setMovementNotes('')
        setActiveTab('history')
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={spring}
                className="relative w-full md:max-w-2xl bg-white dark:bg-zinc-900 md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border-t md:border border-zinc-200/50 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 p-5 md:p-6 border-b border-zinc-100 dark:border-white/5">
                    <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 md:hidden" />
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {product.category && (
                                    <div className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                        {product.category}
                                    </div>
                                )}
                                {product.subcategory && (
                                    <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                        {product.subcategory}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{product.name}</h2>
                            {product.sku && <p className="text-xs text-zinc-400 font-mono mt-1">SKU: {product.sku}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Estoque</p>
                            <p className={`text-xl font-bold ${product.minStock && product.currentStock < product.minStock ? 'text-rose-500' : 'text-zinc-900 dark:text-white'}`}>
                                {product.currentStock || 0}
                            </p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Preço Unit.</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$ {(product.unitPrice || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Valor Total</p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-white">R$ {((product.currentStock || 0) * (product.unitPrice || 0)).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        {[
                            { id: 'info', label: 'Detalhes' },
                            { id: 'history', label: 'Histórico' },
                            { id: 'movement', label: 'Movimentar' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            {product.supplier && (
                                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <div>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Fornecedor</p>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{product.supplier}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Estoque Mínimo</p>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{product.minStock || '-'}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Estoque Máximo</p>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{product.maxStock || '-'}</p>
                                </div>
                            </div>

                            {product.notes && (
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Observações</p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{product.notes}</p>
                                </div>
                            )}

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Cadastrado em</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-2">
                            {product.history?.length > 0 ? (
                                [...product.history].reverse().map((item, idx) => (
                                    <div key={item.id || idx} className={`p-4 rounded-xl border ${item.type === 'entry'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`text-xs font-bold uppercase ${item.type === 'entry' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {item.type === 'entry' ? '+ Entrada' : '- Saída'}
                                                </span>
                                                <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                                                    {item.quantity} {product.unit || 'un'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(item.date).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        {item.notes && (
                                            <p className="text-xs text-zinc-500 mt-2">{item.notes}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-zinc-400 text-sm">Nenhuma movimentação registrada</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'movement' && (
                        <div className="space-y-4">
                            {/* Type Toggle */}
                            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                <button
                                    onClick={() => setMovementType('entry')}
                                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${movementType === 'entry'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-zinc-500'
                                        }`}
                                >
                                    + Entrada
                                </button>
                                <button
                                    onClick={() => setMovementType('exit')}
                                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${movementType === 'exit'
                                        ? 'bg-rose-500 text-white'
                                        : 'text-zinc-500'
                                        }`}
                                >
                                    - Saída
                                </button>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Quantidade</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={movementQty}
                                    onChange={e => setMovementQty(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-lg font-bold outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50 text-center"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Observações</label>
                                <input
                                    type="text"
                                    value={movementNotes}
                                    onChange={e => setMovementNotes(e.target.value)}
                                    placeholder="Ex: Compra fornecedor X"
                                    className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm outline-none border border-zinc-200/50 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-500/50"
                                />
                            </div>

                            <button
                                onClick={handleAddMovement}
                                disabled={!movementQty || parseFloat(movementQty) <= 0}
                                className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${movementType === 'entry'
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : 'bg-rose-500 text-white hover:bg-rose-600'
                                    }`}
                            >
                                Registrar {movementType === 'entry' ? 'Entrada' : 'Saída'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 p-5 md:p-6 border-t border-zinc-100 dark:border-white/5 flex gap-3">
                    <button
                        onClick={onEdit}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Editar
                    </button>
                    <button
                        onClick={onDelete}
                        className="py-4 px-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                    >
                        Excluir
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}

// ═══════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════
function ConfirmationModal({ title, message, type = 'info', onConfirm, onCancel }) {
    useScrollLock(true)
    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-6"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={spring}
                className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-zinc-200/50 dark:border-white/10"
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto ${type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-zinc-100 text-zinc-600'}`}>
                    {type === 'danger' ? (
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ) : (
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 text-center">{title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 text-center">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}>Confirmar</button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    )
}
