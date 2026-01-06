/**
 * SectionWrapper — Reorder wrapper for recipe sections
 */

import React from 'react'
import { Reorder, useDragControls } from 'framer-motion'

interface SectionWrapperProps {
    id: any
    children: (controls: any) => React.ReactNode
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
