import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Reorder, motion, AnimatePresence, useDragControls } from 'framer-motion'
import Cropper from 'react-easy-crop'
import getCroppedImg from './utils/cropUtils'
import { useScrollLock } from './hooks/useScrollLock'
import { useModal } from './contexts/ModalContext'
import { useToast } from './contexts/ToastContext'
import { useAppStore, useRecipes as useStoreRecipes } from './stores/useAppStore'
import { NewRecipe } from './types'
import { RecipeCategoryModal, ImageCropperModal, ImageLightbox, IngredientItem, InstructionItem, Icons, SectionWrapper, getCategoryName, getCategoryColor, compressImage } from './recipesModules'

/**
 * Recipes - Ultra-Premium Editorial Design v2.0
 */


export default function Recipes() {
    const { toast } = useToast()

    // Zustand Store - persistent state
    const recipes = useStoreRecipes()
    const { addRecipe: storeAddRecipe, updateRecipe: storeUpdateRecipe, removeRecipe: storeRemoveRecipe } = useAppStore()

    const [categories, setCategories] = useState(['Tradicionais', 'Especiais', 'Veganas', 'Doces'])
    const [selectedId, setSelectedId] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [activeFilter, setActiveFilter] = useState('Todas')
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<any>(null)
    const [zoomedImage, setZoomedImage] = useState<any>(null)
    const { modal } = useModal()
    const [showCatModal, setShowCatModal] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [syncError, setSyncError] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [imageToCrop, setImageToCrop] = useState<any>(null) // FIX: Added missing state
    const scrollRef = useRef(null)
    const fileInputRef = useRef(null) // FIX: Added missing ref
    const pendingChangesRef = useRef({}) // ID -> collected changes
    const saveTimeoutsRef = useRef({}) // ID -> timeout handle


    // Initialize loading state
    useEffect(() => {
        setLoading(false)
        setLoadError(null)
    }, [])

    // Update recipe - syncs to Zustand store
    const updateRecipe = (id: any, changes: any) => {
        setSyncing(true)
        setSyncError(false)

        storeUpdateRecipe(id, { ...changes, updatedAt: new Date().toISOString() })

        // Simulate brief sync indicator
        setTimeout(() => setSyncing(false), 300)
    }


    // --- IMAGE CROPPER FLOW ---
    const handleImageUpload = (e: any) => {
        const file = e.target.files[0]
        if (!file) return

        if (!selectedId) {
            toast.error('Nenhuma receita selecionada.')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setImageToCrop(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Reset input so same file can be selected again
        e.target.value = null
    }

    const onCropComplete = async (croppedImage: any) => {
        try {
            setIsUploading(true)
            setImageToCrop(null) // Close modal

            // Compress the cropped image result
            const compressed = await compressImage(croppedImage)
            updateRecipe(selectedId, { image: compressed })

            toast.success('Imagem atualizada!')
        } catch (err) {
            console.error(err)
            toast.error('Erro ao processar imagem.')
        } finally {
            setIsUploading(false)
        }
    }


    const handleDeleteRecipe = (id: any) => {
        modal.close()
        storeRemoveRecipe(id)

        if (String(selectedId) === String(id)) {
            setSelectedId(null)
        }
    }

    const filtered = useMemo(() => recipes.filter(r => activeFilter === 'Todas' || r.category === activeFilter), [recipes, activeFilter])
    const selected = useMemo(() => recipes.find(r => String(r.id) === String(selectedId)), [recipes, selectedId])

    // Finish editing: clean up empty rows from all sections before exiting edit mode
    const finishEditing = useCallback(() => {
        if (selected && selected?.sections) {
            const cleanedSections = selected.sections?.map((section: any) => {
                if (section.type === 'ingredients') {
                    return {
                        ...section,
                        items: (section.items || []).filter((item: any) => item.name.trim() || item.quantity.trim())
                    }
                }
                if (section.type === 'instructions') {
                    return {
                        ...section,
                        items: (section.items || []).filter((item: any) => item.text.trim())
                    }
                }
                return section
            })
            updateRecipe(selectedId, { sections: cleanedSections })
        }
        setIsEditing(false)
    }, [selected, selectedId, updateRecipe])

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-zinc-200/80 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Carregando receitas...</p>
            </div>
        </div>
    )

    // Error state with retry option
    if (loadError) return (
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-6">
            <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Erro de Conexão</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">{loadError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            {/* Ultra-Subtle Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            {/* --- LIST VIEW --- */}
            <AnimatePresence>
                {!selectedId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="relative z-10"
                    >
                        {/* Header */}
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">Receitas</h1>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-medium">Bíblia culinária & fichas de produção</p>
                            </div>
                            <button
                                onClick={() => {
                                    const newId = String(Date.now())
                                    const newR = {
                                        id: parseInt(newId),
                                        name: 'Nova Criação',
                                        category: 'Tradicionais',
                                        prepTime: 30,
                                        cookTime: 15,
                                        image: null,
                                        sections: [
                                            { id: Date.now(), type: 'ingredients', title: 'BASE', items: [] },
                                            { id: Date.now() + 1, type: 'instructions', title: 'PASSOS', items: [] }
                                        ],
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString()
                                    }
                                    storeAddRecipe(newR as unknown as NewRecipe)
                                    setSelectedId(newId)
                                    setIsEditing(true)
                                }}
                                className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                <Icons.Plus />
                                Criar Nova Receita
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="sticky top-4 z-30 mb-8 py-4 overflow-x-auto scrollbar-hidden bg-zinc-50/80 dark:bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-50/50">
                            <div className="flex items-center gap-2 w-max">
                                {['Todas', ...categories].map(cat => (
                                    <button
                                        key={getCategoryName(cat)} onClick={() => setActiveFilter(getCategoryName(cat))}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeFilter === getCategoryName(cat) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/50 dark:border-zinc-800'}`}
                                    >
                                        {getCategoryName(cat)}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowCatModal(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200/50 dark:border-zinc-800 text-zinc-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all bg-white dark:bg-zinc-900 shadow-sm active:scale-90"
                                    title="Gerenciar Biblioteca"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {filtered.map(r => (
                                <motion.div
                                    key={r.id} onClick={() => { setSelectedId(r.id); setIsEditing(false); }}
                                    className="group relative z-20 bg-white dark:bg-zinc-950 rounded-[2rem] p-4 border border-zinc-200/50 dark:border-white/10 md:hover:border-zinc-300 md:dark:hover:border-white/20 transition-all cursor-pointer shadow-xl md:hover:shadow-2xl md:hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-6 shadow-inner">
                                        {r.image ? (
                                            <motion.img src={r.image} className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105" />
                                        ) : (
                                            /* Premium List View Placeholder - Static for performance */
                                            <div className="w-full h-full relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-950 dark:to-black"></div>
                                                {/* Static gradient overlays - no animation for performance */}
                                                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/8 via-transparent to-transparent opacity-60"></div>
                                                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/8 via-transparent to-transparent opacity-60"></div>

                                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 md:group-hover:opacity-80 transition-opacity">
                                                    <div className="w-12 h-12 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2 shadow-lg md:group-hover:scale-110 transition-transform duration-500">
                                                        <Icons.Camera />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity" />

                                        {/* Apple-style Delete Button */}
                                        <button
                                            onClick={(e: any) => {
                                                e.stopPropagation()
                                                modal.confirm({
                                                    title: 'Excluir Receita',
                                                    message: `Tem certeza que deseja excluir "${r.name}"? Esta ação é irreversível.`,
                                                    isDangerous: true,
                                                    onConfirm: () => {
                                                        handleDeleteRecipe(r.id)
                                                    }
                                                })
                                            }}
                                            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/30 hover:bg-rose-500/90 backdrop-blur-md text-white/90 hover:text-white opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform scale-90 hover:scale-100 hover:shadow-lg z-[100] border border-white/10 active:scale-95 touch-manipulation cursor-pointer"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="px-2 pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span
                                                className="inline-block px-2.5 py-1 text-[10px] font-medium tracking-wide rounded-lg"
                                                style={{
                                                    backgroundColor: `${getCategoryColor(categories, r.category)}15`,
                                                    color: getCategoryColor(categories, r.category)
                                                }}
                                            >
                                                {r.category}
                                            </span>
                                            <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Icons.Clock />
                                                    {Number(r.prepTime) + Number(r.cookTime)}m
                                                </div>
                                                {(r.temperature || 0) > 0 && (
                                                    <>
                                                        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700" />
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                            </svg>
                                                            {r.temperature}°
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-bold leading-tight text-zinc-900 dark:text-white md:group-hover:text-indigo-600 md:dark:group-hover:text-indigo-400 transition-colors mb-1">{r.name}</h3>
                                        <p className="text-xs font-medium text-zinc-400">{(r?.sections || []).filter((s: any) => s.type === 'ingredients').reduce((acc: any, s: any) => acc + (s.items?.length || 0), 0)} ingredientes</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Empty State */}
                            {filtered.length === 0 && (
                                <div className="col-span-full py-32 text-center rounded-[3rem] border border-zinc-200/50 dark:border-white/5 bg-white/30 dark:bg-white/[0.02] backdrop-blur-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent" />

                                    <div className="relative z-10">
                                        <div className="w-24 h-24 mx-auto mb-8 relative">
                                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                            <div className="relative w-full h-full bg-white dark:bg-zinc-900 rounded-full border border-zinc-100/80 dark:border-zinc-800 flex items-center justify-center shadow-2xl">
                                                <Icons.Book />
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">Expandir a Coleção</h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                            Nenhuma receita encontrada em <span className="text-zinc-900 dark:text-zinc-200 font-bold">{activeFilter}</span>.
                                            Que tal criar algo novo?
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- DETAIL VIEW (EDITOR) --- */}
            {
                typeof document !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {selectedId && selected && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                                className="fixed inset-0 z-[9999] bg-white dark:bg-black overflow-y-auto"
                                ref={scrollRef}
                            >
                                {/* Fallback check if selected became null during exit */}
                                {selected ? (
                                    <>
                                        {/* 1. Minimalist Sticky Header */}
                                        <div className="sticky top-0 left-0 right-0 z-[101] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-100/80 dark:border-zinc-900 flex justify-between items-center px-4 md:px-6 h-16 transition-all">
                                            <div className="flex-1 flex justify-start">
                                                <button
                                                    onClick={() => {
                                                        // Cleanup empty items on exit
                                                        const cleanedSections = (selected?.sections || []).map((s: any) => ({
                                                            ...s,
                                                            items: s.items.filter((i: any) => {
                                                                if (s.type === 'ingredients') return i.name?.trim() || i.quantity?.trim()
                                                                return i.text?.trim()
                                                            })
                                                        }))
                                                        updateRecipe(selectedId, { sections: cleanedSections })
                                                        setSelectedId(null)
                                                    }}
                                                    className="p-3 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 shadow-sm group"
                                                >
                                                    <Icons.Back className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                                                </button>
                                            </div>

                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${syncError ? 'text-rose-500' : syncing ? 'text-zinc-400' : 'text-zinc-300'}`}>
                                                {syncError ? 'Falha' : syncing ? 'Sincronizando...' : 'Salvo'}
                                            </span>

                                            <div className="flex-1 flex justify-end gap-2">
                                                <button
                                                    onClick={() => isEditing ? finishEditing() : setIsEditing(true)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isEditing
                                                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30 shadow-lg'
                                                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500 hover:text-indigo-500'}`}
                                                >
                                                    {isEditing ? 'Concluído' : 'Editar'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        modal.confirm({
                                                            title: 'Excluir Receita',
                                                            message: 'Tem certeza que deseja excluir esta receita permanentemente? Esta ação não pode ser desfeita.',
                                                            isDangerous: true,
                                                            onConfirm: () => {
                                                                handleDeleteRecipe(selectedId)
                                                            }
                                                        })
                                                    }}
                                                    className="p-3 rounded-2xl text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95 transition-all group"
                                                >
                                                    <Icons.Trash className="w-5 h-5 transition-transform group-hover:scale-110" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Hybrid Layout: Mobile-First Optimized */}
                                        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-40">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-20">

                                                {/* LEFT COLUMN: Image & Stats (Sticky) */}
                                                <div className="md:col-span-5 space-y-6 md:space-y-10 md:sticky md:top-24 h-fit">

                                                    {/* Hero Image - Card Style - Responsive Aspect Ratio */}
                                                    <div className="relative aspect-video md:aspect-[4/5] rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 overflow-hidden shadow-sm border border-zinc-100/80 dark:border-zinc-800 group">
                                                        {selected.image ? (
                                                            <>
                                                                <motion.img
                                                                    src={selected.image}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                    onClick={() => setZoomedImage(selected.image)}
                                                                />
                                                                {/* Edit Icon - Top Right */}
                                                                <label className="absolute top-4 right-4 p-3 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:bg-black/50 hover:text-white transition-all cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg border border-white/10">
                                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                                                    {isUploading ? (
                                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Icons.Camera className="w-5 h-5" />
                                                                    )}
                                                                </label>
                                                            </>
                                                        ) : (
                                                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-zinc-500">
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                                <Icons.Camera />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest mt-3">Adicionar Capa</span>
                                                            </label>
                                                        )}
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                                                        {[
                                                            { label: 'Preparo', val: 'prepTime', unit: 'min' },
                                                            { label: 'Cozimento', val: 'cookTime', unit: 'min' },
                                                            { label: 'Temperatura', val: 'temperature', unit: '°C' }
                                                        ].map(stat => (
                                                            <div key={stat.label} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-3 md:p-4 border border-zinc-100/80 dark:border-zinc-800 flex flex-col items-center justify-center">
                                                                <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 md:mb-2">{stat.label}</span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <input
                                                                        value={String(selected?.[stat.val as keyof typeof selected] || "")}
                                                                        onChange={e => updateRecipe(selectedId, { [stat.val]: e.target.value })}
                                                                        className="w-full bg-transparent font-bold text-lg md:text-xl text-center text-zinc-900 dark:text-white outline-none p-0 border-none focus:ring-0 tabular-nums"
                                                                        placeholder="0"
                                                                    />
                                                                    {stat.unit && <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold">{stat.unit}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                </div>

                                                {/* RIGHT COLUMN: Form Content */}
                                                <div className="md:col-span-7 space-y-8 md:space-y-12">

                                                    {/* Header Section */}
                                                    <div className="space-y-4 md:space-y-6">
                                                        <div className="flex items-center gap-4">
                                                            <select
                                                                value={selected.category}
                                                                onChange={e => updateRecipe(selectedId, { category: e.target.value })}
                                                                className="appearance-none bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full text-zinc-600 dark:text-zinc-300 font-bold text-[11px] uppercase tracking-wider outline-none cursor-pointer hover:bg-zinc-200 transition-colors"
                                                            >
                                                                {categories.map(c => <option key={getCategoryName(c)} value={getCategoryName(c)}>{getCategoryName(c)}</option>)}
                                                            </select>
                                                        </div>

                                                        <textarea
                                                            value={selected.name}
                                                            onChange={e => updateRecipe(selectedId, { name: e.target.value })}
                                                            className="w-full bg-transparent text-3xl md:text-6xl font-black text-zinc-900 dark:text-white outline-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 leading-[1.1] tracking-tight"
                                                            placeholder="Nome da Receita"
                                                            rows={1}
                                                            onInput={e => { (e.target as HTMLElement).style.height = 'auto'; (e.target as HTMLElement).style.height = (e.target as HTMLElement).scrollHeight + 'px' }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 pb-6">
                                                        <button
                                                            disabled={!isEditing}
                                                            onClick={() => updateRecipe(selectedId, { sections: [...(selected?.sections || []), { id: Date.now(), type: 'ingredients', title: 'INGREDIENTES', items: [] }] })}
                                                            className={`py-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 group ${isEditing ? 'hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">IN</div>
                                                            + Ingredientes
                                                        </button>
                                                        <button
                                                            disabled={!isEditing}
                                                            onClick={() => updateRecipe(selectedId, { sections: [...(selected?.sections || []), { id: Date.now(), type: 'instructions', title: 'PREPARO', items: [] }] })}
                                                            className={`py-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 group ${isEditing ? 'hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">PR</div>
                                                            + Preparo
                                                        </button>
                                                    </div>

                                                    <Reorder.Group axis="y" values={selected?.sections || []} onReorder={newSections => updateRecipe(selectedId, { sections: newSections })} className="space-y-6">
                                                        {(selected?.sections || []).map((section: any) => (
                                                            <SectionWrapper key={section.id} id={section}>
                                                                {(dragControls) => (
                                                                    <RecipeSection
                                                                        section={section}
                                                                        onUpdate={(updatedSec: any) => updateRecipe(selectedId, { sections: selected.sections?.map((s: any) => s.id === section.id ? updatedSec : s) })}
                                                                        onDelete={() => updateRecipe(selectedId, { sections: selected.sections?.filter((s: any) => s.id !== section.id) })}
                                                                        dragControls={dragControls}
                                                                        isEditing={isEditing}
                                                                    />
                                                                )}
                                                            </SectionWrapper>
                                                        ))}
                                                    </Reorder.Group>

                                                    {/* Delete Recipe Button (Apple Standard Footer) */}
                                                    <div className="pt-12 pb-8 border-t border-zinc-100/80 dark:border-zinc-800">
                                                        <button
                                                            onClick={() => modal.confirm({
                                                                title: 'Excluir Receita',
                                                                message: 'Tem certeza? Esta ação é irreversível.',
                                                                isDangerous: true,
                                                                onConfirm: async () => { handleDeleteRecipe(selectedId); }
                                                            })}
                                                            className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 font-bold text-sm uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                                                        >
                                                            Excluir Receita
                                                        </button>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }

            {/* Cat Modal */}
            {
                showCatModal && (
                    <RecipeCategoryModal
                        key="recipe-cat-modal"
                        categories={categories}
                        onClose={() => setShowCatModal(false)}
                        onUpdate={setCategories}
                        onRenameCategory={(oldName, newName) => {
                            // Update all recipes in this category
                            recipes.filter(r => r.category === oldName).forEach(r => {
                                updateRecipe(r.id, { category: newName })
                            })
                        }}
                    />
                )
            }

            {/* Image Zoom Lightbox */}
            <AnimatePresence>
                {zoomedImage && <ImageLightbox src={zoomedImage} onClose={() => setZoomedImage(null)} />}
            </AnimatePresence>



            {/* Image Cropper Modal */}
            <AnimatePresence>
                {imageToCrop && (
                    <ImageCropperModal
                        imageSrc={imageToCrop}
                        onCancel={() => setImageToCrop(null)}
                        onCropComplete={onCropComplete}
                    />
                )}
            </AnimatePresence>
        </div >
    )
}

function RecipeSection({ section, onUpdate, onDelete, dragControls, isEditing }: { section: any; onUpdate: any; onDelete: any; dragControls: any; isEditing: boolean }) {
    if (section.type === 'ingredients') {
        return <IngredientsTable section={section} onUpdate={onUpdate} onDelete={onDelete} dragControls={dragControls} isEditing={isEditing} />
    }
    if (section.type === 'instructions') {
        return <InstructionsTable section={section} onUpdate={onUpdate} onDelete={onDelete} dragControls={dragControls} isEditing={isEditing} />
    }
    return null
}

function IngredientsTable({ section, onUpdate, onDelete, dragControls, isEditing }: { section: any; onUpdate: any; onDelete: any; dragControls: any; isEditing: boolean }) {
    const containerRef = React.useRef(null)

    // Add a new ingredient and scroll/focus to it
    const addNewIngredient = React.useCallback(() => {
        const newId = `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newItem = { id: newId, name: '', quantity: '', unit: 'g' }
        onUpdate({ ...section, items: [...(section.items || []), newItem] })

        // Use requestAnimationFrame to wait for DOM update
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const field = document.getElementById(`ing-name-${newId}`)
                if (field) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    field.focus()
                }
            })
        })
    }, [section, onUpdate])

    return (
        <div ref={containerRef} className="relative group/section bg-white dark:bg-black rounded-3xl p-4 md:p-6 border border-zinc-100/80 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6 pl-1">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="cursor-grab p-2 -ml-2 text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors opacity-100 md:opacity-0 md:group-hover/section:opacity-100"
                        onPointerDown={(e: any) => dragControls.start(e)}
                    >
                        <Icons.Bars className="w-5 h-5" />
                    </div>

                    {/* Badge for Type */}
                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        IN
                    </div>

                    {isEditing ? (
                        <input
                            value={section.title}
                            onChange={e => onUpdate({ ...section, title: e.target.value })}
                            className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider bg-transparent outline-none hover:text-indigo-500 transition-colors flex-1 placeholder:text-zinc-300"
                            placeholder="NOME DA SEÇÃO"
                        />
                    ) : (
                        <span className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex-1">{section.title}</span>
                    )}
                </div>
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="opacity-100 md:opacity-0 md:group-hover/section:opacity-100 text-zinc-300 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Icons.Trash />
                    </button>
                )}
            </div>

            <div className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
                <Reorder.Group axis="y" values={section.items} onReorder={newItems => isEditing && onUpdate({ ...section, items: newItems })}>
                    {section.items.map((item: any) => (
                        <IngredientItem
                            key={item.id} item={item}
                            onUpdate={u => onUpdate({ ...section, items: section.items.map((i: any) => i.id === item.id ? u : i) })}
                            onDelete={() => onUpdate({ ...section, items: section.items.filter((i: any) => i.id !== item.id) })}
                            onNext={() => {
                                // Only add new row if current has content
                                if (item.name.trim()) {
                                    addNewIngredient()
                                }
                            }}
                            isEditing={isEditing}
                        />
                    ))}
                </Reorder.Group>
            </div>

            {isEditing && (
                <button
                    type="button"
                    onClick={addNewIngredient}
                    className="mt-6 w-full py-4 rounded-xl border border-dashed border-zinc-200/80 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 active:scale-[0.98] touch-manipulation cursor-pointer select-none"
                >
                    <Icons.Plus /> Adicionar Ingrediente
                </button>
            )}
        </div>
    )
}

function InstructionsTable({ section, onUpdate, onDelete, dragControls, isEditing }: { section: any; onUpdate: any; onDelete: any; dragControls: any; isEditing: boolean }) {
    // Add a new instruction and scroll/focus to it
    const addNewInstruction = React.useCallback(() => {
        const newId = `instr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newItem = { id: newId, text: '' }
        onUpdate({ ...section, items: [...(section.items || []), newItem] })

        // Use requestAnimationFrame to wait for DOM update
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const field = document.getElementById(`instr-text-${newId}`)
                if (field) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    field.focus()
                }
            })
        })
    }, [section, onUpdate])

    return (
        <div className="relative group/section bg-white dark:bg-black rounded-3xl p-4 md:p-6 border border-zinc-100/80 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6 pl-1">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className="cursor-grab p-2 -ml-2 text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors opacity-100 md:opacity-0 md:group-hover/section:opacity-100"
                        onPointerDown={(e: any) => dragControls.start(e)}
                    >
                        <Icons.Bars className="w-5 h-5" />
                    </div>

                    {/* Badge for Type */}
                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        MP
                    </div>

                    {isEditing ? (
                        <input
                            value={section.title}
                            onChange={e => onUpdate({ ...section, title: e.target.value })}
                            className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider bg-transparent outline-none hover:text-indigo-500 transition-colors flex-1 placeholder:text-zinc-300"
                            placeholder="NOME DA SEÇÃO"
                        />
                    ) : (
                        <span className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex-1">{section.title}</span>
                    )}
                </div>
                {isEditing && (
                    <button
                        onClick={onDelete}
                        className="opacity-100 md:opacity-0 md:group-hover/section:opacity-100 text-zinc-300 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                        <Icons.Trash />
                    </button>
                )}
            </div>

            <Reorder.Group axis="y" values={section.items} onReorder={newItems => isEditing && onUpdate({ ...section, items: newItems })} className="space-y-3">
                {section.items.map((item: any, idx: number) => (
                    <InstructionItem
                        key={item.id} item={item} index={idx}
                        onUpdate={u => onUpdate({ ...section, items: section.items.map((i: any) => i.id === item.id ? u : i) })}
                        onDelete={() => onUpdate({ ...section, items: section.items.filter((i: any) => i.id !== item.id) })}
                        onNext={() => {
                            // Only add new row if current has content
                            if (item.text.trim()) {
                                addNewInstruction()
                            }
                        }}
                        isEditing={isEditing}
                    />
                ))}
            </Reorder.Group>

            {isEditing && (
                <button
                    type="button"
                    onClick={addNewInstruction}
                    className="mt-6 w-full py-4 rounded-xl border border-dashed border-zinc-200/80 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 active:scale-[0.98] touch-manipulation cursor-pointer select-none"
                >
                    <Icons.Plus /> Adicionar Passo
                </button>
            )}
        </div>
    )
}
