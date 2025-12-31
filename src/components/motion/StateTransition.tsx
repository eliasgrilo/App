/**
 * StateTransition Component - Apple-Quality Motion Design
 * 
 * Framer Motion wrapper with spring physics for state machine transitions.
 * Delivers 60fps animations with haptic feedback synchronization.
 * 
 * Design Principles:
 * - iOS Spring Physics (based on UIKit spring animations)
 * - Reduced motion support (accessibility)
 * - Haptic sync at animation keyframes
 * - Layout animations for enter/exit
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
    motion,
    AnimatePresence,
    useReducedMotion,
    useSpring,
    useTransform,
    type Transition,
    type Variants
} from 'framer-motion';
import type { QuotationState } from '../../types/quotation.types';
import { STATE_UI_CONFIG, QuotationStateEnum } from '../../types/quotation.types';
import { HapticService } from '../../services/hapticService';

// ═══════════════════════════════════════════════════════════════════════════
// SPRING CONFIGURATIONS - Apple Quality Physics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * iOS-inspired spring configurations
 * Based on UISpringTimingParameters from UIKit
 */
export const SPRING_CONFIGS = {
    // Default - snappy and responsive
    default: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 30,
        mass: 1,
    },

    // Gentle - for subtle transitions
    gentle: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 25,
        mass: 1,
    },

    // Bouncy - for playful feedback
    bouncy: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 20,
        mass: 0.8,
    },

    // Stiff - for quick snaps
    stiff: {
        type: 'spring' as const,
        stiffness: 700,
        damping: 35,
        mass: 0.5,
    },

    // Smooth - for layout changes
    smooth: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 40,
        mass: 1.2,
    }
} as const;

