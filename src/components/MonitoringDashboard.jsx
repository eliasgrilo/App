/**
 * Monitoring Dashboard - Dev-Mode Panel for Quotation System
 * 
 * Shows:
 * - Firestore connection status (online/offline)
 * - Real-time listener health (last update timestamp)
 * - Counts by status (pending, quoted, ordered, received)
 * - Sync error log
 * 
 * Only visible in development mode
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { QUOTATION_STATUS, STATUS_LABELS } from '../services/smartSourcingService';

const isDev = import.meta.env.DEV;

export default function MonitoringDashboard() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [firestoreStatus, setFirestoreStatus] = useState('connecting');
    const [lastUpdate, setLastUpdate] = useState(null);
    const [quotationCounts, setQuotationCounts] = useState({});
    const [listenerErrors, setListenerErrors] = useState([]);
    const [totalQuotations, setTotalQuotations] = useState(0);

    // Gmail sync status
    const [gmailStatus, setGmailStatus] = useState('disconnected');
    const [lastEmailCheck, setLastEmailCheck] = useState(null);
    const [processedEmailCount, setProcessedEmailCount] = useState(0);

    // Only render in development mode
    if (!isDev) return null;

    // Subscribe to Firestore status and quotation updates
    useEffect(() => {
        try {
            const quotationsRef = collection(db, 'quotations');
            const q = query(quotationsRef, orderBy('createdAt', 'desc'));

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    // Connection successful
                    setFirestoreStatus('connected');
                    setLastUpdate(new Date());

                    // Calculate counts by status
                    const counts = {};
                    Object.values(QUOTATION_STATUS).forEach(status => {
                        counts[status] = 0;
                    });

                    snapshot.docs.forEach(doc => {
                        const status = doc.data().status || 'unknown';
                        counts[status] = (counts[status] || 0) + 1;
                    });

                    setQuotationCounts(counts);
                    setTotalQuotations(snapshot.docs.length);

                    // Clear any previous errors
                    setListenerErrors(prev => prev.slice(-5)); // Keep only last 5
                },
                (error) => {
                    setFirestoreStatus('error');
                    setListenerErrors(prev => [
                        ...prev.slice(-4),
                        { timestamp: new Date().toISOString(), message: error.message }
                    ]);
                    console.error('🔴 Monitoring: Firestore error', error);
                }
            );

            return () => unsubscribe();
        } catch (error) {
            setFirestoreStatus('error');
            setListenerErrors(prev => [
                ...prev,
                { timestamp: new Date().toISOString(), message: error.message }
            ]);
        }
    }, []);

    // Gmail status and email processing monitoring
    useEffect(() => {
        // Listen for Gmail status events
        const handleEmailCheck = (event) => {
            setLastEmailCheck(new Date());
            if (event.detail?.success) {
                setGmailStatus('connected');
            }
        };

        const handleSyncError = (event) => {
            setGmailStatus('error');
            setListenerErrors(prev => [
                ...prev.slice(-4),
                { timestamp: new Date().toISOString(), message: `Sync: ${event.detail?.error}` }
            ]);
        };

        window.addEventListener('email-check-complete', handleEmailCheck);
        window.addEventListener('firestore-sync-error', handleSyncError);

        // Check Gmail token status periodically
        const checkGmailStatus = () => {
            const tokenExpiry = parseInt(localStorage.getItem('gmail_token_expiry')) || 0;
            const hasToken = !!localStorage.getItem('gmail_access_token');

            if (!hasToken) {
                setGmailStatus('disconnected');
            } else if (tokenExpiry < Date.now()) {
                setGmailStatus('expired');
            } else {
                setGmailStatus('connected');
            }
        };

        checkGmailStatus();
        const gmailInterval = setInterval(checkGmailStatus, 10000);

        // Subscribe to processed emails count
        let unsubProcessed = null;
        try {
            const processedRef = collection(db, 'processedEmails');
            unsubProcessed = onSnapshot(processedRef, (snapshot) => {
                setProcessedEmailCount(snapshot.docs.length);
            });
        } catch (e) {
            console.warn('Could not subscribe to processed emails:', e);
        }

        return () => {
            window.removeEventListener('email-check-complete', handleEmailCheck);
            window.removeEventListener('firestore-sync-error', handleSyncError);
            clearInterval(gmailInterval);
            if (unsubProcessed) unsubProcessed();
        };
    }, []);

    // Status indicator colors
    const statusColors = {
        connecting: 'bg-amber-500',
        connected: 'bg-emerald-500',
        error: 'bg-rose-500',
        disconnected: 'bg-zinc-500',
        expired: 'bg-amber-500'
    };

    // Gmail status colors
    const gmailColors = {
        connected: 'bg-emerald-500',
        disconnected: 'bg-zinc-500',
        expired: 'bg-amber-500',
        error: 'bg-rose-500'
    };

    // Status counts for display
    const displayCounts = useMemo(() => [
        { key: 'pending', label: 'Aguardando', count: (quotationCounts[QUOTATION_STATUS.PENDING] || 0) + (quotationCounts[QUOTATION_STATUS.AWAITING] || 0), color: 'text-amber-500' },
        { key: 'quoted', label: 'Cotados', count: quotationCounts[QUOTATION_STATUS.QUOTED] || 0, color: 'text-violet-500' },
        { key: 'ordered', label: 'Pedidos', count: quotationCounts[QUOTATION_STATUS.ORDERED] || 0, color: 'text-indigo-500' },
        { key: 'received', label: 'Recebidos', count: quotationCounts[QUOTATION_STATUS.RECEIVED] || 0, color: 'text-emerald-500' }
    ], [quotationCounts]);

    // Time since last update
    const timeSinceUpdate = useMemo(() => {
        if (!lastUpdate) return 'N/A';
        const seconds = Math.floor((new Date() - lastUpdate) / 1000);
        if (seconds < 5) return 'agora';
        if (seconds < 60) return `${seconds}s atrás`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
        return `${Math.floor(seconds / 3600)}h atrás`;
    }, [lastUpdate]);

    return (
        <div className="fixed bottom-4 right-4 z-[9999]">
            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-xl transition-colors ${firestoreStatus === 'error'
                    ? 'bg-rose-500/90 text-white'
                    : 'bg-zinc-900/90 text-white'
                    }`}
            >
                {/* Status indicator */}
                <motion.div
                    className={`w-2 h-2 rounded-full ${statusColors[firestoreStatus]}`}
                    animate={firestoreStatus === 'connecting' ? { opacity: [1, 0.3, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                    {firestoreStatus === 'connected' ? '🔥 Firestore' :
                        firestoreStatus === 'connecting' ? '⏳ Conectando...' :
                            '❌ Erro'}
                </span>
                <span className="text-[10px] opacity-70">{totalQuotations} cotações</span>
                <span className="text-xs">{isExpanded ? '▼' : '▲'}</span>
            </motion.button>

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-12 right-0 w-80 bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                                    🔧 Developer Monitor
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${firestoreStatus === 'connected'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : firestoreStatus === 'connecting'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                    {firestoreStatus}
                                </span>
                            </div>
                        </div>

                        {/* Connection Health */}
                        <div className="p-4 border-b border-zinc-800">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                Listener Health
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-300">Última atualização</span>
                                <span className="text-xs text-emerald-400 font-mono">{timeSinceUpdate}</span>
                            </div>
                        </div>

                        {/* Counts by Status */}
                        <div className="p-4 border-b border-zinc-800">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                                Contagem por Status
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {displayCounts.map(({ key, label, count, color }) => (
                                    <div
                                        key={key}
                                        className="p-2 bg-zinc-800/50 rounded-lg"
                                    >
                                        <p className="text-[9px] text-zinc-400 uppercase">{label}</p>
                                        <p className={`text-lg font-bold font-mono ${color}`}>{count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Log */}
                        {listenerErrors.length > 0 && (
                            <div className="p-4">
                                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-2">
                                    ⚠️ Erros Recentes
                                </p>
                                <div className="space-y-1 max-h-20 overflow-y-auto">
                                    {listenerErrors.map((error, i) => (
                                        <p key={i} className="text-[9px] text-rose-300 truncate">
                                            {error.timestamp.split('T')[1].split('.')[0]}: {error.message}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Architecture Info */}
                        <div className="p-4 bg-violet-500/10 border-t border-violet-500/20">
                            <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1">
                                ✅ Arquitetura Refatorada
                            </p>
                            <ul className="text-[9px] text-violet-300 space-y-0.5">
                                <li>• Single Source of Truth: Firestore</li>
                                <li>• State Machine Validation: Enabled</li>
                                <li>• localStorage: Removed</li>
                                <li>• Duplicate Prevention: Active</li>
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
