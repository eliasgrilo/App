import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from './hooks/useScrollLock'
import { FirebaseService } from './services/firebaseService'

/**
 * Suppliers - Apple-Quality Supplier Management
 * Premium design with full contact management and linked inventory items
 */

const STORAGE_KEY = 'padoca_suppliers'

// Modal scroll lock component
function ModalScrollLock() {
    useScrollLock(true)
    return null
}

// Premium Toast Component
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[20000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${type === 'error' ? 'bg-rose-500/90 border-rose-400/20 text-white' :
                type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
                    'bg-zinc-900/90 border-white/10 text-white'
                }`}
        >
            <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-white animate-pulse' :
                type === 'success' ? 'bg-white' : 'bg-indigo-400'
                }`} />
            <span className="text-sm font-semibold tracking-tight">{message}</span>
        </motion.div>
    )
}

// Confirmation Modal Component
function ConfirmationModal({ title, message, type = 'info', onConfirm, onCancel }) {
    useScrollLock(true)
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 pt-24 md:pt-20"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-zinc-200/50 dark:border-white/10"
            >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto ${type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-zinc-100 text-zinc-600'
                    }`}>
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
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 text-center tracking-tight">{title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed text-center font-medium">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-zinc-900 dark:bg-white dark:text-zinc-900'
                        }`}>
                        Confirmar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function Suppliers() {
    // State
    const [suppliers, setSuppliers] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [selectedSupplier, setSelectedSupplier] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [confirmModal, setConfirmModal] = useState(null)
    const [toast, setToast] = useState(null)
    const [syncStatus, setSyncStatus] = useState('synced')
    const [isCloudSynced, setIsCloudSynced] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        notes: '',
        linkedItems: []
    })

    // Inventory items for linking
    const [inventoryItems, setInventoryItems] = useState([])
    const [itemSearchQuery, setItemSearchQuery] = useState('')

    // Load inventory items
    useEffect(() => {
        const loadInventory = async () => {
            try {
                const data = await FirebaseService.getInventory()
                if (data?.items) {
                    setInventoryItems(data.items)
                }
            } catch (e) {
                console.error('Error loading inventory:', e)
            }
        }
        loadInventory()
    }, [])

    // Load from cloud
    useEffect(() => {
        const loadCloud = async () => {
            try {
                const cloudData = await FirebaseService.getSuppliers()
                if (cloudData?.suppliers) {
                    setSuppliers(cloudData.suppliers)
                }
            } catch (e) {
                console.error('Error loading suppliers:', e)
            } finally {
                setIsCloudSynced(true)
            }
        }
        loadCloud()
    }, [])

    // Sync to cloud and localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers))

        if (isCloudSynced) {
            setSyncStatus('syncing')
            const timer = setTimeout(async () => {
                try {
                    const success = await FirebaseService.syncSuppliers(suppliers)
                    setSyncStatus(success ? 'synced' : 'error')
                } catch {
                    setSyncStatus('error')
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [suppliers, isCloudSynced])

    // Show toast
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type })
    }, [])

    // Filter suppliers
    const filteredSuppliers = useMemo(() => {
        if (!searchQuery.trim()) return suppliers
        const query = searchQuery.toLowerCase()
        return suppliers.filter(s =>
            s.name?.toLowerCase().includes(query) ||
            s.company?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query)
        )
    }, [suppliers, searchQuery])

    // Filter inventory items for linking
    const filteredInventoryItems = useMemo(() => {
        if (!itemSearchQuery.trim()) return inventoryItems.slice(0, 10)
        const query = itemSearchQuery.toLowerCase()
        return inventoryItems.filter(item =>
            item.name?.toLowerCase().includes(query)
        ).slice(0, 10)
    }, [inventoryItems, itemSearchQuery])

    // Open add modal
    const openAddModal = () => {
        setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            whatsapp: '',
            address: '',
            notes: '',
            linkedItems: []
        })
        setEditingSupplier(null)
        setIsModalOpen(true)
    }

    // Open edit modal
    const openEditModal = (supplier) => {
        setFormData({
            name: supplier.name || '',
            company: supplier.company || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            whatsapp: supplier.whatsapp || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
            linkedItems: supplier.linkedItems || []
        })
        setEditingSupplier(supplier)
        setSelectedSupplier(null)
        setIsModalOpen(true)
    }

    // Save supplier
    const handleSave = () => {
        if (!formData.name.trim()) {
            showToast('Nome é obrigatório', 'error')
            return
        }

        if (editingSupplier) {
            setSuppliers(prev => prev.map(s =>
                s.id === editingSupplier.id
                    ? { ...s, ...formData, updatedAt: new Date().toISOString() }
                    : s
            ))
            showToast('Fornecedor atualizado!')
        } else {
            const newSupplier = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            setSuppliers(prev => [newSupplier, ...prev])
            showToast('Fornecedor adicionado!')
        }

        setIsModalOpen(false)
        setEditingSupplier(null)
    }

    // Delete supplier
    const handleDelete = (supplier) => {
        setConfirmModal({
            title: 'Excluir Fornecedor',
            message: `Deseja excluir "${supplier.name}"? Esta ação não pode ser desfeita.`,
            type: 'danger',
            onConfirm: () => {
                setSuppliers(prev => prev.filter(s => s.id !== supplier.id))
                setSelectedSupplier(null)
                setConfirmModal(null)
                showToast('Fornecedor excluído')
            },
            onCancel: () => setConfirmModal(null)
        })
    }

    // Link item to supplier
    const linkItem = (item) => {
        if (formData.linkedItems.find(i => i.itemId === item.id)) return
        setFormData(prev => ({
            ...prev,
            linkedItems: [...prev.linkedItems, { itemId: item.id, itemName: item.name }]
        }))
        setItemSearchQuery('')
    }

    // Unlink item
    const unlinkItem = (itemId) => {
        setFormData(prev => ({
            ...prev,
            linkedItems: prev.linkedItems.filter(i => i.itemId !== itemId)
        }))
    }

    // Contact actions
    const handleCall = (phone) => {
        window.open(`tel:${phone}`, '_self')
    }

    const handleEmail = (email) => {
        window.open(`mailto:${email}`, '_self')
    }

    const handleWhatsApp = (whatsapp) => {
        const cleanNumber = whatsapp.replace(/\D/g, '')
        window.open(`https://wa.me/${cleanNumber}`, '_blank')
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-violet-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">Fornecedores</h1>
                        {/* Sync Status */}
                        <div className={`mt-2 px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${syncStatus === 'syncing' ? 'bg-amber-500/5 border-amber-500/10 text-amber-500 animate-pulse' :
                            syncStatus === 'error' ? 'bg-red-500/5 border-red-500/10 text-red-500' :
                                'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500' :
                                syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                                }`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'error' ? 'Error' : 'Cloud Active'}
                            </span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Gestão de fornecedores e contatos</p>
                </div>

                <button
                    onClick={openAddModal}
                    className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                >
                    <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Fornecedor
                </button>
            </div>

            {/* Search */}
            <section className="relative z-10">
                <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-200/50 dark:border-white/10 shadow-lg">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all placeholder:text-zinc-400"
                            placeholder="Buscar fornecedor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Suppliers Grid */}
            <section className="relative z-10">
                {filteredSuppliers.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-12 border border-zinc-200/50 dark:border-white/10 text-center">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nenhum fornecedor</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Adicione seu primeiro fornecedor para começar</p>
                        <button
                            onClick={openAddModal}
                            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all"
                        >
                            Adicionar Fornecedor
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <motion.div
                                key={supplier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedSupplier(supplier)}
                                className="bg-white dark:bg-zinc-950 rounded-[2rem] p-6 border border-zinc-200/50 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                            >
                                {/* Avatar + Name */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-violet-500/25">
                                        {supplier.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{supplier.name}</h3>
                                        {supplier.company && (
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{supplier.company}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2 mb-4">
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="truncate">{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Linked Items Badge */}
                                {supplier.linkedItems?.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
                                        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                            {supplier.linkedItems.length} {supplier.linkedItems.length === 1 ? 'item' : 'itens'}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add/Edit Modal */}
            {createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4"
                            style={{ paddingTop: '80px', paddingBottom: '40px' }}
                        >
                            <ModalScrollLock />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsModalOpen(false)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-lg mx-4 my-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col"
                                style={{ maxHeight: 'calc(100vh - 100px)' }}
                            >
                                {/* Header */}
                                <div className="sticky top-0 bg-white dark:bg-zinc-900 px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between z-10 shrink-0">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                                    </h3>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 touch-manipulation"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Form */}
                                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                    {/* Contact Section */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Informações</h4>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Nome *</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                placeholder="Nome do fornecedor"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Empresa</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                placeholder="Nome da empresa"
                                                value={formData.company}
                                                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Communication Section */}
                                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                                        <h4 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Contato</h4>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Telefone</label>
                                            <input
                                                type="tel"
                                                inputMode="tel"
                                                className="w-full px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                placeholder="(00) 00000-0000"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Email</label>
                                            <input
                                                type="email"
                                                inputMode="email"
                                                className="w-full px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                placeholder="email@exemplo.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Endereço</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                placeholder="Endereço completo"
                                                value={formData.address}
                                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Linked Items Section */}
                                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                                        <h4 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Itens Vinculados</h4>

                                        {/* Search Items */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                placeholder="Buscar item do estoque..."
                                                value={itemSearchQuery}
                                                onChange={(e) => setItemSearchQuery(e.target.value)}
                                            />

                                            {/* Dropdown */}
                                            {itemSearchQuery && filteredInventoryItems.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl max-h-40 overflow-y-auto z-20">
                                                    {filteredInventoryItems.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => linkItem(item)}
                                                            className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between"
                                                        >
                                                            <span>{item.name}</span>
                                                            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Linked Items List */}
                                        {formData.linkedItems.length > 0 && (
                                            <div className="space-y-2">
                                                {formData.linkedItems.map(item => (
                                                    <div key={item.itemId} className="flex items-center justify-between px-4 py-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
                                                        <span className="text-sm font-medium text-violet-700 dark:text-violet-300">{item.itemName}</span>
                                                        <button
                                                            onClick={() => unlinkItem(item.itemId)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-violet-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                                        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Observações</label>
                                        <textarea
                                            className="w-full px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                            rows={3}
                                            placeholder="Notas adicionais..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bg-white dark:bg-zinc-900 px-6 py-5 border-t border-zinc-100 dark:border-white/5 flex gap-3 shrink-0">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] touch-manipulation"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-[2] py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-zinc-900/10 hover:shadow-xl active:scale-[0.98] transition-all touch-manipulation"
                                    >
                                        {editingSupplier ? 'Salvar' : 'Adicionar'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Supplier Detail Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedSupplier && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto p-4"
                            style={{ paddingTop: '80px', paddingBottom: '40px' }}
                        >
                            <ModalScrollLock />
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                                onClick={() => setSelectedSupplier(null)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-lg mx-4 my-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                                style={{ maxHeight: 'calc(100vh - 100px)' }}
                            >
                                {/* Header with Avatar and Close Button */}
                                <div className="relative px-6 py-8 text-center border-b border-zinc-100 dark:border-white/5">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedSupplier(null)}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-violet-500/30 mx-auto mb-4">
                                        {selectedSupplier.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{selectedSupplier.name}</h2>
                                    {selectedSupplier.company && (
                                        <p className="text-zinc-500 dark:text-zinc-400">{selectedSupplier.company}</p>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5">
                                    <div className="flex gap-3">
                                        {selectedSupplier.phone && (
                                            <button
                                                onClick={() => handleCall(selectedSupplier.phone)}
                                                className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Ligar</span>
                                            </button>
                                        )}
                                        {selectedSupplier.email && (
                                            <button
                                                onClick={() => handleEmail(selectedSupplier.email)}
                                                className="flex-1 py-4 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email</span>
                                            </button>
                                        )}
                                        {selectedSupplier.whatsapp && (
                                            <button
                                                onClick={() => handleWhatsApp(selectedSupplier.whatsapp)}
                                                className="flex-1 py-4 px-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95 touch-manipulation"
                                            >
                                                <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">WhatsApp</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="px-6 py-5 space-y-4">
                                    {selectedSupplier.address && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Endereço</h4>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedSupplier.address}</p>
                                        </div>
                                    )}

                                    {selectedSupplier.linkedItems?.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Itens Fornecidos</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedSupplier.linkedItems.map(item => (
                                                    <span key={item.itemId} className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-bold">
                                                        {item.itemName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedSupplier.notes && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Observações</h4>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedSupplier.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-6 py-5 border-t border-zinc-100 dark:border-white/5 flex gap-3">
                                    <button
                                        onClick={() => openEditModal(selectedSupplier)}
                                        className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all touch-manipulation"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedSupplier)}
                                        className="py-4 px-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] touch-manipulation"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModal && <ConfirmationModal {...confirmModal} />}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    )
}
