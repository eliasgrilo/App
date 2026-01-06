import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Button from './Button'

/**
 * ═══════════════════════════════════════════════════════════════════
 * EMPTY STATE — Premium Empty State Component
 * ═══════════════════════════════════════════════════════════════════
 */

interface ActionConfig {
    label: string
    onClick: () => void
    icon?: ReactNode
}

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: ActionConfig
    secondaryAction?: ActionConfig
    className?: string
}

interface OnAddProps {
    onAdd: () => void
}

interface QueryProps {
    query: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    secondaryAction,
    className = ''
}) => {
    const DefaultIcon: React.FC = () => (
        <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
        </svg>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-20 h-20 mb-6 p-5 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
            >
                {icon || <DefaultIcon />}
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-xl font-bold text-zinc-900 dark:text-white mb-2"
            >
                {title}
            </motion.h3>

            {description && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6"
                >
                    {description}
                </motion.p>
            )}

            {(action || secondaryAction) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="flex items-center gap-3"
                >
                    {action && (
                        <Button
                            variant="primary"
                            onClick={action.onClick}
                            icon={action.icon}
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            variant="ghost"
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </motion.div>
            )}
        </motion.div>
    )
}

export const NoRecipesState: React.FC<OnAddProps> = ({ onAdd }) => (
    <EmptyState
        icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        }
        title="Nenhuma receita"
        description="Crie sua primeira receita para começar a calcular custos e fichas técnicas."
        action={{ label: "Criar Receita", onClick: onAdd }}
    />
)

export const NoProductsState: React.FC<OnAddProps> = ({ onAdd }) => (
    <EmptyState
        icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        }
        title="Nenhum produto"
        description="Adicione produtos para gerenciar seu catálogo e calcular preços."
        action={{ label: "Adicionar Produto", onClick: onAdd }}
    />
)

export const NoIngredientsState: React.FC<OnAddProps> = ({ onAdd }) => (
    <EmptyState
        icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        }
        title="Nenhum ingrediente"
        description="Cadastre ingredientes para usar em suas receitas e controlar estoque."
        action={{ label: "Adicionar Ingrediente", onClick: onAdd }}
    />
)

export const NoSearchResults: React.FC<QueryProps> = ({ query }) => (
    <EmptyState
        icon={
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        }
        title="Nenhum resultado"
        description={`Não encontramos resultados para "${query}". Tente buscar com outras palavras.`}
    />
)

export default EmptyState
