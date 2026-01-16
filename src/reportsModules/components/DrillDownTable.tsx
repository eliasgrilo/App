/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DRILL DOWN TABLE — Apple-Style Expandable Hierarchy
 * 
 * Expandable data table with:
 * - Smooth height transitions
 * - Hierarchical navigation
 * - Sparkline integration
 * - Animated row expansion
 * 
 * @author Padoca Engineering Team
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface DrillDownColumn<T> {
    key: keyof T | string
    header: string
    width?: string
    align?: 'left' | 'center' | 'right'
    render?: (value: any, row: T, level: number) => React.ReactNode
}

interface DrillDownRow<T> {
    data: T
    children?: DrillDownRow<T>[]
}

interface DrillDownTableProps<T> {
    data: DrillDownRow<T>[]
    columns: DrillDownColumn<T>[]
    keyField: keyof T
    className?: string
    onRowClick?: (row: T, level: number) => void
    expandedByDefault?: boolean
    maxLevel?: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface RowProps<T> {
    row: DrillDownRow<T>
    columns: DrillDownColumn<T>[]
    keyField: keyof T
    level: number
    expandedByDefault: boolean
    maxLevel: number
    onRowClick?: (row: T, level: number) => void
}

function DrillDownRowComponent<T>({
    row,
    columns,
    keyField,
    level,
    expandedByDefault,
    maxLevel,
    onRowClick
}: RowProps<T>) {
    const [isExpanded, setIsExpanded] = useState(expandedByDefault && level < maxLevel)
    const hasChildren = row.children && row.children.length > 0

    const handleToggle = useCallback(() => {
        if (hasChildren) {
            setIsExpanded(prev => !prev)
        }
        onRowClick?.(row.data, level)
    }, [hasChildren, onRowClick, row.data, level])

    // Indentation based on level
    const indentPx = level * 24

    // Background based on level
    const bgClass = level === 0
        ? 'bg-white dark:bg-zinc-900'
        : level === 1
            ? 'bg-zinc-50 dark:bg-zinc-800/50'
            : 'bg-zinc-100 dark:bg-zinc-800'

    return (
        <>
            {/* Main Row */}
            <motion.tr
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={handleToggle}
                className={`
                    ${bgClass}
                    ${hasChildren ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50' : ''}
                    border-b border-zinc-200/60 dark:border-zinc-700/40
                    transition-colors duration-150
                `}
            >
                {columns.map((column, colIndex) => {
                    const value = typeof column.key === 'string'
                        ? (row.data as any)[column.key]
                        : row.data[column.key]

                    const content = column.render
                        ? column.render(value, row.data, level)
                        : String(value ?? '')

                    return (
                        <td
                            key={String(column.key)}
                            style={{
                                width: column.width,
                                paddingLeft: colIndex === 0 ? `${12 + indentPx}px` : undefined,
                                textAlign: column.align || 'left'
                            }}
                            className="py-3 px-3 text-sm text-zinc-900 dark:text-white"
                        >
                            <div className="flex items-center gap-2">
                                {/* Expand/collapse icon for first column */}
                                {colIndex === 0 && hasChildren && (
                                    <motion.span
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-shrink-0"
                                    >
                                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                                    </motion.span>
                                )}
                                {colIndex === 0 && !hasChildren && level > 0 && (
                                    <span className="w-4" />
                                )}
                                <span className={`${level === 0 ? 'font-medium' : ''}`}>
                                    {content}
                                </span>
                            </div>
                        </td>
                    )
                })}
            </motion.tr>

            {/* Children */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <>
                        {row.children!.map((child) => (
                            <DrillDownRowComponent
                                key={String(child.data[keyField])}
                                row={child}
                                columns={columns}
                                keyField={keyField}
                                level={level + 1}
                                expandedByDefault={expandedByDefault}
                                maxLevel={maxLevel}
                                onRowClick={onRowClick}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function DrillDownTable<T>({
    data,
    columns,
    keyField,
    className = '',
    onRowClick,
    expandedByDefault = false,
    maxLevel = 3
}: DrillDownTableProps<T>) {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full border-collapse">
                {/* Header */}
                <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/80">
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                style={{ width: column.width, textAlign: column.align || 'left' }}
                                className="
                                    py-3 px-3 text-xs font-semibold uppercase tracking-wider
                                    text-zinc-500 dark:text-zinc-400
                                    border-b border-zinc-200 dark:border-zinc-700
                                "
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    <AnimatePresence>
                        {data.map((row) => (
                            <DrillDownRowComponent
                                key={String(row.data[keyField])}
                                row={row}
                                columns={columns}
                                keyField={keyField}
                                level={0}
                                expandedByDefault={expandedByDefault}
                                maxLevel={maxLevel}
                                onRowClick={onRowClick}
                            />
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Transform flat data to hierarchical
// ═══════════════════════════════════════════════════════════════════════════════

export function groupByCategory<T>(
    items: T[],
    categoryField: keyof T,
    itemKeyField: keyof T
): DrillDownRow<T>[] {
    const groups = new Map<string, T[]>()

    items.forEach(item => {
        const category = String(item[categoryField])
        if (!groups.has(category)) {
            groups.set(category, [])
        }
        groups.get(category)!.push(item)
    })

    return Array.from(groups.entries()).map(([category, groupItems]) => ({
        data: {
            [itemKeyField]: `category-${category}`,
            [categoryField]: category,
            // Calculate aggregates
            name: category,
            isCategory: true
        } as unknown as T,
        children: groupItems.map(item => ({ data: item }))
    }))
}

export default DrillDownTable
