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
import { MOCK_SALES_HEATMAP } from '../components/SalesHeatmapChart'
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

const generateHeatmapSection = (): string => {
    const data = MOCK_SALES_HEATMAP

    // Aggregate sales by day
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    const dayTotals = days.map(day => {
        const dayCells = data.cells.filter(c => c.day === day)
        const defaultCell = { day, hour: 12, value: 0, intensity: 0, orders: 0, avgTicket: 0 }
        return {
            day,
            total: dayCells.reduce((sum, c) => sum + c.value, 0),
            orders: dayCells.reduce((sum, c) => sum + c.orders, 0),
            peakHour: dayCells.length > 0 ? dayCells.reduce((max, c) => c.value > max!.value ? c : max, dayCells[0])! : defaultCell,
        }
    })

    return `
    <section class="no-break" style="margin-bottom: 40pt;">
        <h2 style="font-size: 13pt; font-weight: 600; color: #1d1d1f; margin: 0 0 16pt 0; padding-bottom: 8pt; border-bottom: 2pt solid #1d1d1f;">
            Horários de Pico de Vendas
        </h2>
        
        <div style="margin-bottom: 20pt;">
            <span style="display: inline-block; padding: 12pt 16pt; background: #FF3B3020; border-radius: 8pt; margin-right: 12pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #FF3B30; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Horário de Pico</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF3B30;">${data.summary.peakDay} ${data.summary.peakHour}h</span>
            </span>
            <span style="display: inline-block; padding: 12pt 16pt; background: #007AFF20; border-radius: 8pt; margin-right: 12pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #007AFF; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Menor Movimento</span>
                <span style="font-size: 16pt; font-weight: 600; color: #007AFF;">${data.summary.slowestDay} ${data.summary.slowestHour}h</span>
            </span>
            <span style="display: inline-block; padding: 12pt 16pt; background: #34C75920; border-radius: 8pt; margin-right: 12pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #34C759; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Total Semanal</span>
                <span style="font-size: 16pt; font-weight: 600; color: #34C759;">R$ ${data.summary.totalSales.toLocaleString('pt-BR')}</span>
            </span>
            <span style="display: inline-block; padding: 12pt 16pt; background: #f5f5f7; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Média por Hora</span>
                <span style="font-size: 16pt; font-weight: 600; color: #1d1d1f;">R$ ${data.summary.avgHourlySales.toLocaleString('pt-BR')}</span>
            </span>
        </div>
        
        <h3 style="font-size: 11pt; font-weight: 600; color: #1d1d1f; margin: 0 0 12pt 0;">Vendas por Dia da Semana</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align: left;">Dia</th>
                    <th style="text-align: right;">Total Vendas</th>
                    <th style="text-align: right;">Pedidos</th>
                    <th style="text-align: right;">Ticket Médio</th>
                    <th style="text-align: center;">Horário de Pico</th>
                </tr>
            </thead>
            <tbody>
                ${dayTotals.map(d => `
                <tr>
                    <td style="font-weight: 500;">${d.day}</td>
                    <td style="text-align: right; font-weight: 600;">R$ ${d.total.toLocaleString('pt-BR')}</td>
                    <td style="text-align: right;">${d.orders}</td>
                    <td style="text-align: right;">R$ ${Math.round(d.total / d.orders).toLocaleString('pt-BR')}</td>
                    <td style="text-align: center;">${d.peakHour?.hour ?? 12}h - R$ ${(d.peakHour?.value ?? 0).toLocaleString('pt-BR')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h3 style="font-size: 11pt; font-weight: 600; color: #1d1d1f; margin: 20pt 0 12pt 0;">Insights e Recomendações</h3>
        ${data.patterns.map(p => `
        <div style="padding: 10pt 12pt; background: #f5f5f7; border-radius: 8pt; margin-bottom: 8pt;">
            <p style="font-weight: 500; margin: 0 0 4pt 0; color: #1d1d1f;">${p.description}</p>
            <p style="font-size: 10pt; color: #86868b; margin: 0;">💡 ${p.recommendation}</p>
        </div>
        `).join('')}
    </section>
    `
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

const generateInventoryPulseSection = (): string => {
    // Complete inventory items data for printing
    const items = [
        { name: 'Farinha de Trigo T55', category: 'Farinhas', qty: 250, min: 100, max: 400, unit: 'kg', status: 'optimal', days: 12 },
        { name: 'Leite Integral', category: 'Laticínios', qty: 45, min: 60, max: 120, unit: 'L', status: 'low', days: 3 },
        { name: 'Fermento Biológico', category: 'Fermentos', qty: 15, min: 20, max: 50, unit: 'kg', status: 'critical', days: 2 },
        { name: 'Açúcar Cristal', category: 'Açúcares', qty: 180, min: 50, max: 200, unit: 'kg', status: 'optimal', days: 25 },
        { name: 'Manteiga sem Sal', category: 'Gorduras', qty: 35, min: 40, max: 80, unit: 'kg', status: 'low', days: 4 },
        { name: 'Creme de Leite', category: 'Laticínios', qty: 8, min: 15, max: 40, unit: 'L', status: 'critical', days: 1 },
        { name: 'Chocolate 70%', category: 'Açúcares', qty: 25, min: 10, max: 40, unit: 'kg', status: 'optimal', days: 18 },
        { name: 'Farinha Integral', category: 'Farinhas', qty: 120, min: 30, max: 150, unit: 'kg', status: 'excess', days: 35 },
        { name: 'Ovos', category: 'Laticínios', qty: 480, min: 200, max: 600, unit: 'un', status: 'optimal', days: 8 },
        { name: 'Sal Refinado', category: 'Temperos', qty: 12, min: 5, max: 25, unit: 'kg', status: 'optimal', days: 45 },
        { name: 'Óleo de Soja', category: 'Gorduras', qty: 20, min: 15, max: 50, unit: 'L', status: 'optimal', days: 14 },
        { name: 'Leite Condensado', category: 'Laticínios', qty: 24, min: 30, max: 60, unit: 'un', status: 'low', days: 5 },
    ]

    const statusLabels: Record<string, string> = { critical: 'Crítico', low: 'Baixo', optimal: 'OK', excess: 'Excesso' }

    const criticalCount = items.filter(i => i.status === 'critical').length
    const lowCount = items.filter(i => i.status === 'low').length

    return `
    <section class="no-break" style="margin-bottom: 40pt;">
        <h2 style="font-size: 13pt; font-weight: 600; color: #1d1d1f; margin: 0 0 16pt 0; padding-bottom: 8pt; border-bottom: 2pt solid #1d1d1f;">
            Pulse do Estoque
        </h2>
        <div style="margin-bottom: 20pt;">
            <span style="display: inline-block; padding: 12pt 16pt; background: #34C75920; border-radius: 8pt; margin-right: 12pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #34C759; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Saúde Geral</span>
                <span style="font-size: 16pt; font-weight: 600; color: #34C759;">87%</span>
            </span>
            <span style="display: inline-block; padding: 12pt 16pt; background: #007AFF20; border-radius: 8pt; margin-right: 12pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #007AFF; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Total Itens</span>
                <span style="font-size: 16pt; font-weight: 600; color: #007AFF;">${items.length}</span>
            </span>
            <span style="display: inline-block; padding: 12pt 16pt; background: #FF3B3020; border-radius: 8pt; margin-right: 12pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #FF3B30; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Críticos</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF3B30;">${criticalCount}</span>
            </span>
            <span style="display: inline-block; padding: 12pt 16pt; background: #FF950020; border-radius: 8pt;">
                <span style="display: block; font-size: 9pt; font-weight: 500; color: #FF9500; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4pt;">Baixos</span>
                <span style="font-size: 16pt; font-weight: 600; color: #FF9500;">${lowCount}</span>
            </span>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th style="text-align: left;">Item</th>
                    <th style="text-align: left;">Categoria</th>
                    <th style="text-align: right;">Qtd. Atual</th>
                    <th style="text-align: right;">Mínimo</th>
                    <th style="text-align: right;">Máximo</th>
                    <th style="text-align: center;">Status</th>
                    <th style="text-align: right;">Dias Rest.</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr>
                    <td style="font-weight: 500;">${item.name}</td>
                    <td style="color: #86868b;">${item.category}</td>
                    <td style="text-align: right; font-weight: 600;">${item.qty} ${item.unit}</td>
                    <td style="text-align: right; color: #86868b;">${item.min}</td>
                    <td style="text-align: right; color: #86868b;">${item.max}</td>
                    <td style="text-align: center; font-weight: 500;">${statusLabels[item.status]}</td>
                    <td style="text-align: right;">${item.days}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </section>
`
}

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
        if (selectedReports.includes('heatmap')) sections.push(generateHeatmapSection())
        if (selectedReports.includes('inventory')) sections.push(generateInventoryPulseSection())

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

        // Use Blob URL to avoid Safari confirmation dialog
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)

        const frame = document.createElement('iframe')
        frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
        frame.src = url

        frame.onload = () => {
            setTimeout(() => {
                frame.contentWindow?.print()
                setTimeout(() => {
                    frame.remove()
                    URL.revokeObjectURL(url)
                }, 100)
            }, 100)
        }

        document.body.appendChild(frame)
    }, [selectedReports, dateRange, abcData, breakageData, velocityData])

    return { handlePrint }
}

export default useReportsPrint
