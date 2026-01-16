/**
 * SectionWrapper — Reorder wrapper for recipe sections
 */

import React from 'react'
import { Reorder, useDragControls, DragControls } from 'framer-motion'
import type { RecipeSection } from '../../types'

interface SectionWrapperProps {
    id: RecipeSection
    children: (controls: DragControls) => React.ReactNode
}

export const SectionWrapper = ({ id, children }: SectionWrapperProps): React.ReactElement => {
    const controls = useDragControls()
    return (
        <Reorder.Item value={id} dragListener={false} dragControls={controls} className="relative bg-white dark:bg-black">
            {children(controls)}
        </Reorder.Item>
    )
}

export default SectionWrapper
