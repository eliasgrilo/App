/**
 * ═══════════════════════════════════════════════════════════════════
 * RecipeSection — Section type selector component
 * Routes to IngredientsTable or InstructionsTable based on type
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { IngredientsTable } from './IngredientsTable'
import { InstructionsTable } from './InstructionsTable'

// ═══════════════════════════════════════════════════════════════════
// TYPES — Using flexible types to support various section formats
// ═══════════════════════════════════════════════════════════════════

interface RecipeSectionLocal {
    id: number | string
    type: 'ingredients' | 'instructions' | string
    title: string
    items: any[]
}

interface RecipeSectionProps {
    section: RecipeSectionLocal
    onUpdate: (section: RecipeSectionLocal) => void
    onDelete: () => void
    dragControls: any
    isEditing: boolean
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function RecipeSection({
    section,
    onUpdate,
    onDelete,
    dragControls,
    isEditing
}: RecipeSectionProps): React.ReactElement | null {
    if (section.type === 'ingredients') {
        return (
            <IngredientsTable
                section={section}
                onUpdate={onUpdate as any}
                onDelete={onDelete}
                dragControls={dragControls}
                isEditing={isEditing}
            />
        )
    }

    if (section.type === 'instructions') {
        return (
            <InstructionsTable
                section={section}
                onUpdate={onUpdate as any}
                onDelete={onDelete}
                dragControls={dragControls}
                isEditing={isEditing}
            />
        )
    }

    return null
}

export default RecipeSection
