// ═══════════════════════════════════════════════════════════════════
// AI MODULE — Mock Data (Temporary)
// ═══════════════════════════════════════════════════════════════════

import type { Quotation } from './types'

export type MockQuotations = Record<string, Quotation[]>

export const createMockQuotations = (): MockQuotations => ({
    pendente: [],
    aguardando: [
        {
            id: 'q1', supplier: 'João Silva', supplierInitial: 'J', itemCount: 3, timestamp: '2 dias atrás',
            items: [
                { name: 'Farinha Tipo 00', current: 45, max: 100, requested: 55 },
                { name: 'Fermento Biológico', current: 2, max: 10, requested: 8 },
                { name: 'Sal Marinho', current: 3, max: 5, requested: 2 }
            ]
        },
        {
            id: 'q2', supplier: 'Maria Santos', supplierInitial: 'M', itemCount: 2, timestamp: '3 dias atrás',
            items: [
                { name: 'Mussarela di Bufala', current: 2, max: 8, requested: 6 },
                { name: 'Gorgonzola', current: 1, max: 3, requested: 2 }
            ]
        }
    ],
    ordens: [
        {
            id: 'q3', supplier: 'Pedro Oliveira', supplierInitial: 'P', itemCount: 4, timestamp: '1 dia atrás',
            items: [{ name: 'Azeite Extra Virgem', current: 5, max: 15, requested: 10 }]
        }
    ],
    recebido: [
        {
            id: 'q4', supplier: 'Ana Costa', supplierInitial: 'A', itemCount: 2, timestamp: '5 dias atrás',
            items: [{ name: 'Molho San Marzano', current: 8, max: 30, requested: 22 }]
        }
    ],
    historico: [
        { id: 'q5', supplier: 'Carlos Mendes', supplierInitial: 'C', itemCount: 5, timestamp: '1 semana atrás', items: [] }
    ]
})
