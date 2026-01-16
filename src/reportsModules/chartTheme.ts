/**
 * Chart Theme — Apple HIG Compliant Chart Styling
 * 
 * Unified chart color scheme and styling for all Recharts components.
 * Follows Apple Human Interface Guidelines for data visualization.
 * 
 * @author Padoca Engineering Team
 */

// ═══════════════════════════════════════════════════════════════════════════════
// APPLE SEMANTIC COLORS FOR CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

export const CHART_COLORS = {
    // Primary Chart Colors (Apple System Colors)
    primary: '#007AFF',    // Apple Blue
    secondary: '#5856D6',  // Apple Purple
    tertiary: '#AF52DE',   // Apple Violet

    // Status Colors
    success: '#34C759',    // Apple Green
    warning: '#FF9500',    // Apple Orange
    danger: '#FF3B30',     // Apple Red

    // Neutral Colors
    gray: '#8E8E93',       // Apple Gray
    darkGray: '#636366',   // Apple Dark Gray

    // ABC Classification (Priority-based)
    classA: '#FF3B30',     // High Priority - Red
    classB: '#FF9500',     // Medium Priority - Orange  
    classC: '#34C759',     // Low Priority - Green

    // Financial (Revenue/Expense)
    revenue: '#34C759',    // Green for income
    expense: '#FF3B30',    // Red for outflow
    profit: '#007AFF',     // Blue for net

    // Chart Area Fills (50% opacity versions)
    primaryFill: 'rgba(0, 122, 255, 0.12)',
    successFill: 'rgba(52, 199, 89, 0.12)',
    dangerFill: 'rgba(255, 59, 48, 0.12)',
    warningFill: 'rgba(255, 149, 0, 0.12)',

    // Grid and Axis
    grid: 'rgba(0, 0, 0, 0.06)',
    gridDark: 'rgba(255, 255, 255, 0.08)',
    axis: '#86868b',

    // Background
    background: '#ffffff',
    backgroundDark: '#1c1c1e',

    // Multi-series palette (for charts with many data series)
    palette: [
        '#007AFF', // Blue
        '#34C759', // Green
        '#FF9500', // Orange
        '#AF52DE', // Purple
        '#FF3B30', // Red
        '#5AC8FA', // Teal
        '#FF2D55', // Pink
        '#FFCC00', // Yellow
    ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART STYLING CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const CHART_STYLE = {
    // Typography
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    fontSize: {
        tick: 11,
        label: 12,
        title: 13,
        legend: 11,
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
    },

    // Spacing (8pt grid)
    margin: {
        top: 8,
        right: 16,
        bottom: 24,
        left: 48,
    },

    // Animation
    animation: {
        duration: 800,
        easing: 'ease-out',
    },

    // Axis styling
    axis: {
        stroke: '#d2d2d7',
        strokeWidth: 1,
        tickLine: false,
        axisLine: { stroke: '#d2d2d7', strokeWidth: 1 },
        tickFormatter: (value: number) => value.toLocaleString('pt-BR'),
    },

    // Tooltip styling
    tooltip: {
        contentStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            padding: '12px 16px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            fontSize: 13,
        },
        labelStyle: {
            color: '#1d1d1f',
            fontWeight: 600,
            marginBottom: 8,
        },
        itemStyle: {
            color: '#86868b',
            padding: 0,
        },
        cursor: {
            stroke: 'rgba(0, 122, 255, 0.3)',
            strokeWidth: 1,
        },
    },

    // Bar styling
    bar: {
        radius: [6, 6, 0, 0] as [number, number, number, number], // Rounded top corners
        maxBarSize: 48,
    },

    // Line styling
    line: {
        strokeWidth: 2.5,
        dot: false,
        activeDot: {
            r: 5,
            stroke: '#fff',
            strokeWidth: 2,
        },
    },

    // Area styling
    area: {
        strokeWidth: 2,
        fillOpacity: 0.15,
    },

    // Legend styling
    legend: {
        wrapperStyle: {
            paddingTop: 16,
        },
        iconType: 'circle' as const,
        iconSize: 8,
    },
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const getChartColor = (index: number): string => {
    return CHART_COLORS.palette[index % CHART_COLORS.palette.length]!
}

export const getStatusColor = (value: number, thresholds: { warning: number; danger: number }): string => {
    if (value >= thresholds.danger) return CHART_COLORS.danger
    if (value >= thresholds.warning) return CHART_COLORS.warning
    return CHART_COLORS.success
}

export const formatCurrencyAxis = (value: number): string => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`
    return `R$ ${value.toFixed(0)}`
}

export const formatPercentAxis = (value: number): string => {
    return `${value.toFixed(0)}%`
}
