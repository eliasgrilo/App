/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REPORTS MODULE — Mock Data for Bakery Analytics
 * 
 * Realistic Brazilian bakery data for:
 * - Curva ABC (80/20 Pareto analysis of ingredient costs)
 * - Breakage/Waste (Produced vs Sold vs Wasted)
 * - Stock Velocity (Turnover rates and expiry risks)
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type {
    ABCItem,
    ABCAnalysis,
    BreakageData,
    BreakageAnalysis,
    VelocityItem,
    VelocityAnalysis,
    BakeryInfo,
    MarginItem,
    MarginAnalysis,
    ForecastItem,
    DemandForecast,
    ProductionItem,
    ProductionEfficiency,
    SupplierItem,
    SupplierAnalysis,
    CashFlowPeriod,
    CashFlowAnalysis
} from './types'

// ═══════════════════════════════════════════════════════════════════════════════
// BAKERY INFORMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const BAKERY_INFO: BakeryInfo = {
    name: 'Padoca Artesanal',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Padarias, 123 - Centro, São Paulo - SP',
    phone: '(11) 99999-9999'
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABC ANALYSIS DATA (Curva ABC / Pareto)
// Items sorted by cost, showing which ingredients consume 80% of budget
// ═══════════════════════════════════════════════════════════════════════════════

const rawABCItems = [
    { id: 1, name: 'Farinha de Trigo T65', category: 'Farináceos', totalCost: 15840.00 },
    { id: 2, name: 'Manteiga sem Sal', category: 'Laticínios', totalCost: 8960.00 },
    { id: 3, name: 'Chocolate 70% Barry', category: 'Chocolates', totalCost: 7350.00 },
    { id: 4, name: 'Ovos Tipo A', category: 'Ovos', totalCost: 5280.00 },
    { id: 5, name: 'Açúcar Refinado', category: 'Açúcares', totalCost: 3420.00 },
    { id: 6, name: 'Leite Integral', category: 'Laticínios', totalCost: 2890.00 },
    { id: 7, name: 'Fermento Biológico', category: 'Fermentos', totalCost: 2150.00 },
    { id: 8, name: 'Creme de Leite Fresco', category: 'Laticínios', totalCost: 1980.00 },
    { id: 9, name: 'Azeite Extra Virgem', category: 'Óleos', totalCost: 1540.00 },
    { id: 10, name: 'Queijo Parmesão', category: 'Laticínios', totalCost: 1320.00 },
    { id: 11, name: 'Amêndoas Califórnia', category: 'Oleaginosas', totalCost: 1180.00 },
    { id: 12, name: 'Essência de Baunilha', category: 'Aromáticos', totalCost: 890.00 },
    { id: 13, name: 'Sal Marinho', category: 'Temperos', totalCost: 420.00 },
    { id: 14, name: 'Canela em Pó', category: 'Especiarias', totalCost: 380.00 },
    { id: 15, name: 'Fermento Químico', category: 'Fermentos', totalCost: 290.00 },
    { id: 16, name: 'Cacau em Pó', category: 'Chocolates', totalCost: 560.00 },
    { id: 17, name: 'Mel Silvestre', category: 'Açúcares', totalCost: 720.00 },
    { id: 18, name: 'Nozes Pecã', category: 'Oleaginosas', totalCost: 940.00 }
]

// Calculate ABC classification
const totalValue = rawABCItems.reduce((sum, item) => sum + item.totalCost, 0)
let cumulative = 0

export const MOCK_ABC_ITEMS: ABCItem[] = rawABCItems
    .sort((a, b) => b.totalCost - a.totalCost)
    .map(item => {
        const percentage = (item.totalCost / totalValue) * 100
        cumulative += percentage
        const classification = cumulative <= 80 ? 'A' : cumulative <= 95 ? 'B' : 'C'
        return {
            ...item,
            percentage,
            cumulativePercentage: cumulative,
            classification
        }
    })

export const MOCK_ABC_ANALYSIS: ABCAnalysis = {
    items: MOCK_ABC_ITEMS,
    totals: {
        classA: {
            count: MOCK_ABC_ITEMS.filter(i => i.classification === 'A').length,
            value: MOCK_ABC_ITEMS.filter(i => i.classification === 'A').reduce((s, i) => s + i.totalCost, 0),
            percentage: MOCK_ABC_ITEMS.filter(i => i.classification === 'A').reduce((s, i) => s + i.percentage, 0)
        },
        classB: {
            count: MOCK_ABC_ITEMS.filter(i => i.classification === 'B').length,
            value: MOCK_ABC_ITEMS.filter(i => i.classification === 'B').reduce((s, i) => s + i.totalCost, 0),
            percentage: MOCK_ABC_ITEMS.filter(i => i.classification === 'B').reduce((s, i) => s + i.percentage, 0)
        },
        classC: {
            count: MOCK_ABC_ITEMS.filter(i => i.classification === 'C').length,
            value: MOCK_ABC_ITEMS.filter(i => i.classification === 'C').reduce((s, i) => s + i.totalCost, 0),
            percentage: MOCK_ABC_ITEMS.filter(i => i.classification === 'C').reduce((s, i) => s + i.percentage, 0)
        }
    },
    totalValue
}

