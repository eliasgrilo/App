/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPORTS MODULE — TypeScript Type Definitions
 * 
 * Comprehensive type system for bakery analytics dashboard including:
 * - Date range filtering
 * - ABC Analysis (Pareto)
 * - Breakage/Waste Analysis
 * - Stock Velocity metrics
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DATE RANGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DatePreset = 'last7days' | 'thisMonth' | 'lastMonth' | 'custom'

export interface DateRange {
    start: Date
    end: Date
    preset: DatePreset
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABC ANALYSIS (PARETO) TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ABCClassification = 'A' | 'B' | 'C'

export interface ABCItem {
    id: number
    name: string
    category: string
    totalCost: number
    percentage: number
    cumulativePercentage: number
    classification: ABCClassification
}

export interface ABCAnalysis {
    items: ABCItem[]
    totals: {
        classA: { count: number; value: number; percentage: number }
        classB: { count: number; value: number; percentage: number }
        classC: { count: number; value: number; percentage: number }
    }
    totalValue: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// BREAKAGE/WASTE ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface BreakageData {
    id: number
    name: string
    category: string
    produced: number
    sold: number
    wasted: number
    unit: string
    wastePercentage: number
    lossValue: number
}

export interface BreakageAnalysis {
    items: BreakageData[]
    totals: {
        totalProduced: number
        totalSold: number
        totalWasted: number
        overallWastePercentage: number
        totalLossValue: number
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK VELOCITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type VelocityStatus = 'critical' | 'warning' | 'healthy' | 'slow'

export interface VelocityItem {
    id: number
    name: string
    category: string
    currentStock: number
    unit: string
    daysRemaining: number
    turnoverRate: number // Times inventory turns over per month
    status: VelocityStatus
    expiryRisk: boolean
    expiryDate?: string
}

export interface VelocityAnalysis {
    items: VelocityItem[]
    summary: {
        criticalCount: number
        warningCount: number
        healthyCount: number
        slowMovingCount: number
        expiryRiskCount: number
        avgTurnoverRate: number
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARGIN ANALYSIS (CONTRIBUTION MARGIN) TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MarginStatus = 'excellent' | 'good' | 'warning' | 'critical'

export interface MarginItem {
    id: number
    name: string
    category: string
    unitPrice: number
    unitCost: number
    marginValue: number
    marginPercent: number
    unitsSold: number
    totalRevenue: number
    totalCost: number
    totalMargin: number
    status: MarginStatus
}

export interface MarginAnalysis {
    items: MarginItem[]
    summary: {
        totalRevenue: number
        totalCosts: number
        totalMargin: number
        avgMarginPercent: number
        excellentCount: number
        goodCount: number
        warningCount: number
        criticalCount: number
        topPerformer: string
        bottomPerformer: string
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMAND FORECAST TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ForecastAccuracy = 'high' | 'medium' | 'low'
export type DayOfWeek = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

export interface ForecastItem {
    id: number
    name: string
    category: string
    avgDailySales: number
    forecastedDemand: number
    actualDemand: number
    accuracy: number
    accuracyLevel: ForecastAccuracy
    trend: 'up' | 'down' | 'stable'
    seasonalPattern: Record<DayOfWeek, number>
}

export interface DemandForecast {
    items: ForecastItem[]
    summary: {
        overallAccuracy: number
        highAccuracyCount: number
        mediumAccuracyCount: number
        lowAccuracyCount: number
        upTrendCount: number
        downTrendCount: number
        stableCount: number
    }
    weeklyTrend: {
        day: string
        forecast: number
        actual: number
    }[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION EFFICIENCY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EfficiencyLevel = 'optimal' | 'good' | 'needs_improvement' | 'critical'

export interface ProductionItem {
    id: number
    name: string
    category: string
    standardTime: number // minutes
    actualTime: number // minutes
    efficiency: number // percentage
    unitsProduced: number
    defectRate: number
    efficiencyLevel: EfficiencyLevel
}

export interface ProductionEfficiency {
    items: ProductionItem[]
    summary: {
        avgEfficiency: number
        avgDefectRate: number
        totalUnitsProduced: number
        totalProductionTime: number
        optimalCount: number
        goodCount: number
        needsImprovementCount: number
        criticalCount: number
    }
    hourlyOutput: {
        hour: string
        units: number
        efficiency: number
    }[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIER ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SupplierRating = 'A' | 'B' | 'C' | 'D'

export interface SupplierItem {
    id: number
    name: string
    category: string
    totalPurchases: number
    avgDeliveryTime: number // days
    onTimeDeliveryRate: number // percentage
    qualityScore: number // 1-10
    priceCompetitiveness: number // percentage vs market avg
    dependencyRisk: number // percentage of category from this supplier
    overallRating: SupplierRating
}

export interface SupplierAnalysis {
    items: SupplierItem[]
    summary: {
        totalSuppliers: number
        totalSpend: number
        avgDeliveryTime: number
        avgOnTimeRate: number
        avgQualityScore: number
        ratingACount: number
        ratingBCount: number
        ratingCCount: number
        ratingDCount: number
        highDependencyCount: number
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASH FLOW TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type CashFlowStatus = 'positive' | 'neutral' | 'negative' | 'critical'

export interface CashFlowPeriod {
    period: string
    inflows: number
    outflows: number
    netFlow: number
    balance: number
    status: CashFlowStatus
}

export interface CashFlowCategory {
    category: string
    amount: number
    percentage: number
    type: 'inflow' | 'outflow'
}

export interface CashFlowAnalysis {
    periods: CashFlowPeriod[]
    categories: {
        inflows: CashFlowCategory[]
        outflows: CashFlowCategory[]
    }
    summary: {
        totalInflows: number
        totalOutflows: number
        netCashFlow: number
        currentBalance: number
        projectedBalance: number
        daysOfCoverage: number
        status: CashFlowStatus
        alerts: string[]
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export type ReportType = 'abc' | 'breakage' | 'velocity' | 'margin' | 'forecast' | 'efficiency' | 'suppliers' | 'cashflow'

export interface ReportConfig {
    id: ReportType
    title: string
    description: string
    enabled: boolean
}

export interface ReportsState {
    dateRange: DateRange
    selectedReports: ReportType[]
    isLoading: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT LAYOUT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface BakeryInfo {
    name: string
    cnpj: string
    address: string
    phone: string
}

export interface PrintOptions {
    includeABC: boolean
    includeBreakage: boolean
    includeVelocity: boolean
    includeMargin: boolean
    includeForecast: boolean
    includeEfficiency: boolean
    includeSuppliers: boolean
    includeCashflow: boolean
    printedBy: string
}

