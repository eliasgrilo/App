// ═══════════════════════════════════════════════════════════════════
// STOCK LEVELS SECTION — Apple Vision Pro Design
// Refactored: 235 → ~60 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { StockLevelsSectionProps, StatusTile, StockItemRow } from './stockLevelsModules'

export function StockLevelsSection({ items, getStockStatus, getTotalQuantity, onConfigureItem }: StockLevelsSectionProps): React.ReactElement {
    const [stockFilter, setStockFilter] = useState<string>('all'); const [stockSearchQuery, setStockSearchQuery] = useState('')

    const tiles = [
        { id: 'critical', label: 'Estoque Crítico', subtitle: 'Pânico - Comprar AGORA', count: items.filter(i => getStockStatus(i) === 'low').length, color: 'red', filter: 'critical' },
        { id: 'minStock', label: 'Estoque Mínimo', subtitle: 'Planejamento - Fazer pedido', count: items.filter(i => getStockStatus(i) === 'warning').length, color: 'orange', filter: 'minStock' },
        { id: 'maxStock', label: 'Estoque Máximo', subtitle: 'Evitar Desperdício', count: items.filter(i => getStockStatus(i) === 'high').length, color: 'green', filter: 'maxStock' },
        { id: 'noLimit', label: 'Sem Limite', subtitle: 'Configurar estoque mínimo', count: items.filter(i => getStockStatus(i) === 'noLimit').length, color: 'gray', filter: 'noLimits' }
    ]

    const filteredItems = items.filter(item => {
        const status = getStockStatus(item)
        if (stockFilter === 'noLimits') return status === 'noLimit'; if (stockFilter === 'critical') return status === 'low'; if (stockFilter === 'minStock') return status === 'warning'; if (stockFilter === 'maxStock') return status === 'high'
        return true
    }).filter(item => !stockSearchQuery.trim() || item.name.toLowerCase().includes(stockSearchQuery.toLowerCase())).slice(0, 8)

    return (
        <section className="relative z-10 mb-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Níveis</h2><p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Monitoramento de estoque</p></div><div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"><span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">{items.length} itens</span></div></div>
                </div>
                {/* Status Grid */}
                <div className="px-6 pb-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{tiles.map(tile => <StatusTile key={tile.id} tile={tile} isSelected={stockFilter === tile.filter} onClick={() => setStockFilter(stockFilter === tile.filter ? 'all' : tile.filter)} />)}</div></div>
                {/* Search */}
                <div className="px-6 pb-4"><div className="relative"><div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input type="text" placeholder="Buscar item..." value={stockSearchQuery} onChange={e => setStockSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 border border-transparent focus:border-zinc-300" /></div></div>
                {/* Items List */}
                <div className="px-6 pb-4 max-h-[360px] overflow-y-auto">
                    <div className="space-y-2">{filteredItems.map(item => <StockItemRow key={item.id} item={item} status={getStockStatus(item)} total={getTotalQuantity(item)} onClick={() => onConfigureItem(item)} />)}</div>
                    {items.length === 0 && <div className="text-center py-12"><div className="w-12 h-12 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3"><svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div><p className="text-sm text-zinc-500">Nenhum item encontrado</p></div>}
                </div>
            </motion.div>
        </section>
    )
}

export default StockLevelsSection