// ═══════════════════════════════════════════════════════════════════════════════
// BREAKAGE/WASTE ANALYSIS DATA
// Comparing production vs sales vs waste for key products
// ═══════════════════════════════════════════════════════════════════════════════

const rawBreakageItems = [
    { id: 1, name: 'Pão Francês', category: 'Pães', produced: 1200, sold: 1050, unit: 'un', pricePerUnit: 0.80 },
    { id: 2, name: 'Croissant Tradicional', category: 'Folhados', produced: 180, sold: 142, unit: 'un', pricePerUnit: 8.50 },
    { id: 3, name: 'Bolo de Cenoura', category: 'Bolos', produced: 24, sold: 21, unit: 'un', pricePerUnit: 45.00 },
    { id: 4, name: 'Sonho Recheado', category: 'Doces', produced: 120, sold: 98, unit: 'un', pricePerUnit: 6.00 },
    { id: 5, name: 'Pão de Queijo', category: 'Salgados', produced: 300, sold: 285, unit: 'un', pricePerUnit: 3.50 },
    { id: 6, name: 'Baguete Artesanal', category: 'Pães', produced: 80, sold: 62, unit: 'un', pricePerUnit: 12.00 },
    { id: 7, name: 'Torta de Morango', category: 'Tortas', produced: 8, sold: 7, unit: 'un', pricePerUnit: 85.00 },
    { id: 8, name: 'Coxinha', category: 'Salgados', produced: 200, sold: 178, unit: 'un', pricePerUnit: 7.00 },
    { id: 9, name: 'Palmier', category: 'Folhados', produced: 150, sold: 130, unit: 'un', pricePerUnit: 4.00 },
    { id: 10, name: 'Brioche', category: 'Pães', produced: 60, sold: 48, unit: 'un', pricePerUnit: 9.00 }
]

export const MOCK_BREAKAGE_ITEMS: BreakageData[] = rawBreakageItems.map(item => {
    const wasted = item.produced - item.sold
    const wastePercentage = (wasted / item.produced) * 100
    const lossValue = wasted * item.pricePerUnit
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        produced: item.produced,
        sold: item.sold,
        wasted,
        unit: item.unit,
        wastePercentage,
        lossValue
    }
})

const breakageTotals = MOCK_BREAKAGE_ITEMS.reduce(
    (acc, item) => ({
        totalProduced: acc.totalProduced + item.produced,
        totalSold: acc.totalSold + item.sold,
        totalWasted: acc.totalWasted + item.wasted,
        totalLossValue: acc.totalLossValue + item.lossValue
    }),
    { totalProduced: 0, totalSold: 0, totalWasted: 0, totalLossValue: 0 }
)

