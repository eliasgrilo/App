/**
 * NotificationCenter - Apple-quality notification center with history and actions
 * Features: Animated dropdown, grouped notifications, swipe actions, badge count
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, NOTIFICATION_TYPES } from '../services/notificationService'

// Format relative time
const timeAgo = (date) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return past.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// Category colors and icons
const categoryStyles = {
    inventory: { bg: 'bg-amber-500/10', text: 'text-amber-600', dark: 'dark:text-amber-400' },
    price: { bg: 'bg-violet-500/10', text: 'text-violet-600', dark: 'dark:text-violet-400' },
    anomaly: { bg: 'bg-rose-500/10', text: 'text-rose-600', dark: 'dark:text-rose-400' },
    forecast: { bg: 'bg-blue-500/10', text: 'text-blue-600', dark: 'dark:text-blue-400' },
    activity: { bg: 'bg-zinc-500/10', text: 'text-zinc-600', dark: 'dark:text-zinc-400' },
    reports: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dark: 'dark:text-emerald-400' },
    analytics: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', dark: 'dark:text-indigo-400' },
    supplier: { bg: 'bg-orange-500/10', text: 'text-orange-600', dark: 'dark:text-orange-400' }
}

// Priority badges
const priorityBadge = (level) => {
    if (level >= 4) return { label: 'Urgente', className: 'bg-rose-500 text-white' }
    if (level >= 3) return { label: 'Alta', className: 'bg-amber-500 text-white' }
    return null
}

// Notification Item Component
const NotificationItem = ({ notification, onRead, onDismiss, onAction }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const category = notification.typeConfig?.category || 'activity'
    const style = categoryStyles[category] || categoryStyles.activity
    const priority = priorityBadge(notification.priority?.level)

    const handleClick = () => {
        if (!notification.read) {
            onRead(notification.id)
        }
        if (notification.isBatch) {
            setIsExpanded(!isExpanded)
        } else if (notification.onClick) {
            notification.onClick()
        } else if (notification.productId && onAction) {
            onAction(notification)
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
            className={`relative group ${notification.read ? 'opacity-60' : ''}`}
        >
            <motion.div
                onClick={handleClick}
                className={`
                    p-4 rounded-2xl cursor-pointer transition-all duration-200
                    ${notification.read ? 'bg-zinc-50 dark:bg-zinc-800/30' : 'bg-white dark:bg-zinc-800'}
                    hover:bg-zinc-100 dark:hover:bg-zinc-700/50
                    border border-zinc-200/50 dark:border-zinc-700/50
                    ${!notification.read ? 'shadow-sm' : ''}
                `}
                whileTap={{ scale: 0.98 }}
            >
                {/* Header */}
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                        ${style.bg}
                    `}>
                        {notification.icon || notification.typeConfig?.icon || '🔔'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-semibold truncate ${notification.read ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                {notification.title}
                            </h4>
                            {priority && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${priority.className}`}>
                                    {priority.label}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {notification.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-medium uppercase tracking-wide ${style.text} ${style.dark}`}>
                                {category}
                            </span>
                            <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                            <span className="text-[10px] text-zinc-400">
                                {timeAgo(notification.createdAt || notification.timestamp)}
                            </span>
                        </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    )}
                </div>

                {/* Batch items */}
                <AnimatePresence>
                    {isExpanded && notification.isBatch && notification.batchItems && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2 overflow-hidden"
                        >
                            {notification.batchItems.map((item, i) => (
                                <div
                                    key={item.id || i}
                                    className="text-xs text-zinc-600 dark:text-zinc-300 pl-3 border-l-2 border-zinc-200 dark:border-zinc-600"
                                >
                                    <span className="font-medium">{item.title}</span>
                                    {item.body && <span className="text-zinc-400"> - {item.body}</span>}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Dismiss button (shows on hover) */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDismiss(notification.id)
                }}
                className="
                    absolute top-2 right-2 w-6 h-6 rounded-full
                    bg-zinc-200/80 dark:bg-zinc-700/80
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity
                    hover:bg-zinc-300 dark:hover:bg-zinc-600
                "
            >
                <span className="text-zinc-500 dark:text-zinc-400 text-xs">✕</span>
            </button>
        </motion.div>
    )
}

// Empty State
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <span className="text-3xl">🔔</span>
        </div>
        <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
            Nenhuma notificação
        </h3>
        <p className="text-xs text-zinc-400">
            Quando houver atualizações, elas aparecerão aqui
        </p>
    </div>
)

// Filter Tabs
const FilterTab = ({ label, active, count, onClick }) => (
    <button
        onClick={onClick}
        className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
            ${active
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }
        `}
    >
        {label}
        {count > 0 && (
            <span className={`ml-1.5 ${active ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                {count}
            </span>
        )}
    </button>
)

// Main Notification Center Component
export default function NotificationCenter({ isOpen, onClose, onNotificationAction }) {
    const {
        history,
        unreadCount,
        markAsRead,
        markAllAsRead,
        dismiss,
        clearAll
    } = useNotifications()

    const [filter, setFilter] = useState('all') // 'all' | 'unread' | category
    const panelRef = useRef(null)

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose?.()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    // Filter notifications
    const filteredNotifications = history.filter(n => {
        if (filter === 'all') return !n.dismissed
        if (filter === 'unread') return !n.read && !n.dismissed
        return n.typeConfig?.category === filter && !n.dismissed
    })

    // Group by date
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = new Date(notification.createdAt || notification.timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let key = 'earlier'
        if (date.toDateString() === today.toDateString()) {
            key = 'today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'yesterday'
        } else if (today - date < 7 * 24 * 60 * 60 * 1000) {
            key = 'this_week'
        }

        if (!groups[key]) groups[key] = []
        groups[key].push(notification)
        return groups
    }, {})

    const groupLabels = {
        today: 'Hoje',
        yesterday: 'Ontem',
        this_week: 'Esta semana',
        earlier: 'Anteriores'
    }

    // Category counts
    const categoryCounts = history.reduce((acc, n) => {
        if (!n.dismissed) {
            const cat = n.typeConfig?.category || 'activity'
            acc[cat] = (acc[cat] || 0) + 1
        }
        return acc
    }, {})

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="
                        absolute top-full right-0 mt-2 w-[380px] max-h-[70vh]
                        bg-white dark:bg-zinc-900
                        rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700
                        overflow-hidden z-50
                        flex flex-col
                    "
                >
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                                Notificações
                            </h2>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                    >
                                        Marcar todas como lidas
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    <span className="text-zinc-500 dark:text-zinc-400">✕</span>
                                </button>
                            </div>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <FilterTab
                                label="Todas"
                                active={filter === 'all'}
                                count={history.filter(n => !n.dismissed).length}
                                onClick={() => setFilter('all')}
                            />
                            <FilterTab
                                label="Não lidas"
                                active={filter === 'unread'}
                                count={unreadCount}
                                onClick={() => setFilter('unread')}
                            />
                            {Object.entries(categoryCounts)
                                .filter(([_, count]) => count > 2)
                                .slice(0, 3)
                                .map(([category, count]) => (
                                    <FilterTab
                                        key={category}
                                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                                        active={filter === category}
                                        count={count}
                                        onClick={() => setFilter(category)}
                                    />
                                ))
                            }
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                        {filteredNotifications.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(groupLabels).map(([key, label]) => {
                                    const items = groupedNotifications[key]
                                    if (!items?.length) return null

                                    return (
                                        <div key={key}>
                                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">
                                                {label}
                                            </h3>
                                            <div className="space-y-2">
                                                <AnimatePresence mode="popLayout">
                                                    {items.map(notification => (
                                                        <NotificationItem
                                                            key={notification.id}
                                                            notification={notification}
                                                            onRead={markAsRead}
                                                            onDismiss={dismiss}
                                                            onAction={onNotificationAction}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {history.length > 0 && (
                        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
                            <button
                                onClick={clearAll}
                                className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                Limpar todas as notificações
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Notification Bell Button with Badge
export function NotificationBell({ onClick }) {
    const { unreadCount, latestNotification } = useNotifications()
    const [showPulse, setShowPulse] = useState(false)

    // Pulse animation when new notification arrives
    useEffect(() => {
        if (latestNotification) {
            setShowPulse(true)
            const timer = setTimeout(() => setShowPulse(false), 2000)
            return () => clearTimeout(timer)
        }
    }, [latestNotification])

    return (
        <motion.button
            onClick={onClick}
            className="relative p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            whileTap={{ scale: 0.95 }}
        >
            {/* Bell icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-600 dark:text-zinc-400">
                <path
                    d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                    fill="currentColor"
                />
            </svg>

            {/* Badge */}
            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 flex items-center justify-center"
                    >
                        <span className="text-[10px] font-bold text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pulse animation */}
            {showPulse && (
                <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-blue-500 rounded-xl"
                />
            )}
        </motion.button>
    )
}

// Toast Notification for real-time display
export function NotificationToast() {
    const { latestNotification, markAsRead } = useNotifications()
    const [visible, setVisible] = useState(false)
    const [currentNotification, setCurrentNotification] = useState(null)

    useEffect(() => {
        if (latestNotification && !latestNotification.read) {
            setCurrentNotification(latestNotification)
            setVisible(true)

            const timer = setTimeout(() => {
                setVisible(false)
            }, 5000)

            return () => clearTimeout(timer)
        }
    }, [latestNotification])

    const handleDismiss = () => {
        setVisible(false)
        if (currentNotification) {
            markAsRead(currentNotification.id)
        }
    }

    const style = categoryStyles[currentNotification?.typeConfig?.category] || categoryStyles.activity

    return (
        <AnimatePresence>
            {visible && currentNotification && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="
                        fixed top-4 left-1/2 z-[9999] w-[90%] max-w-[400px]
                        bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl
                        border border-zinc-200 dark:border-zinc-700
                        p-4 cursor-pointer
                    "
                    onClick={handleDismiss}
                >
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${style.bg}`}>
                            {currentNotification.icon || currentNotification.typeConfig?.icon || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
                                {currentNotification.title}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                {currentNotification.body}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDismiss()
                            }}
                            className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                            <span className="text-xs text-zinc-400">✕</span>
                        </button>
                    </div>

                    {/* Progress bar */}
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className="absolute bottom-0 left-0 h-0.5 bg-blue-500 rounded-full"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
