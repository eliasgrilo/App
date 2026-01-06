// ═══════════════════════════════════════════════════════════════════
// EXPIRY MONITORING SECTION — Premium Apple-Level Component
// Refactored: 331 → ~70 lines using extracted modules
// ═══════════════════════════════════════════════════════════════════

import React from 'react'
import { motion } from 'framer-motion'
import { getExpiryData } from '../../services/stockService'
import { ExpiryMonitoringSectionProps, ItemWithExpiry, HeroCard, QuickStats, Timeline, NoExpiryHint } from './expiryModules'

export function ExpiryMonitoringSection({ items, onConfigureItem, getTotalQuantity }: ExpiryMonitoringSectionProps): React.ReactElement {
    const itemsWithExpiry: ItemWithExpiry[] = items.filter(i => i.expiryDate).map(item => ({ ...item, expiryData: getExpiryData(item)! })).sort((a, b) => a.expiryData.days - b.expiryData.days)

    const expiredCount = itemsWithExpiry.filter(i => i.expiryData.status === 'expired').length
    const criticalCount = itemsWithExpiry.filter(i => i.expiryData.status === 'critical').length
    const warningCount = itemsWithExpiry.filter(i => i.expiryData.status === 'warning').length
    const okCount = itemsWithExpiry.filter(i => i.expiryData.status === 'ok').length

    const mostUrgent = itemsWithExpiry[0]
    const upcomingItems = itemsWithExpiry.slice(1, 5)
    const circumference = 2 * Math.PI * 45
    const noExpiryCount = items.filter(i => !i.expiryDate).length

    return (
        <section className="relative z-10 mb-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} className="relative overflow-hidden">
                <div className="absolute inset-0 transition-all duration-700" style={{ background: mostUrgent ? `linear-gradient(135deg, ${mostUrgent.expiryData.color}08 0%, transparent 50%)` : 'linear-gradient(135deg, rgba(52,199,89,0.05) 0%, transparent 50%)' }} />
                <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                            <div><h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Validade</h2><p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-0.5">Monitoramento em tempo real</p></div>
                        </div>
                    </div>
                    {/* Hero Section */}
                    {mostUrgent ? (
                        <div className="px-8 py-6"><HeroCard item={mostUrgent} getTotalQuantity={getTotalQuantity} onConfigureItem={onConfigureItem} circumference={circumference} /></div>
                    ) : (
                        <div className="px-8 py-12 text-center"><div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4"><svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Tudo sob controle</h3><p className="text-sm text-zinc-500">Nenhum item com data de validade cadastrada</p></div>
                    )}
                    {/* Quick Stats Bar */}
                    {itemsWithExpiry.length > 0 && <QuickStats expiredCount={expiredCount} criticalCount={criticalCount} warningCount={warningCount} okCount={okCount} totalItems={itemsWithExpiry.length} />}
                    {/* Timeline View */}
                    {upcomingItems.length > 0 && <Timeline items={upcomingItems} onConfigureItem={onConfigureItem} />}
                    {/* Items without expiry hint */}
                    {noExpiryCount > 0 && <NoExpiryHint count={noExpiryCount} />}
                </div>
            </motion.div>
        </section>
    )
}

export default ExpiryMonitoringSection
