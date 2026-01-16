/**
 * ═══════════════════════════════════════════════════════════════════
 * RecipeSection — Section type selector component
 * Routes to IngredientsTable or InstructionsTable based on type
 * ═══════════════════════════════════════════════════════════════════
 */

import React from 'react'
import { DragControls } from 'framer-motion'
import { IngredientsTable } from './IngredientsTable'
import { InstructionsTable } from './InstructionsTable'
import type { RecipeSectionItem } from '../../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES — Using flexible types to support various section formats
// ═══════════════════════════════════════════════════════════════════

interface RecipeSectionLocal {
    id: number | string
    type: 'ingredients' | 'instructions' | string
    title: string
    items: RecipeSectionItem[]
}

interface RecipeSectionProps {
    section: RecipeSectionLocal
    onUpdate: (section: RecipeSectionLocal) => void
    onDelete: () => void
    dragControls: DragControls
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
    // Type assertion needed due to local interface flexibility
    const handleUpdate = (s: RecipeSectionLocal) => onUpdate(s)

    if (section.type === 'ingredients') {
        return (
            <IngredientsTable
                section={section as Parameters<typeof IngredientsTable>[0]['section']}
                onUpdate={handleUpdate as Parameters<typeof IngredientsTable>[0]['onUpdate']}
                onDelete={onDelete}
                dragControls={dragControls}
                isEditing={isEditing}
            />
        )
    }

    if (section.type === 'instructions') {
        return (
            <InstructionsTable
                section={section as Parameters<typeof InstructionsTable>[0]['section']}
                onUpdate={handleUpdate as Parameters<typeof InstructionsTable>[0]['onUpdate']}
                onDelete={onDelete}
                dragControls={dragControls}
                isEditing={isEditing}
            />
        )
    }

    return null
}

export default RecipeSection