export const MOCK_BREAKAGE_ANALYSIS: BreakageAnalysis = {
    items: MOCK_BREAKAGE_ITEMS,
    totals: {
        ...breakageTotals,
        overallWastePercentage: (breakageTotals.totalWasted / breakageTotals.totalProduced) * 100
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK VELOCITY DATA
// Turnover rates and expiry risk assessment
// ═══════════════════════════════════════════════════════════════════════════════

const rawVelocityItems = [
    { id: 1, name: 'Leite Integral', category: 'Laticínios', currentStock: 48, unit: 'L', dailyUsage: 12, daysToExpiry: 3 },
    { id: 2, name: 'Ovos Tipo A', category: 'Ovos', currentStock: 720, unit: 'un', dailyUsage: 180, daysToExpiry: 8 },
    { id: 3, name: 'Creme de Leite', category: 'Laticínios', currentStock: 24, unit: 'L', dailyUsage: 4, daysToExpiry: 5 },
    { id: 4, name: 'Fermento Biológico', category: 'Fermentos', currentStock: 6, unit: 'kg', dailyUsage: 0.8, daysToExpiry: 2 },
    { id: 5, name: 'Manteiga sem Sal', category: 'Laticínios', currentStock: 20, unit: 'kg', dailyUsage: 3, daysToExpiry: 25 },
    { id: 6, name: 'Farinha de Trigo', category: 'Farináceos', currentStock: 400, unit: 'kg', dailyUsage: 50, daysToExpiry: 90 },
    { id: 7, name: 'Chocolate Barry', category: 'Chocolates', currentStock: 15, unit: 'kg', dailyUsage: 1.5, daysToExpiry: 180 },
    { id: 8, name: 'Nozes Pecã', category: 'Oleaginosas', currentStock: 8, unit: 'kg', dailyUsage: 0.3, daysToExpiry: 120 },
    { id: 9, name: 'Mel Silvestre', category: 'Açúcares', currentStock: 12, unit: 'kg', dailyUsage: 0.4, daysToExpiry: 365 },
    { id: 10, name: 'Canela em Pó', category: 'Especiarias', currentStock: 2, unit: 'kg', dailyUsage: 0.05, daysToExpiry: 180 },
    { id: 11, name: 'Manjericão Fresco', category: 'Ervas', currentStock: 0.5, unit: 'kg', dailyUsage: 0.15, daysToExpiry: 2 },
    { id: 12, name: 'Morango Fresco', category: 'Frutas', currentStock: 3, unit: 'kg', dailyUsage: 1.2, daysToExpiry: 3 }
]

const today = new Date()

export const MOCK_VELOCITY_ITEMS: VelocityItem[] = rawVelocityItems.map(item => {
    const daysRemaining = Math.round(item.currentStock / item.dailyUsage)
    const turnoverRate = (item.dailyUsage * 30) / item.currentStock // Monthly turnover
    const expiryRisk = item.daysToExpiry <= 3
    const expiryDate = new Date(today.getTime() + item.daysToExpiry * 24 * 60 * 60 * 1000).toISOString()

    let status: VelocityItem['status']
    if (daysRemaining <= 2) status = 'critical'
    else if (daysRemaining <= 5) status = 'warning'
    else if (turnoverRate < 1) status = 'slow'
    else status = 'healthy'

    return {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        daysRemaining,
        turnoverRate: Math.round(turnoverRate * 10) / 10,
        status,
        expiryRisk,
        expiryDate
    }
})

const summary = {
    criticalCount: MOCK_VELOCITY_ITEMS.filter(i => i.status === 'critical').length,
    warningCount: MOCK_VELOCITY_ITEMS.filter(i => i.status === 'warning').length,
    healthyCount: MOCK_VELOCITY_ITEMS.filter(i => i.status === 'healthy').length,
    slowMovingCount: MOCK_VELOCITY_ITEMS.filter(i => i.status === 'slow').length,
    expiryRiskCount: MOCK_VELOCITY_ITEMS.filter(i => i.expiryRisk).length,
    avgTurnoverRate: MOCK_VELOCITY_ITEMS.reduce((s, i) => s + i.turnoverRate, 0) / MOCK_VELOCITY_ITEMS.length
}

export const MOCK_VELOCITY_ANALYSIS: VelocityAnalysis = {
    items: MOCK_VELOCITY_ITEMS,
    summary
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARGIN ANALYSIS DATA (Contribution Margin)
// Shows profitability per product
// ═══════════════════════════════════════════════════════════════════════════════

const rawMarginItems: MarginItem[] = [
    { id: 1, name: 'Pão Francês', category: 'Pães', unitPrice: 0.80, unitCost: 0.25, marginValue: 0.55, marginPercent: 68.75, unitsSold: 15000, totalRevenue: 12000, totalCost: 3750, totalMargin: 8250, status: 'excellent' },
    { id: 2, name: 'Croissant Tradicional', category: 'Folhados', unitPrice: 8.50, unitCost: 3.20, marginValue: 5.30, marginPercent: 62.35, unitsSold: 850, totalRevenue: 7225, totalCost: 2720, totalMargin: 4505, status: 'excellent' },
    { id: 3, name: 'Bolo de Chocolate', category: 'Bolos', unitPrice: 45.00, unitCost: 18.00, marginValue: 27.00, marginPercent: 60.00, unitsSold: 120, totalRevenue: 5400, totalCost: 2160, totalMargin: 3240, status: 'excellent' },
    { id: 4, name: 'Sonho de Creme', category: 'Doces', unitPrice: 6.00, unitCost: 2.80, marginValue: 3.20, marginPercent: 53.33, unitsSold: 600, totalRevenue: 3600, totalCost: 1680, totalMargin: 1920, status: 'good' },
    { id: 5, name: 'Pão de Queijo', category: 'Salgados', unitPrice: 3.50, unitCost: 1.60, marginValue: 1.90, marginPercent: 54.29, unitsSold: 2000, totalRevenue: 7000, totalCost: 3200, totalMargin: 3800, status: 'good' },
    { id: 6, name: 'Empada de Frango', category: 'Salgados', unitPrice: 7.00, unitCost: 3.80, marginValue: 3.20, marginPercent: 45.71, unitsSold: 800, totalRevenue: 5600, totalCost: 3040, totalMargin: 2560, status: 'good' },
    { id: 7, name: 'Brigadeiro Gourmet', category: 'Doces', unitPrice: 4.00, unitCost: 1.90, marginValue: 2.10, marginPercent: 52.50, unitsSold: 1500, totalRevenue: 6000, totalCost: 2850, totalMargin: 3150, status: 'good' },
    { id: 8, name: 'Foccacia Artesanal', category: 'Pães', unitPrice: 15.00, unitCost: 8.50, marginValue: 6.50, marginPercent: 43.33, unitsSold: 200, totalRevenue: 3000, totalCost: 1700, totalMargin: 1300, status: 'good' },
    { id: 9, name: 'Torta de Limão', category: 'Bolos', unitPrice: 35.00, unitCost: 22.00, marginValue: 13.00, marginPercent: 37.14, unitsSold: 80, totalRevenue: 2800, totalCost: 1760, totalMargin: 1040, status: 'warning' },
    { id: 10, name: 'Coxinha Premium', category: 'Salgados', unitPrice: 8.00, unitCost: 5.50, marginValue: 2.50, marginPercent: 31.25, unitsSold: 1200, totalRevenue: 9600, totalCost: 6600, totalMargin: 3000, status: 'warning' },
    { id: 11, name: 'Palmier', category: 'Folhados', unitPrice: 4.50, unitCost: 3.20, marginValue: 1.30, marginPercent: 28.89, unitsSold: 400, totalRevenue: 1800, totalCost: 1280, totalMargin: 520, status: 'warning' },
    { id: 12, name: 'Quiche Lorraine', category: 'Salgados', unitPrice: 12.00, unitCost: 9.50, marginValue: 2.50, marginPercent: 20.83, unitsSold: 150, totalRevenue: 1800, totalCost: 1425, totalMargin: 375, status: 'critical' }
]

export const MOCK_MARGIN_ANALYSIS: MarginAnalysis = {
    items: rawMarginItems,
    summary: {
        totalRevenue: rawMarginItems.reduce((s, i) => s + i.totalRevenue, 0),
        totalCosts: rawMarginItems.reduce((s, i) => s + i.totalCost, 0),
        totalMargin: rawMarginItems.reduce((s, i) => s + i.totalMargin, 0),
        avgMarginPercent: rawMarginItems.reduce((s, i) => s + i.marginPercent, 0) / rawMarginItems.length,
        excellentCount: rawMarginItems.filter(i => i.status === 'excellent').length,
        goodCount: rawMarginItems.filter(i => i.status === 'good').length,
        warningCount: rawMarginItems.filter(i => i.status === 'warning').length,
        criticalCount: rawMarginItems.filter(i => i.status === 'critical').length,
        topPerformer: 'Pão Francês',
        bottomPerformer: 'Quiche Lorraine'
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMAND FORECAST DATA
// Predicted vs actual demand with accuracy metrics
// ═══════════════════════════════════════════════════════════════════════════════

const rawForecastItems: ForecastItem[] = [
    { id: 1, name: 'Pão Francês', category: 'Pães', avgDailySales: 2143, forecastedDemand: 15000, actualDemand: 14850, accuracy: 99.0, accuracyLevel: 'high', trend: 'stable', seasonalPattern: { seg: 1800, ter: 2000, qua: 2100, qui: 2200, sex: 2500, sab: 2800, dom: 1600 } },
    { id: 2, name: 'Croissant Tradicional', category: 'Folhados', avgDailySales: 121, forecastedDemand: 850, actualDemand: 820, accuracy: 96.5, accuracyLevel: 'high', trend: 'up', seasonalPattern: { seg: 80, ter: 100, qua: 110, qui: 120, sex: 140, sab: 180, dom: 120 } },
    { id: 3, name: 'Pão de Queijo', category: 'Salgados', avgDailySales: 286, forecastedDemand: 2000, actualDemand: 1950, accuracy: 97.5, accuracyLevel: 'high', trend: 'up', seasonalPattern: { seg: 220, ter: 260, qua: 280, qui: 300, sex: 340, sab: 380, dom: 220 } },
    { id: 4, name: 'Sonho de Creme', category: 'Doces', avgDailySales: 86, forecastedDemand: 600, actualDemand: 580, accuracy: 96.7, accuracyLevel: 'high', trend: 'stable', seasonalPattern: { seg: 60, ter: 70, qua: 80, qui: 90, sex: 110, sab: 130, dom: 60 } },
    { id: 5, name: 'Coxinha Premium', category: 'Salgados', avgDailySales: 171, forecastedDemand: 1200, actualDemand: 1100, accuracy: 91.7, accuracyLevel: 'medium', trend: 'down', seasonalPattern: { seg: 140, ter: 160, qua: 170, qui: 180, sex: 200, sab: 220, dom: 130 } },
    { id: 6, name: 'Empada de Frango', category: 'Salgados', avgDailySales: 114, forecastedDemand: 800, actualDemand: 720, accuracy: 90.0, accuracyLevel: 'medium', trend: 'stable', seasonalPattern: { seg: 90, ter: 100, qua: 110, qui: 120, sex: 140, sab: 160, dom: 80 } },
    { id: 7, name: 'Bolo de Chocolate', category: 'Bolos', avgDailySales: 17, forecastedDemand: 120, actualDemand: 115, accuracy: 95.8, accuracyLevel: 'high', trend: 'up', seasonalPattern: { seg: 10, ter: 12, qua: 15, qui: 18, sex: 22, sab: 28, dom: 15 } },
    { id: 8, name: 'Torta de Limão', category: 'Bolos', avgDailySales: 11, forecastedDemand: 80, actualDemand: 65, accuracy: 81.3, accuracyLevel: 'low', trend: 'down', seasonalPattern: { seg: 6, ter: 8, qua: 10, qui: 12, sex: 16, sab: 20, dom: 8 } }
]

export const MOCK_DEMAND_FORECAST: DemandForecast = {
    items: rawForecastItems,
    summary: {
        overallAccuracy: rawForecastItems.reduce((s, i) => s + i.accuracy, 0) / rawForecastItems.length,
        highAccuracyCount: rawForecastItems.filter(i => i.accuracyLevel === 'high').length,
        mediumAccuracyCount: rawForecastItems.filter(i => i.accuracyLevel === 'medium').length,
        lowAccuracyCount: rawForecastItems.filter(i => i.accuracyLevel === 'low').length,
        upTrendCount: rawForecastItems.filter(i => i.trend === 'up').length,
        downTrendCount: rawForecastItems.filter(i => i.trend === 'down').length,
        stableCount: rawForecastItems.filter(i => i.trend === 'stable').length
    },
    weeklyTrend: [
        { day: 'Seg', forecast: 2406, actual: 2350 },
        { day: 'Ter', forecast: 2710, actual: 2680 },
        { day: 'Qua', forecast: 2875, actual: 2920 },
        { day: 'Qui', forecast: 3040, actual: 3010 },
        { day: 'Sex', forecast: 3468, actual: 3520 },
        { day: 'Sáb', forecast: 3918, actual: 3850 },
        { day: 'Dom', forecast: 2233, actual: 2180 }
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTION EFFICIENCY DATA
// Standard time vs actual time per product
// ═══════════════════════════════════════════════════════════════════════════════

const rawProductionItems: ProductionItem[] = [
    { id: 1, name: 'Pão Francês (fornada)', category: 'Pães', standardTime: 45, actualTime: 42, efficiency: 107.1, unitsProduced: 200, defectRate: 2.5, efficiencyLevel: 'optimal' },
    { id: 2, name: 'Croissant (lote)', category: 'Folhados', standardTime: 180, actualTime: 175, efficiency: 102.9, unitsProduced: 48, defectRate: 4.2, efficiencyLevel: 'optimal' },
    { id: 3, name: 'Pão de Queijo (lote)', category: 'Salgados', standardTime: 35, actualTime: 33, efficiency: 106.1, unitsProduced: 100, defectRate: 1.8, efficiencyLevel: 'optimal' },
    { id: 4, name: 'Sonho (lote)', category: 'Doces', standardTime: 60, actualTime: 58, efficiency: 103.4, unitsProduced: 36, defectRate: 3.5, efficiencyLevel: 'optimal' },
    { id: 5, name: 'Bolo Chocolate', category: 'Bolos', standardTime: 90, actualTime: 95, efficiency: 94.7, unitsProduced: 1, defectRate: 5.0, efficiencyLevel: 'good' },
    { id: 6, name: 'Empada (lote)', category: 'Salgados', standardTime: 50, actualTime: 55, efficiency: 90.9, unitsProduced: 40, defectRate: 4.0, efficiencyLevel: 'good' },
    { id: 7, name: 'Coxinha (lote)', category: 'Salgados', standardTime: 45, actualTime: 52, efficiency: 86.5, unitsProduced: 50, defectRate: 6.0, efficiencyLevel: 'good' },
    { id: 8, name: 'Brigadeiro (lote)', category: 'Doces', standardTime: 30, actualTime: 38, efficiency: 78.9, unitsProduced: 60, defectRate: 8.0, efficiencyLevel: 'needs_improvement' },
    { id: 9, name: 'Torta de Limão', category: 'Bolos', standardTime: 120, actualTime: 155, efficiency: 77.4, unitsProduced: 1, defectRate: 10.0, efficiencyLevel: 'needs_improvement' },
    { id: 10, name: 'Quiche (unidade)', category: 'Salgados', standardTime: 40, actualTime: 58, efficiency: 69.0, unitsProduced: 1, defectRate: 12.0, efficiencyLevel: 'critical' }
]

export const MOCK_PRODUCTION_EFFICIENCY: ProductionEfficiency = {
    items: rawProductionItems,
    summary: {
        avgEfficiency: rawProductionItems.reduce((s, i) => s + i.efficiency, 0) / rawProductionItems.length,
        avgDefectRate: rawProductionItems.reduce((s, i) => s + i.defectRate, 0) / rawProductionItems.length,
        totalUnitsProduced: rawProductionItems.reduce((s, i) => s + i.unitsProduced, 0),
        totalProductionTime: rawProductionItems.reduce((s, i) => s + i.actualTime, 0),
        optimalCount: rawProductionItems.filter(i => i.efficiencyLevel === 'optimal').length,
        goodCount: rawProductionItems.filter(i => i.efficiencyLevel === 'good').length,
        needsImprovementCount: rawProductionItems.filter(i => i.efficiencyLevel === 'needs_improvement').length,
        criticalCount: rawProductionItems.filter(i => i.efficiencyLevel === 'critical').length
    },
    hourlyOutput: [
        { hour: '05h', units: 420, efficiency: 105.0 },
        { hour: '06h', units: 580, efficiency: 112.0 },
        { hour: '07h', units: 620, efficiency: 108.0 },
        { hour: '08h', units: 480, efficiency: 95.0 },
        { hour: '09h', units: 350, efficiency: 88.0 },
        { hour: '10h', units: 280, efficiency: 82.0 },
        { hour: '11h', units: 320, efficiency: 90.0 },
        { hour: '12h', units: 180, efficiency: 75.0 }
    ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIER ANALYSIS DATA
// Performance metrics and dependency risk
// ═══════════════════════════════════════════════════════════════════════════════

const rawSupplierItems: SupplierItem[] = [
    { id: 1, name: 'Moinho Santa Clara', category: 'Farináceos', totalPurchases: 18500, avgDeliveryTime: 1.2, onTimeDeliveryRate: 98.5, qualityScore: 9.2, priceCompetitiveness: -5.0, dependencyRisk: 75.0, overallRating: 'A' },
    { id: 2, name: 'Laticínios Jaguari', category: 'Laticínios', totalPurchases: 14200, avgDeliveryTime: 0.8, onTimeDeliveryRate: 96.0, qualityScore: 8.8, priceCompetitiveness: 2.5, dependencyRisk: 60.0, overallRating: 'A' },
    { id: 3, name: 'Ovos Mantiqueira', category: 'Ovos', totalPurchases: 5800, avgDeliveryTime: 1.5, onTimeDeliveryRate: 94.0, qualityScore: 9.0, priceCompetitiveness: 0.0, dependencyRisk: 90.0, overallRating: 'B' },
    { id: 4, name: 'Chocolates Barry', category: 'Chocolates', totalPurchases: 8200, avgDeliveryTime: 3.5, onTimeDeliveryRate: 92.0, qualityScore: 9.5, priceCompetitiveness: 15.0, dependencyRisk: 100.0, overallRating: 'B' },
    { id: 5, name: 'Açúcar União', category: 'Açúcares', totalPurchases: 4100, avgDeliveryTime: 2.0, onTimeDeliveryRate: 88.0, qualityScore: 8.0, priceCompetitiveness: -8.0, dependencyRisk: 45.0, overallRating: 'B' },
    { id: 6, name: 'Distribuidora Central', category: 'Diversos', totalPurchases: 6500, avgDeliveryTime: 2.8, onTimeDeliveryRate: 82.0, qualityScore: 7.5, priceCompetitiveness: -12.0, dependencyRisk: 30.0, overallRating: 'C' },
    { id: 7, name: 'Oleaginosas Brasil', category: 'Oleaginosas', totalPurchases: 2400, avgDeliveryTime: 4.2, onTimeDeliveryRate: 78.0, qualityScore: 7.8, priceCompetitiveness: 8.0, dependencyRisk: 85.0, overallRating: 'C' },
    { id: 8, name: 'Temperos & Cia', category: 'Temperos', totalPurchases: 1200, avgDeliveryTime: 5.0, onTimeDeliveryRate: 70.0, qualityScore: 6.5, priceCompetitiveness: 5.0, dependencyRisk: 50.0, overallRating: 'D' }
]

export const MOCK_SUPPLIER_ANALYSIS: SupplierAnalysis = {
    items: rawSupplierItems,
    summary: {
        totalSuppliers: rawSupplierItems.length,
        totalSpend: rawSupplierItems.reduce((s, i) => s + i.totalPurchases, 0),
        avgDeliveryTime: rawSupplierItems.reduce((s, i) => s + i.avgDeliveryTime, 0) / rawSupplierItems.length,
        avgOnTimeRate: rawSupplierItems.reduce((s, i) => s + i.onTimeDeliveryRate, 0) / rawSupplierItems.length,
        avgQualityScore: rawSupplierItems.reduce((s, i) => s + i.qualityScore, 0) / rawSupplierItems.length,
        ratingACount: rawSupplierItems.filter(i => i.overallRating === 'A').length,
        ratingBCount: rawSupplierItems.filter(i => i.overallRating === 'B').length,
        ratingCCount: rawSupplierItems.filter(i => i.overallRating === 'C').length,
        ratingDCount: rawSupplierItems.filter(i => i.overallRating === 'D').length,
        highDependencyCount: rawSupplierItems.filter(i => i.dependencyRisk >= 75).length
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASH FLOW DATA
// Inflows, outflows and projections
// ═══════════════════════════════════════════════════════════════════════════════

const rawCashFlowPeriods: CashFlowPeriod[] = [
    { period: 'Semana 1', inflows: 28500, outflows: 22000, netFlow: 6500, balance: 45000, status: 'positive' },
    { period: 'Semana 2', inflows: 31200, outflows: 35800, netFlow: -4600, balance: 40400, status: 'negative' },
    { period: 'Semana 3', inflows: 29800, outflows: 24500, netFlow: 5300, balance: 45700, status: 'positive' },
    { period: 'Semana 4', inflows: 33500, outflows: 28000, netFlow: 5500, balance: 51200, status: 'positive' },
    { period: 'Projeção S5', inflows: 30000, outflows: 26000, netFlow: 4000, balance: 55200, status: 'positive' },
    { period: 'Projeção S6', inflows: 28000, outflows: 32000, netFlow: -4000, balance: 51200, status: 'neutral' }
]

export const MOCK_CASHFLOW_ANALYSIS: CashFlowAnalysis = {
    periods: rawCashFlowPeriods,
    categories: {
        inflows: [
            { category: 'Vendas Balcão', amount: 85000, percentage: 68.0, type: 'inflow' },
            { category: 'Encomendas', amount: 25000, percentage: 20.0, type: 'inflow' },
            { category: 'Delivery', amount: 12000, percentage: 9.6, type: 'inflow' },
            { category: 'Outras Receitas', amount: 3000, percentage: 2.4, type: 'inflow' }
        ],
        outflows: [
            { category: 'Insumos', amount: 48000, percentage: 43.6, type: 'outflow' },
            { category: 'Folha de Pagamento', amount: 32000, percentage: 29.1, type: 'outflow' },
            { category: 'Aluguel + Utilities', amount: 15000, percentage: 13.6, type: 'outflow' },
            { category: 'Impostos', amount: 8500, percentage: 7.7, type: 'outflow' },
            { category: 'Outros Custos', amount: 6500, percentage: 5.9, type: 'outflow' }
        ]
    },
    summary: {
        totalInflows: 125000,
        totalOutflows: 110000,
        netCashFlow: 15000,
        currentBalance: 51200,
        projectedBalance: 55200,
        daysOfCoverage: 14,
        status: 'positive',
        alerts: [
            'Pagamento de fornecedores concentrado na Semana 2',
            '3 fornecedores com dependência alta (>75%)'
        ]
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — Apple Typography Standards
// ═══════════════════════════════════════════════════════════════════════════════

/** Full currency format: R$ 1.234,56 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

/** Compact currency for dashboards: R$ 1.2K, R$ 125K, R$ 1.5M */
export const formatCurrencyCompact = (value: number): string => {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''

    if (absValue >= 1_000_000) {
        return `${sign}R$ ${(absValue / 1_000_000).toFixed(1).replace('.', ',')}M`
    }
    if (absValue >= 10_000) {
        return `${sign}R$ ${Math.round(absValue / 1_000)}K`
    }
    if (absValue >= 1_000) {
        return `${sign}R$ ${(absValue / 1_000).toFixed(1).replace('.', ',')}K`
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

/** Short currency without decimals for tight spaces */
export const formatCurrencyShort = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date)
}

export const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

/** Percent with 1 decimal: 12.5% */
export const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`
}

/** Integer percent: 12% */
export const formatPercentInt = (value: number): string => {
    return `${Math.round(value)}%`
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERIOD COMPARISON DATA
// Generate comparison data with realistic variance
// ═══════════════════════════════════════════════════════════════════════════════

type ComparisonPeriod = 'lastMonth' | 'lastQuarter' | 'lastYear'

interface ComparisonData {
    kpis: {
        receita: { current: number; previous: number; change: number }
        margem: { current: number; previous: number; change: number }
        desperdicio: { current: number; previous: number; change: number }
        eficiencia: { current: number; previous: number; change: number }
    }
    topProducts: { name: string; currentSales: number; previousSales: number; change: number }[]
}

// Variance based on period (longer = more variance)
const periodVariance: Record<ComparisonPeriod, number> = {
    lastMonth: 0.08,      // ±8% variance
    lastQuarter: 0.15,    // ±15% variance
    lastYear: 0.25        // ±25% variance
}

export const generateComparisonData = (period: ComparisonPeriod): ComparisonData => {
    const variance = periodVariance[period]

    // Current KPIs (from actual data)
    const currentReceita = 847520
    const currentMargem = MOCK_MARGIN_ANALYSIS.summary.avgMarginPercent
    const currentDesperdicio = MOCK_BREAKAGE_ANALYSIS.totals.overallWastePercentage
    const currentEficiencia = MOCK_PRODUCTION_EFFICIENCY.summary.avgEfficiency

    // Generate previous values with realistic variance
    const randomVariance = (base: number, v: number) => {
        const change = (Math.random() - 0.5) * 2 * v * base
        return base - change // Previous value
    }

    const prevReceita = randomVariance(currentReceita, variance)
    const prevMargem = randomVariance(currentMargem, variance * 0.5) // Less variance for percentages
    const prevDesperdicio = randomVariance(currentDesperdicio, variance * 0.5)
    const prevEficiencia = randomVariance(currentEficiencia, variance * 0.3)

    // Top products comparison
    const topProducts = MOCK_MARGIN_ANALYSIS.items.slice(0, 5).map(item => {
        const prevSales = randomVariance(item.unitsSold, variance)
        return {
            name: item.name,
            currentSales: item.unitsSold,
            previousSales: Math.round(prevSales),
            change: ((item.unitsSold - prevSales) / prevSales) * 100
        }
    })

    return {
        kpis: {
            receita: {
                current: currentReceita,
                previous: Math.round(prevReceita),
                change: ((currentReceita - prevReceita) / prevReceita) * 100
            },
            margem: {
                current: currentMargem,
                previous: Math.round(prevMargem * 10) / 10,
                change: currentMargem - prevMargem
            },
            desperdicio: {
                current: currentDesperdicio,
                previous: Math.round(prevDesperdicio * 10) / 10,
                change: currentDesperdicio - prevDesperdicio
            },
            eficiencia: {
                current: currentEficiencia,
                previous: Math.round(prevEficiencia * 10) / 10,
                change: currentEficiencia - prevEficiencia
            }
        },
        topProducts
    }
}

// Pre-generated comparison data for each period
export const COMPARISON_DATA: Record<ComparisonPeriod, ComparisonData> = {
    lastMonth: {
        kpis: {
            receita: { current: 847520, previous: 812340, change: 4.33 },
            margem: { current: 43.8, previous: 41.2, change: 2.6 },
            desperdicio: { current: 9.8, previous: 11.2, change: -1.4 },
            eficiencia: { current: 89.5, previous: 87.1, change: 2.4 }
        },
        topProducts: [
            { name: 'Pão Francês', currentSales: 3200, previousSales: 3050, change: 4.92 },
            { name: 'Croissant', currentSales: 450, previousSales: 480, change: -6.25 },
            { name: 'Bolo de Chocolate', currentSales: 320, previousSales: 290, change: 10.34 },
            { name: 'Pão de Queijo', currentSales: 2800, previousSales: 2650, change: 5.66 },
            { name: 'Sonho', currentSales: 380, previousSales: 410, change: -7.32 }
        ]
    },
    lastQuarter: {
        kpis: {
            receita: { current: 847520, previous: 756200, change: 12.08 },
            margem: { current: 43.8, previous: 38.5, change: 5.3 },
            desperdicio: { current: 9.8, previous: 13.4, change: -3.6 },
            eficiencia: { current: 89.5, previous: 82.3, change: 7.2 }
        },
        topProducts: [
            { name: 'Pão Francês', currentSales: 3200, previousSales: 2800, change: 14.29 },
            { name: 'Croissant', currentSales: 450, previousSales: 520, change: -13.46 },
            { name: 'Bolo de Chocolate', currentSales: 320, previousSales: 250, change: 28.00 },
            { name: 'Pão de Queijo', currentSales: 2800, previousSales: 2400, change: 16.67 },
            { name: 'Sonho', currentSales: 380, previousSales: 450, change: -15.56 }
        ]
    },
    lastYear: {
        kpis: {
            receita: { current: 847520, previous: 654800, change: 29.43 },
            margem: { current: 43.8, previous: 35.2, change: 8.6 },
            desperdicio: { current: 9.8, previous: 15.8, change: -6.0 },
            eficiencia: { current: 89.5, previous: 76.4, change: 13.1 }
        },
        topProducts: [
            { name: 'Pão Francês', currentSales: 3200, previousSales: 2400, change: 33.33 },
            { name: 'Croissant', currentSales: 450, previousSales: 380, change: 18.42 },
            { name: 'Bolo de Chocolate', currentSales: 320, previousSales: 180, change: 77.78 },
            { name: 'Pão de Queijo', currentSales: 2800, previousSales: 2100, change: 33.33 },
            { name: 'Sonho', currentSales: 380, previousSales: 320, change: 18.75 }
        ]
    }
}
