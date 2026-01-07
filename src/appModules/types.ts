// ═══════════════════════════════════════════════════════════════════
// APP MODULE — Types & Configuration
// ═══════════════════════════════════════════════════════════════════

import type { ComponentType } from 'react'
import type { IconProps } from './components/NavIcons'
import {
    AIIcon, KanbanIcon, RecipesIcon, ProductsIcon,
    InventoryIcon, SuppliersIcon, CostsIcon, FichaIcon, ProductionIcon
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
    { key: 'products', label: 'Compras', icon: ProductsIcon },
    { key: 'inventory', label: 'Inventário', icon: InventoryIcon },
    { key: 'costs', label: 'Financeiro', icon: CostsIcon },
    { key: 'suppliers', label: 'Parceiros', icon: SuppliersIcon },
    { key: 'recipes', label: 'Receitas', icon: RecipesIcon },
    { key: 'ficha', label: 'Ficha', icon: FichaIcon }
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
