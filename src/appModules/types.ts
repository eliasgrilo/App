// ═══════════════════════════════════════════════════════════════════
// APP MODULE — Types & Configuration
// ═══════════════════════════════════════════════════════════════════

import type { ComponentType } from 'react'
import type { IconProps } from './components/NavIcons'
import {
    AIIcon, KanbanIcon, ProductsIcon,
    InventoryIcon, SuppliersIcon, CostsIcon, ProductionIcon
} from './components/NavIcons'

export type UnitMode = 'pct' | 'grams'

export interface NavItem {
    key: string
    label: string
    icon: ComponentType<IconProps>
}

export const NAV_ITEMS: NavItem[] = [
    { key: 'ai', label: 'Dashboard', icon: AIIcon },
    { key: 'kanban', label: 'Vendas', icon: KanbanIcon },
    { key: 'calculator', label: 'Produção', icon: ProductionIcon },
    { key: 'inventory', label: 'Inventário', icon: InventoryIcon },
    { key: 'products', label: 'Compras', icon: ProductsIcon },
    { key: 'costs', label: 'Financeiro', icon: CostsIcon },
    { key: 'suppliers', label: 'Fornecedores', icon: SuppliersIcon }
]

// Spring animation configuration
export const spring = {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.8
}

// Page transition variants
export const pageVariants = {
    initial: { opacity: 0, x: 20 },
    enter: {
        opacity: 1, x: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
    },
    exit: {
        opacity: 0, x: -20,
        transition: { duration: 0.15 }
    }
}
