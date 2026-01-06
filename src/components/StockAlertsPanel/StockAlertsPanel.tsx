// ═══════════════════════════════════════════════════════════════════
// STOCK ALERTS PANEL — Visual dashboard for low stock items
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import { useStockAlerts } from '../../hooks/useStockAlerts'

export function StockAlertsPanel() {
    const { alerts, criticalCount, warningCount, hasAlerts } = useStockAlerts()

    if (!hasAlerts) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 dark:bg-emerald-500/10 rounded-[2rem] p-8 border border-emerald-200/50 dark:border-emerald-500/20 text-center"
            >
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-1">Estoque OK</h3>
                <p className="text-sm text-emerald-600/70 dark:text-emerald-400/60">Todos os itens estão com níveis adequados</p>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-zinc-200/50 dark:border-white/10 overflow-hidden shadow-xl"
        >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            {criticalCount > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-red-500/40"
                                >
                                    {criticalCount}
                                </motion.div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Alertas de Estoque</h3>
                            <p className="text-xs text-zinc-400">{alerts.length} item{alerts.length > 1 ? 's' : ''} precisando de atenção</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {criticalCount > 0 && (
                            <span className="px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-500/20">
                                {criticalCount} Crítico{criticalCount > 1 ? 's' : ''}
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">
                                {warningCount} Baixo{warningCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert Items */}
            <div className="divide-y divide-zinc-100 dark:divide-white/5 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                    {alerts.map((alert, index) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        >
                            {/* Severity Indicator */}
                            <div className={`w-2 h-12 rounded-full ${alert.severity === 'critical'
                                    ? 'bg-gradient-to-b from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                                    : 'bg-gradient-to-b from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30'
                                }`} />

                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-zinc-900 dark:text-white truncate">{alert.itemName}</h4>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${alert.severity === 'critical'
                                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                        }`}>
                                        {alert.severity === 'critical' ? 'Crítico' : 'Baixo'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        Atual: <span className={`font-semibold ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                                            }`}>{alert.currentStock.toFixed(1)} {alert.unit}</span>
                                    </span>
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                        Mín: {alert.minStock} {alert.unit}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-24 hidden sm:block">
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((alert.currentStock / alert.minStock) * 100, 100)}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                        className={`h-full rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                                            }`}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-400 text-center mt-1">
                                    {((alert.currentStock / alert.minStock) * 100).toFixed(0)}% do mínimo
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export default StockAlertsPanel
