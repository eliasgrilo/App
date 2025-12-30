/**
 * Products - Apple Keynote Quality Audit System
 * 
 * Design Philosophy:
 * - Inspired by Costs.jsx (Financeiro) — exact same visual language
 * - Premium glassmorphism, mesh gradients, SF Pro typography
 * - 44pt touch targets, Apple HIG compliance
 * - Dynamic currency via FormatService
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'
import { StockService } from './services/stockService'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatDate } from './services/formatService'
import { HapticService } from './services/hapticService'
import { useInventoryItems } from './Inventory'

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'padoca_products_v2'

// ═══════════════════════════════════════════════════════════════
// MODAL SCROLL LOCK COMPONENT
// ═══════════════════════════════════════════════════════════════

function ModalScrollLock() {
    useScrollLock(true)
    return null
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Products() {
    // State
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [isCloudSynced, setIsCloudSynced] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [confirmModal, setConfirmModal] = useState(null)

    // Get inventory items for product data
    const inventoryItems = useInventoryItems()

    // Premium Toast System
    const [toastMessage, setToastMessage] = useState(null)
    const toastTimeoutRef = useRef(null)
    const showToast = useCallback((message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setToastMessage({ message, type })
        HapticService.trigger(type === 'success' ? 'success' : 'warning')
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500)
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Load from Firebase
                const data = await FirebaseService.getProducts?.() || {}
                if (data?.products) {
                    setProducts(data.products)
                }
            } catch (err) {
                console.warn('Products cloud load failed')
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadProducts()
    }, [])

    // Merge inventory items as products
    const mergedProducts = useMemo(() => {
        return inventoryItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            currentStock: StockService.getTotalQuantity(item),
            unit: item.unit || 'un',
            currentPrice: item.pricePerUnit || 0,
            supplier: item.supplierName || 'Sem fornecedor',
            minStock: item.minStock || 0,
            maxStock: item.maxStock || 0,
            movements: [],
            lastUpdated: item.updatedAt || item.createdAt
        }))
    }, [inventoryItems])

    // ═══════════════════════════════════════════════════════════════
    // CALCULATIONS
    // ═══════════════════════════════════════════════════════════════

    const stats = useMemo(() => {
        const totalProducts = mergedProducts.length
        const totalValue = mergedProducts.reduce((acc, p) => acc + (p.currentStock * p.currentPrice), 0)
        const lowStockCount = mergedProducts.filter(p => p.minStock > 0 && p.currentStock <= p.minStock).length
        const outOfStock = mergedProducts.filter(p => p.currentStock === 0).length

        // Group by category
        const byCategory = mergedProducts.reduce((acc, p) => {
            const cat = p.category || 'Outros'
            if (!acc[cat]) acc[cat] = { count: 0, value: 0 }
            acc[cat].count++
            acc[cat].value += p.currentStock * p.currentPrice
            return acc
        }, {})

        return {
            totalProducts,
            totalValue,
            lowStockCount,
            outOfStock,
            byCategory
        }
    }, [mergedProducts])

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return mergedProducts
        const q = searchQuery.toLowerCase()
        return mergedProducts.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.supplier?.toLowerCase().includes(q)
        )
    }, [mergedProducts, searchQuery])

    // Group by category
    const groupedProducts = useMemo(() => {
        const groups = {}
        filteredProducts.forEach(p => {
            const cat = p.category || 'Outros'
            if (!groups[cat]) groups[cat] = []
            groups[cat].push(p)
        })
        return groups
    }, [filteredProducts])

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-violet-500/20">
            {/* Ultra-Subtle Background — Apple Mesh Gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                HEADER: Identity & Actions — Apple Pro Design
            ═══════════════════════════════════════════════════════════════ */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Produtos
                        </h1>
                        {/* Sync Status Badge */}
                        <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${isCloudSynced
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                            : 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse'
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {isCloudSynced ? 'Cloud Active' : 'Syncing'}
                            </span>
                        </div>
                        {/* Alert Badge */}
                        {stats.lowStockCount > 0 && (
                            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {stats.lowStockCount} alertas
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">
                        Controle de inventário e análise de estoque
                    </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-80">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 md:py-3.5 bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-lg"
                    />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                DASHBOARD: Premium Metrics — Apple Pro Aesthetic
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">

                {/* HERO CARD: Total Value — Apple Pro Investment Card */}
                <div className="md:col-span-2 relative group">
                    <div className="relative h-full bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-zinc-200/50 dark:border-white/10 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-500 hover:shadow-2xl">
                        {/* Mesh Gradient — Hover Effect */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/[0.03] dark:bg-violet-500/[0.07] blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-violet-300/60 uppercase tracking-widest mb-1">
                                        Inventory Value Matrix
                                    </h3>
                                    <p className="text-zinc-400 dark:text-white/30 text-[9px] font-medium tracking-wide">
                                        Protocol Status: High Integrity
                                    </p>
                                </div>
                                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-white/5 backdrop-blur-md rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[8px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest leading-none">
                                        Live Data
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-violet-500/60 uppercase tracking-widest ml-1">
                                    Total Asset Value
                                </span>
                                <div className="text-4xl md:text-7xl font-semibold text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none tabular-nums">
                                    {formatCurrency(stats.totalValue)}
                                </div>
                            </div>
                        </div>

                        {/* Footer Stats */}
                        <div className="relative flex flex-col sm:flex-row gap-6 md:gap-12 mt-12 md:mt-20 pt-8 md:pt-10 border-t border-zinc-100 dark:border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">
                                    Total Products
                                </span>
                                <span className="text-2xl md:text-3xl font-semibold text-zinc-800 dark:text-white/90 tracking-tight tabular-nums">
                                    {stats.totalProducts}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest">
                                    Categories
                                </span>
                                <span className="text-2xl md:text-3xl font-semibold text-violet-600 dark:text-violet-400 tracking-tight tabular-nums">
                                    {Object.keys(stats.byCategory).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* METRIC CARD: Low Stock — Glassmorphism */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">
                                Estoque Baixo
                            </h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {stats.lowStockCount}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                Alert Rate
                            </span>
                            <span className="text-[8px] font-bold text-amber-500">
                                {stats.totalProducts > 0 ? ((stats.lowStockCount / stats.totalProducts) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500/80 transition-all duration-1000"
                                style={{ width: `${stats.totalProducts > 0 ? (stats.lowStockCount / stats.totalProducts) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* METRIC CARD: Out of Stock — Glassmorphism */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                            <h3 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0">
                                Sem Estoque
                            </h3>
                        </div>
                        <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
                            {stats.outOfStock}
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                Critical Level
                            </span>
                            <span className="text-[8px] font-bold text-rose-500">
                                {stats.totalProducts > 0 ? ((stats.outOfStock / stats.totalProducts) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500/80 transition-all duration-1000"
                                style={{ width: `${stats.totalProducts > 0 ? (stats.outOfStock / stats.totalProducts) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                LEDGER: Product Registry Console — Apple Pro Design
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 bg-white dark:bg-zinc-950 rounded-[2rem] md:rounded-[3rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
                    <div>
                        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                            Protocol Ledger
                        </h2>
                        <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">
                            Product Registry
                        </h3>
                    </div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                        {filteredProducts.length} items
                    </div>
                </div>

                <div className="px-6 md:px-10 pb-6 md:pb-10">
                    {/* Table Header — Hidden on Mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-8 py-4 border-b border-zinc-100 dark:border-white/5 px-4 mb-4">
                        <div className="col-span-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            Identity & Description
                        </div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                            Stock Level
                        </div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                            Unit Price
                        </div>
                        <div className="col-span-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                            Total Value
                        </div>
                        <div className="col-span-2" />
                    </div>

                    <div className="space-y-6">
                        {filteredProducts.length === 0 ? (
                            <div className="py-32 text-center flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/10 opacity-40">
                                    <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                                    System IDLE — No Products Found
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedProducts).map(([category, items]) => (
                                <div key={category} className="space-y-2">
                                    {/* Category Header */}
                                    <div className="flex items-center gap-4 py-2 px-4 mb-2">
                                        <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">
                                            {category}
                                        </span>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-violet-500/10 to-transparent" />
                                        <span className="text-[9px] font-bold text-zinc-400 tabular-nums">
                                            {formatCurrency(stats.byCategory[category]?.value || 0)}
                                        </span>
                                    </div>

                                    {/* Product Rows */}
                                    <div className="space-y-3 md:space-y-1">
                                        {items.map(product => {
                                            const stockValue = product.currentStock * product.currentPrice
                                            const isLowStock = product.minStock > 0 && product.currentStock <= product.minStock
                                            const isOutOfStock = product.currentStock === 0

                                            return (
                                                <motion.div
                                                    key={product.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-8 py-5 md:items-center group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-4 rounded-2xl md:rounded-[1.5rem] transition-all cursor-pointer border ${isOutOfStock
                                                        ? 'border-rose-200/60 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5'
                                                        : isLowStock
                                                            ? 'border-amber-200/60 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5'
                                                            : 'border-zinc-100 dark:border-white/5 md:border-transparent'
                                                        }`}
                                                    onClick={() => setSelectedProduct(product)}
                                                >
                                                    {/* Identity */}
                                                    <div className="md:col-span-4 flex items-start md:items-center gap-4">
                                                        <div className={`mt-1.5 md:mt-0 w-2 h-2 rounded-full shrink-0 ${isOutOfStock
                                                            ? 'bg-rose-500'
                                                            : isLowStock
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                            }`} />
                                                        <div className="flex flex-col text-ellipsis overflow-hidden">
                                                            <span className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 truncate">
                                                                {product.name}
                                                            </span>
                                                            <div className="flex items-center gap-3 opacity-60">
                                                                <span className="text-[9px] font-bold text-zinc-400 uppercase">
                                                                    {product.supplier}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Stock Level */}
                                                    <div className="md:col-span-2 flex md:justify-center">
                                                        <span className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-tighter tabular-nums ${isOutOfStock
                                                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                                                            : isLowStock
                                                                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                                                                : 'bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/10 text-zinc-500 dark:text-zinc-400'
                                                            }`}>
                                                            {product.currentStock} {product.unit}
                                                        </span>
                                                    </div>

                                                    {/* Unit Price */}
                                                    <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                                                        <div className="text-base md:text-lg font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                                            {formatCurrency(product.currentPrice)}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            per {product.unit}
                                                        </div>
                                                    </div>

                                                    {/* Total Value */}
                                                    <div className="md:col-span-2 flex flex-row md:flex-col justify-between items-center md:items-end">
                                                        <div className="text-base md:text-lg font-bold text-violet-600 dark:text-violet-400 tracking-tight tabular-nums">
                                                            {formatCurrency(stockValue)}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-violet-500/50 uppercase tracking-tighter md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Total
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="md:col-span-2 flex justify-end gap-2 md:gap-1 md:opacity-0 group-hover:opacity-100 transition-all pt-2 md:pt-0 border-t md:border-0 border-zinc-50 dark:border-white/5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedProduct(product) }}
                                                            className="flex-1 md:flex-none py-2.5 md:p-2.5 flex justify-center items-center text-zinc-400 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-widest">View</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                CATEGORY OVERVIEW — Premium Analytics Cards
            ═══════════════════════════════════════════════════════════════ */}
            {Object.keys(stats.byCategory).length > 0 && (
                <section className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {Object.entries(stats.byCategory).map(([category, data], index) => (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-zinc-950 rounded-[1.5rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-sm hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 opacity-60" />
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                                    {category}
                                </span>
                            </div>
                            <div className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                {formatCurrency(data.value)}
                            </div>
                            <div className="text-[10px] font-bold text-zinc-400 mt-1 tabular-nums">
                                {data.count} {data.count === 1 ? 'produto' : 'produtos'}
                            </div>
                        </motion.div>
                    ))}
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                PREMIUM TOAST NOTIFICATION
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {toastMessage && createPortal(
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${toastMessage.type === 'error'
                            ? 'bg-rose-500/90 border-rose-400/20 text-white'
                            : toastMessage.type === 'success'
                                ? 'bg-emerald-500/90 border-emerald-400/20 text-white'
                                : 'bg-zinc-900/90 border-white/10 text-white'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${toastMessage.type === 'error' ? 'bg-white animate-pulse' : 'bg-white'
                            }`} />
                        <span className="text-sm font-semibold">{toastMessage.message}</span>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                PRODUCT DETAIL MODAL — Apple Sheet Design
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-20 md:pt-4"
                    >
                        <ModalScrollLock />

                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedProduct(null)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-white/5 overflow-hidden max-h-[80vh] flex flex-col"
                        >
                            {/* Drag Handle */}
                            <div className="md:hidden w-full flex justify-center pt-4 pb-1 shrink-0">
                                <div className="w-8 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                            </div>

                            {/* Header */}
                            <div className="px-6 py-5 flex justify-between items-start shrink-0 border-b border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {selectedProduct.name}
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        {selectedProduct.category} • {selectedProduct.supplier}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 touch-manipulation"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Current Stock</span>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1 tabular-nums">
                                            {selectedProduct.currentStock} <span className="text-sm font-medium text-zinc-400">{selectedProduct.unit}</span>
                                        </p>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Unit Price</span>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1 tabular-nums">
                                            {formatCurrency(selectedProduct.currentPrice)}
                                        </p>
                                    </div>
                                    <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-4 col-span-2">
                                        <span className="text-[9px] font-bold text-violet-500 uppercase tracking-widest">Total Value</span>
                                        <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-1 tabular-nums">
                                            {formatCurrency(selectedProduct.currentStock * selectedProduct.currentPrice)}
                                        </p>
                                    </div>
                                </div>

                                {/* Stock Limits */}
                                {(selectedProduct.minStock > 0 || selectedProduct.maxStock > 0) && (
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Stock Limits</span>
                                        <div className="flex gap-6 mt-2">
                                            <div>
                                                <span className="text-[10px] text-amber-500 font-medium">Min</span>
                                                <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{selectedProduct.minStock}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-emerald-500 font-medium">Max</span>
                                                <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{selectedProduct.maxStock}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 shrink-0 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                CONFIRM MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {confirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm"
                            onClick={confirmModal.onCancel}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200/50 dark:border-white/5"
                        >
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{confirmModal.title}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{confirmModal.message}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={confirmModal.onCancel}
                                    className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-semibold transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className={`flex-1 py-3.5 rounded-xl font-semibold transition-all active:scale-95 ${confirmModal.type === 'danger'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-violet-500 text-white'
                                        }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