// Reduced motion alternative
const REDUCED_MOTION_TRANSITION: Transition = {
    duration: 0.2,
    ease: 'easeOut'
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE VARIANTS - Visual Design for Each State
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animation variants for state transitions
 * Each state has distinct visual characteristics
 */
const createStateVariants = (
    prefersReducedMotion: boolean
): Variants => ({
    [QuotationStateEnum.IDLE]: {
        scale: 1,
        opacity: 0.6,
        y: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    [QuotationStateEnum.DRAFT]: {
        scale: 1,
        opacity: 0.85,
        y: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    [QuotationStateEnum.SENDING]: {
        scale: prefersReducedMotion ? 1 : 0.98,
        opacity: 1,
        y: 0,
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
    },
    [QuotationStateEnum.SENT]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)',
    },
    [QuotationStateEnum.WAITING_REPLY]: {
        scale: 1,
        opacity: 1,
        y: prefersReducedMotion ? 0 : [-1, 1, -1],
        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
        transition: {
            y: {
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut'
            }
        }
    },
    [QuotationStateEnum.REPLIED]: {
        scale: prefersReducedMotion ? 1 : 1.02,
        opacity: 1,
        y: 0,
        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.2)',
    },
    [QuotationStateEnum.ANALYZING]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
    },
    [QuotationStateEnum.QUOTED]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 6px 16px rgba(139, 92, 246, 0.15)',
    },
    [QuotationStateEnum.CONFIRMING]: {
        scale: prefersReducedMotion ? 1 : 0.99,
        opacity: 1,
        y: 0,
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
    },
    [QuotationStateEnum.CONFIRMED]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
    },
    [QuotationStateEnum.DELIVERING]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)',
    },
    [QuotationStateEnum.DELIVERED]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
    },
    [QuotationStateEnum.CANCELLED]: {
        scale: prefersReducedMotion ? 1 : 0.98,
        opacity: 0.7,
        y: 0,
        boxShadow: '0 2px 4px rgba(244, 63, 94, 0.1)',
    },
    [QuotationStateEnum.EXPIRED]: {
        scale: prefersReducedMotion ? 1 : 0.98,
        opacity: 0.6,
        y: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    [QuotationStateEnum.ERROR]: {
        scale: 1,
        opacity: 1,
        y: 0,
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENTER/EXIT VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const enterExitVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -20,
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// PENDING ANIMATION - Shimmer Effect
// ═══════════════════════════════════════════════════════════════════════════

const pendingShimmerVariants: Variants = {
    pending: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE TRANSITION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface StateTransitionProps {
    /** Current state of the quotation */
    state: QuotationState;
    /** Whether a mutation is pending */
    isPending?: boolean;
    /** Previous state (for transition direction) */
    previousState?: QuotationState;
    /** Spring configuration preset */
    springPreset?: keyof typeof SPRING_CONFIGS;
    /** Children to render */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Layout animation mode */
    layout?: boolean | 'position' | 'size';
    /** Callback when animation completes */
    onAnimationComplete?: () => void;
    /** Enable haptic feedback */
    enableHaptics?: boolean;
}

export const StateTransition: React.FC<StateTransitionProps> = ({
    state,
    isPending = false,
    previousState,
    springPreset = 'default',
    children,
    className = '',
    layout = true,
    onAnimationComplete,
    enableHaptics = true
}) => {
    const prefersReducedMotion = useReducedMotion() ?? false;
    const previousStateRef = useRef(previousState ?? state);
    const hasAnimated = useRef(false);

    // Get UI config for current state
    const stateConfig = STATE_UI_CONFIG[state];

    // Memoize variants
    const stateVariants = useMemo(
        () => createStateVariants(prefersReducedMotion),
        [prefersReducedMotion]
    );

    // Select spring config
    const springConfig = prefersReducedMotion
        ? REDUCED_MOTION_TRANSITION
        : SPRING_CONFIGS[springPreset];

    // Trigger haptic on state change
    useEffect(() => {
        if (state !== previousStateRef.current && enableHaptics && !hasAnimated.current) {
            HapticService.trigger(stateConfig.hapticType);
            hasAnimated.current = true;
        }

        // Reset for next transition
        const timeout = setTimeout(() => {
            previousStateRef.current = state;
            hasAnimated.current = false;
        }, 500);

        return () => clearTimeout(timeout);
    }, [state, stateConfig.hapticType, enableHaptics]);

    return (
        <motion.div
            layout={layout}
            className={`state-transition ${className}`}
            initial={previousStateRef.current}
            animate={state}
            variants={stateVariants}
            transition={springConfig}
            onAnimationComplete={onAnimationComplete}
            style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
            }}
        >
            {/* Pending shimmer overlay */}
            {isPending && (
                <motion.div
                    className="pending-shimmer"
                    variants={pendingShimmerVariants}
                    animate="pending"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        backgroundSize: '200% 100%',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />
            )}

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface StateTransitionListProps {
    /** Array of items with id and state */
    items: Array<{ id: string; state: QuotationState; isPending?: boolean }>;
    /** Render function for each item */
    renderItem: (item: { id: string; state: QuotationState; isPending?: boolean }, index: number) => React.ReactNode;
    /** Gap between items */
    gap?: number;
    /** Additional className */
    className?: string;
}

export const StateTransitionList: React.FC<StateTransitionListProps> = ({
    items,
    renderItem,
    gap = 16,
    className = ''
}) => {
    const prefersReducedMotion = useReducedMotion() ?? false;

    return (
        <motion.div
            className={`state-transition-list ${className}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap
            }}
        >
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={enterExitVariants}
                        transition={
                            prefersReducedMotion
                                ? REDUCED_MOTION_TRANSITION
                                : { ...SPRING_CONFIGS.smooth, delay: index * 0.05 }
                        }
                    >
                        <StateTransition
                            state={item.state}
                            isPending={item.isPending}
                        >
                            {renderItem(item, index)}
                        </StateTransition>
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR COMPONENT - Animated State Progress
// ═══════════════════════════════════════════════════════════════════════════

export interface StateProgressBarProps {
    /** Current progress (0-100) */
    progress: number;
    /** Current state for color */
    state: QuotationState;
    /** Height of the bar */
    height?: number;
    /** Additional className */
    className?: string;
}

export const StateProgressBar: React.FC<StateProgressBarProps> = ({
    progress,
    state,
    height = 4,
    className = ''
}) => {
    const prefersReducedMotion = useReducedMotion() ?? false;
    const stateConfig = STATE_UI_CONFIG[state];

    // Spring-animated progress value
    const springProgress = useSpring(progress, {
        stiffness: 200,
        damping: 30,
        mass: 1
    });

    const width = useTransform(springProgress, (v) => `${v}%`);

    return (
        <div
            className={`state-progress-bar ${className}`}
            style={{
                width: '100%',
                height,
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: height / 2,
                overflow: 'hidden',
            }}
        >
            <motion.div
                style={{
                    height: '100%',
                    width,
                    borderRadius: height / 2,
                }}
                className={stateConfig.bgClass}
                animate={{
                    opacity: progress > 0 ? 1 : 0.5,
                }}
                transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : SPRING_CONFIGS.smooth}
            />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE BADGE COMPONENT - Animated State Indicator
// ═══════════════════════════════════════════════════════════════════════════

export interface StateBadgeProps {
    /** Current state */
    state: QuotationState;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show icon */
    showIcon?: boolean;
    /** Additional className */
    className?: string;
}

export const StateBadge: React.FC<StateBadgeProps> = ({
    state,
    size = 'md',
    showIcon = true,
    className = ''
}) => {
    const prefersReducedMotion = useReducedMotion() ?? false;
    const stateConfig = STATE_UI_CONFIG[state];

    const sizeStyles = {
        sm: { padding: '2px 8px', fontSize: '11px' },
        md: { padding: '4px 12px', fontSize: '13px' },
        lg: { padding: '6px 16px', fontSize: '15px' },
    };

    return (
        <motion.span
            layout
            className={`state-badge ${stateConfig.bgClass} ${stateConfig.textClass} ${className}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : SPRING_CONFIGS.bouncy}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '9999px',
                fontWeight: 500,
                ...sizeStyles[size],
            }}
        >
            {showIcon && <span>{stateConfig.icon}</span>}
            <span>{stateConfig.label}</span>
        </motion.span>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// PULSE INDICATOR - For pending/loading states
// ═══════════════════════════════════════════════════════════════════════════

export interface PulseIndicatorProps {
    /** Whether to show pulse */
    active?: boolean;
    /** Color */
    color?: string;
    /** Size in pixels */
    size?: number;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
    active = true,
    color = '#10B981',
    size = 8
}) => {
    const prefersReducedMotion = useReducedMotion() ?? false;

    if (!active) return null;

    return (
        <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
            {/* Pulse ring */}
            {!prefersReducedMotion && (
                <motion.span
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        backgroundColor: color,
                    }}
                    animate={{
                        scale: [1, 2],
                        opacity: [0.6, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            )}

            {/* Core dot */}
            <span
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: color,
                }}
            />
        </span>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { REDUCED_MOTION_TRANSITION };

export default StateTransition;
