import type { Quotation, HistoryQuotation } from './types'

export interface MockQuotations {
    pendente: Quotation[]
    aguardando: Quotation[]
    ordens: Quotation[]
    recebido: Quotation[]
    historico: HistoryQuotation[]
}

export const createMockQuotations = (): MockQuotations => ({
    pendente: [
        {
            id: 'p1', supplier: 'João', supplierInitial: 'J', itemCount: 3, timestamp: 'Agora',
            supplierEmail: 'karimgosson@gmail.com',
            items: [
                { name: 'Mussarela', current: 10, max: 100, requested: 90 },
                { name: 'Tomato Sauce', current: 10, max: 100, requested: 90 },
                { name: 'Abacaxi', current: 1, max: 40, requested: 39 }
            ]
        }
    ],
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
            id: 'q3', supplier: 'João', supplierInitial: 'J', itemCount: 3, timestamp: 'Jan 01, 2026',
            items: [
                { name: 'Mussarela', current: 10, max: 100, requested: 90 },
                { name: 'Tomato Sauce', current: 10, max: 100, requested: 90 },
                { name: 'Abacaxi', current: 1, max: 40, requested: 39 }
            ]
        }
    ],
    recebido: [
        {
            id: 'q4', supplier: 'João', supplierInitial: 'J', itemCount: 3, timestamp: 'Jan 01, 2026',
            items: [
                { name: 'Mussarela', current: 10, max: 100, requested: 90 },
                { name: 'Tomato Sauce', current: 10, max: 100, requested: 90 },
                { name: 'Abacaxi', current: 1, max: 40, requested: 39 }
            ]
        }
    ],
    historico: [
        {
            id: 'h1', supplier: 'João', supplierInitial: 'J', itemCount: 3, timestamp: 'Jan 01, 2026',
            supplierEmail: 'karimgosson@gmail.com', status: 'sem_resposta', time: '08:29 PM',
            items: [
                { name: 'Mussarela', current: 10, max: 100, requested: 90 },
                { name: 'Tomato Sauce', current: 10, max: 100, requested: 90 },
                { name: 'Abacaxi', current: 1, max: 40, requested: 39 }
            ]
        },
        {
            id: 'h2', supplier: 'João', supplierInitial: 'J', itemCount: 1, timestamp: 'Jan 01, 2026',
            supplierEmail: 'karimgosson@gmail.com', status: 'sem_resposta', time: '05:31 PM',
            items: [
                { name: 'Abacaxi', current: 1, max: 40, requested: 39 }
            ]
        },
        {
            id: 'h3', supplier: 'João', supplierInitial: 'J', itemCount: 2, timestamp: 'Jan 01, 2026',
            supplierEmail: 'karimgosson@gmail.com', status: 'recebido', time: '12:07 PM',
            items: [
                { name: 'Mussarela', current: 10, max: 100, requested: 90 },
                { name: 'Tomato Sauce', current: 10, max: 100, requested: 90 }
            ]
        }
    ]
})
