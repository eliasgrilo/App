// ═══════════════════════════════════════════════════════════════════
// APP MODULE — Types & Configuration
// ═══════════════════════════════════════════════════════════════════

import type { ComponentType } from 'react'
import type { Variants } from 'framer-motion'
import type { IconProps } from './components/NavIcons'
import {
    AIIcon, ProductsIcon, SalesIcon,
    InventoryIcon, SuppliersIcon, CostsIcon, ProductionIcon, ReportsIcon
} from './components/NavIcons'

export type UnitMode = 'pct' | 'grams'

export interface NavItem {
    key: string
    label: string
    icon: ComponentType<IconProps>
}

export const NAV_ITEMS: NavItem[] = [
    { key: 'ai', label: 'Dashboard', icon: AIIcon },
    { key: 'sales', label: 'Vendas', icon: SalesIcon },
    { key: 'calculator', label: 'Produção', icon: ProductionIcon },
    { key: 'inventory', label: 'Inventário', icon: InventoryIcon },
    { key: 'reports', label: 'Relatórios', icon: ReportsIcon },
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
// CRITICAL: Only use opacity transitions, NOT transform (x/y)!
// Transform animations create new stacking contexts which break
// position: sticky for child elements (like headers).
export const pageVariants: Variants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15 }
    }
}
