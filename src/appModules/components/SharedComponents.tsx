// ═══════════════════════════════════════════════════════════════════
// APP MODULE — Shared Components
// Background, Loader, FAB
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'

export function AmbientBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[100px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-violet-500/[0.03] via-rose-500/[0.02] to-transparent blur-[100px] rounded-full" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjAzIiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4=')] opacity-50 dark:opacity-30" />
        </div>
    )
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm text-zinc-400 font-medium">Carregando...</span>
            </div>
        </div>
    )
}

interface MobileSettingsFABProps {
    onOpen: () => void
}

export function MobileSettingsFAB({ onOpen }: MobileSettingsFABProps) {
    return (
        <motion.button
            onClick={onOpen}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed md:hidden z-50 flex items-center justify-center w-14 h-14 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-lg border border-black/5 dark:border-white/10"
            style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))', right: '20px' }}
            whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}
        >
            <svg className="w-6 h-6 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </motion.button>
    )
}
