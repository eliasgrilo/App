/**
 * useReportsPrint — Print Functionality Hook
 * 
 * Handles print document generation for ALL 8 report types.
 * Uses popup window approach for isolated light-mode printing.
 * 
 * @author Padoca Engineering Team
 */

import { useCallback } from 'react'
import { PRINT_CSS } from '../print/PrintStyles'
import {
    BAKERY_INFO,
    formatCurrency,
    formatPercent,
    formatDate,
    formatDateTime,
    MOCK_MARGIN_ANALYSIS,
    MOCK_DEMAND_FORECAST,
    MOCK_PRODUCTION_EFFICIENCY,
    MOCK_SUPPLIER_ANALYSIS,
    MOCK_CASHFLOW_ANALYSIS,
} from '../mockReportsData'
import type {
    DateRange,
    ReportType,
    ABCAnalysis,
    BreakageAnalysis,
    VelocityAnalysis
} from '../types'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UseReportsPrintProps {
    selectedReports: ReportType[]
    dateRange: DateRange
    abcData: ABCAnalysis
    breakageData: BreakageAnalysis
    velocityData: VelocityAnalysis
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

const generateABCSection = (data: ABCAnalysis): string => `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Curva ABC de Insumos
        </h2>
        <div style="margin-bottom: 16pt;">
            <span style="display: inline-block; padding: 10pt 14pt; background: #f5f5f7; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #86868b; text-transform: uppercase;">Classe A</span>
                <span style="font-size: 16pt; font-weight: 600;">${data.totals.classA.count} itens</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #f5f5f7; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #86868b; text-transform: uppercase;">Classe B</span>
                <span style="font-size: 16pt; font-weight: 600;">${data.totals.classB.count} itens</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #f5f5f7; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; color: #86868b; text-transform: uppercase;">Classe C</span>
                <span style="font-size: 16pt; font-weight: 600;">${data.totals.classC.count} itens</span>
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Ingrediente</th>
                    <th style="text-align: center;">Classe</th>
                    <th style="text-align: right;">Valor</th>
                    <th style="text-align: right;">%</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.slice(0, 15).map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: center;"><span style="display: inline-block; padding: 2pt 8pt; border-radius: 4pt; background: ${item.classification === 'A' ? '#FF3B30' : item.classification === 'B' ? '#FF9500' : '#34C759'}20; color: ${item.classification === 'A' ? '#FF3B30' : item.classification === 'B' ? '#FF9500' : '#34C759'}; font-weight: 600;">${item.classification}</span></td>
                    <td style="text-align: right;">${formatCurrency(item.totalCost)}</td>
                    <td style="text-align: right;">${formatPercent(item.percentage)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
`

const generateBreakageSection = (data: BreakageAnalysis): string => `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Análise de Quebras
        </h2>
        <div style="margin-bottom: 16pt;">
            <span style="display: inline-block; padding: 10pt 14pt; background: #f5f5f7; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #86868b; text-transform: uppercase;">Total Produzido</span>
                <span style="font-size: 16pt; font-weight: 600;">${data.totals.totalProduced.toLocaleString()} un</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #FF3B3020; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #FF3B30; text-transform: uppercase;">Total Perdido</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF3B30;">${data.totals.totalWasted.toLocaleString()} un</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #FF3B3010; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; color: #FF3B30; text-transform: uppercase;">% Perda</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF3B30;">${formatPercent(data.totals.overallWastePercentage)}</span>
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Produto</th>
                    <th style="text-align: right;">Produzido</th>
                    <th style="text-align: right;">Vendido</th>
                    <th style="text-align: right;">Perdido</th>
                    <th style="text-align: right;">% Perda</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.produced.toLocaleString()}</td>
                    <td style="text-align: right;">${item.sold.toLocaleString()}</td>
                    <td style="text-align: right; color: #FF3B30;">${item.wasted.toLocaleString()}</td>
                    <td style="text-align: right; color: ${item.wastePercentage > 10 ? '#FF3B30' : '#34C759'};">${formatPercent(item.wastePercentage)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
`

const generateVelocitySection = (data: VelocityAnalysis): string => `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Giro de Estoque
        </h2>
        <div style="margin-bottom: 16pt;">
            <span style="display: inline-block; padding: 10pt 14pt; background: #f5f5f7; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #86868b; text-transform: uppercase;">Giro Médio</span>
                <span style="font-size: 16pt; font-weight: 600;">${data.summary.avgTurnoverRate.toFixed(1)}x</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #FF950020; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; color: #FF9500; text-transform: uppercase;">Risco Vencimento</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF9500;">${data.summary.expiryRiskCount} itens</span>
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align: right;">Estoque</th>
                    <th style="text-align: right;">Dias Rest.</th>
                    <th style="text-align: right;">Giro</th>
                    <th style="text-align: center;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.slice(0, 12).map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.currentStock.toLocaleString()} ${item.unit}</td>
                    <td style="text-align: right;">${item.daysRemaining} dias</td>
                    <td style="text-align: right;">${item.turnoverRate.toFixed(1)}x</td>
                    <td style="text-align: center;"><span style="display: inline-block; padding: 2pt 8pt; border-radius: 4pt; background: ${item.status === 'critical' ? '#FF3B30' : item.status === 'warning' ? '#FF9500' : '#34C759'}20; color: ${item.status === 'critical' ? '#FF3B30' : item.status === 'warning' ? '#FF9500' : '#34C759'}; font-weight: 500; font-size: 9pt;">${item.status === 'critical' ? 'Crítico' : item.status === 'warning' ? 'Atenção' : 'Normal'}</span></td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
`

const generateMarginSection = (): string => {
    const data = MOCK_MARGIN_ANALYSIS
    return `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Margem de Contribuição
        </h2>
        <div style="margin-bottom: 16pt;">
            <span style="display: inline-block; padding: 10pt 14pt; background: #34C75920; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #34C759; text-transform: uppercase;">Margem Média</span>
                <span style="font-size: 16pt; font-weight: 600; color: #34C759;">${formatPercent(data.summary.avgMarginPercent)}</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #f5f5f7; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; color: #86868b; text-transform: uppercase;">Margem Total</span>
                <span style="font-size: 16pt; font-weight: 600;">${formatCurrency(data.summary.totalMargin)}</span>
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Produto</th>
                    <th style="text-align: right;">Preço</th>
                    <th style="text-align: right;">Custo</th>
                    <th style="text-align: right;">Margem %</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.slice(0, 12).map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                    <td style="text-align: right;">${formatCurrency(item.unitCost)}</td>
                    <td style="text-align: right; color: ${item.marginPercent >= 30 ? '#34C759' : item.marginPercent >= 15 ? '#FF9500' : '#FF3B30'};">${formatPercent(item.marginPercent)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
    `
}

const generateForecastSection = (): string => {
    const data = MOCK_DEMAND_FORECAST
    return `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Previsão de Demanda
        </h2>
        <table>
            <thead>
                <tr>
                    <th>Produto</th>
                    <th style="text-align: right;">Média Diária</th>
                    <th style="text-align: right;">Previsão</th>
                    <th style="text-align: center;">Tendência</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.slice(0, 10).map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.avgDailySales.toLocaleString()}</td>
                    <td style="text-align: right;">${item.forecastedDemand.toLocaleString()}</td>
                    <td style="text-align: center; color: ${item.trend === 'up' ? '#34C759' : item.trend === 'down' ? '#FF3B30' : '#8e8e93'};">
                        ${item.trend === 'up' ? '↑ Alta' : item.trend === 'down' ? '↓ Baixa' : '→ Estável'}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
    `
}

const generateEfficiencySection = (): string => {
    const data = MOCK_PRODUCTION_EFFICIENCY
    return `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Eficiência de Produção
        </h2>
        <div style="margin-bottom: 16pt;">
            <span style="display: inline-block; padding: 10pt 14pt; background: #007AFF20; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; color: #007AFF; text-transform: uppercase;">Eficiência Média</span>
                <span style="font-size: 16pt; font-weight: 600; color: #007AFF;">${formatPercent(data.summary.avgEfficiency)}</span>
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Processo</th>
                    <th style="text-align: right;">Tempo Padrão</th>
                    <th style="text-align: right;">Tempo Real</th>
                    <th style="text-align: right;">Eficiência</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.slice(0, 10).map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.standardTime} min</td>
                    <td style="text-align: right;">${item.actualTime} min</td>
                    <td style="text-align: right; color: ${item.efficiency >= 90 ? '#34C759' : item.efficiency >= 75 ? '#FF9500' : '#FF3B30'};">${formatPercent(item.efficiency)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
    `
}

const generateSuppliersSection = (): string => {
    const data = MOCK_SUPPLIER_ANALYSIS
    return `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Análise de Fornecedores
        </h2>
        <table>
            <thead>
                <tr>
                    <th>Fornecedor</th>
                    <th style="text-align: right;">Compras</th>
                    <th style="text-align: right;">Pontualidade</th>
                    <th style="text-align: right;">Qualidade</th>
                    <th style="text-align: center;">Rating</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${formatCurrency(item.totalPurchases)}</td>
                    <td style="text-align: right;">${formatPercent(item.onTimeDeliveryRate)}</td>
                    <td style="text-align: right;">${item.qualityScore.toFixed(1)}/10</td>
                    <td style="text-align: center;"><span style="display: inline-block; padding: 2pt 8pt; border-radius: 4pt; background: ${item.overallRating === 'A' ? '#34C759' : item.overallRating === 'B' ? '#007AFF' : item.overallRating === 'C' ? '#FF9500' : '#FF3B30'}20; color: ${item.overallRating === 'A' ? '#34C759' : item.overallRating === 'B' ? '#007AFF' : item.overallRating === 'C' ? '#FF9500' : '#FF3B30'}; font-weight: 600;">${item.overallRating}</span></td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
    `
}

const generateCashFlowSection = (): string => {
    const data = MOCK_CASHFLOW_ANALYSIS
    return `
    <section class="page-break no-break" style="margin-bottom: 32pt;">
        <h2 style="font-size: 13pt; font-weight: 600; border-bottom: 2pt solid #1d1d1f; padding-bottom: 8pt; margin: 0 0 16pt 0;">
            Fluxo de Caixa
        </h2>
        <div style="margin-bottom: 16pt;">
            <span style="display: inline-block; padding: 10pt 14pt; background: #34C75920; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #34C759; text-transform: uppercase;">Total Entradas</span>
                <span style="font-size: 16pt; font-weight: 600; color: #34C759;">${formatCurrency(data.summary.totalInflows)}</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #FF3B3020; border-radius: 8pt; margin-right: 10pt;">
                <span style="display: block; font-size: 9pt; color: #FF3B30; text-transform: uppercase;">Total Saídas</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF3B30;">${formatCurrency(data.summary.totalOutflows)}</span>
            </span>
            <span style="display: inline-block; padding: 10pt 14pt; background: #007AFF20; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; color: #007AFF; text-transform: uppercase;">Saldo</span>
                <span style="font-size: 16pt; font-weight: 600; color: #007AFF;">${formatCurrency(data.summary.netCashFlow)}</span>
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Período</th>
                    <th style="text-align: right;">Entradas</th>
                    <th style="text-align: right;">Saídas</th>
                    <th style="text-align: right;">Saldo</th>
                </tr>
            </thead>
            <tbody>
                ${data.periods.map(p => `
                <tr>
                    <td>${p.period}</td>
                    <td style="text-align: right; color: #34C759;">${formatCurrency(p.inflows)}</td>
                    <td style="text-align: right; color: #FF3B30;">${formatCurrency(p.outflows)}</td>
                    <td style="text-align: right; color: ${p.balance >= 0 ? '#007AFF' : '#FF3B30'};">${formatCurrency(p.balance)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
    `
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useReportsPrint({
    selectedReports,
    dateRange,
    abcData,
    breakageData,
    velocityData
}: UseReportsPrintProps) {

    const handlePrint = useCallback(() => {
        const sections: string[] = []

        // Generate sections for all selected reports
        if (selectedReports.includes('abc')) sections.push(generateABCSection(abcData))
        if (selectedReports.includes('breakage')) sections.push(generateBreakageSection(breakageData))
        if (selectedReports.includes('velocity')) sections.push(generateVelocitySection(velocityData))
        if (selectedReports.includes('margin')) sections.push(generateMarginSection())
        if (selectedReports.includes('forecast')) sections.push(generateForecastSection())
        if (selectedReports.includes('efficiency')) sections.push(generateEfficiencySection())
        if (selectedReports.includes('suppliers')) sections.push(generateSuppliersSection())
        if (selectedReports.includes('cashflow')) sections.push(generateCashFlowSection())

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relatório - ${BAKERY_INFO.name}</title>
    <style>${PRINT_CSS}</style>
</head>
<body>
    <header style="display: flex; justify-content: space-between; padding-bottom: 16pt; margin-bottom: 24pt; border-bottom: 1pt solid #d2d2d7;">
        <div style="display: flex; gap: 12pt; align-items: flex-start;">
            <div style="width: 36pt; height: 36pt; background: #1d1d1f; color: white; border-radius: 10pt; display: flex; align-items: center; justify-content: center; font-size: 15pt; font-weight: 700;">P</div>
            <div>
                <h1 style="font-size: 17pt; font-weight: 600; margin: 0 0 6pt 0;">${BAKERY_INFO.name}</h1>
                <p style="font-size: 10pt; color: #86868b; margin: 0;">CNPJ: ${BAKERY_INFO.cnpj}</p>
            </div>
        </div>
        <div style="text-align: right;">
            <h2 style="font-size: 15pt; font-weight: 600; margin: 0 0 8pt 0;">Relatório de Gestão</h2>
            <p style="font-size: 10pt; color: #86868b; margin: 0;">Período: ${formatDate(dateRange.start)} a ${formatDate(dateRange.end)}</p>
            <p style="font-size: 10pt; color: #86868b; margin: 0;">Gerado em: ${formatDateTime(new Date())}</p>
        </div>
    </header>
    
    ${sections.join('')}
    
    <footer style="margin-top: 40pt; padding-top: 16pt; border-top: 1pt solid #d2d2d7;">
        <p style="font-size: 9pt; color: #86868b; margin: 0;">
            Documento gerado automaticamente pelo sistema Padoca. 
            ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
    </footer>
</body>
</html>`

        const printWindow = window.open('', '_blank', 'width=800,height=600')
        if (printWindow) {
            printWindow.document.write(html)
            printWindow.document.close()
            setTimeout(() => printWindow.print(), 300)
        }
    }, [selectedReports, dateRange, abcData, breakageData, velocityData])

    return { handlePrint }
}

export default useReportsPrint
