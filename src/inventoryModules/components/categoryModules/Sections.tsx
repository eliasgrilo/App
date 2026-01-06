// ═══════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT MODULES — Section Components
// ═══════════════════════════════════════════════════════════════════

import React from 'react'

interface CategoryListProps { categories: string[]; onRemove: (cat: string) => void }

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onRemove }) => (
    <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Categorias Principais</h4>
        <div className="space-y-2">{categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 md:py-2.5 px-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <span className="font-medium text-indigo-700 dark:text-indigo-300 text-sm md:text-base">{cat}</span>
                <button onClick={() => onRemove(cat)} className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><svg className="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
        ))}</div>
    </div>
)

interface AddCategoryFormProps { value: string; onChange: (v: string) => void; onAdd: () => void }

export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ value, onChange, onAdd }) => (
    <div className="pt-4 border-t border-indigo-100 dark:border-indigo-800/30">
        <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Adicionar Nova Categoria</h4>
        <div className="flex gap-2">
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Nome da categoria" className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none" onKeyDown={e => e.key === 'Enter' && onAdd()} />
            <button onClick={onAdd} className="h-12 px-5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors">Adicionar</button>
        </div>
    </div>
)

interface SubcategorySectionProps { categories: string[]; selected: string | null; setSelected: (c: string | null) => void; subcategories: Record<string, string[]>; newName: string; setNewName: (v: string) => void; onAdd: () => void; onRemove: (cat: string, sub: string) => void }

export const SubcategorySection: React.FC<SubcategorySectionProps> = ({ categories, selected, setSelected, subcategories, newName, setNewName, onAdd, onRemove }) => (
    <div className="pt-4 border-t border-violet-100 dark:border-violet-800/30 space-y-3">
        <h4 className="text-[11px] font-bold text-violet-500 uppercase tracking-widest">Subcategorias</h4>
        <select value={selected || ''} onChange={e => setSelected(e.target.value || null)} className="w-full h-12 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none"><option value="">Selecione uma categoria</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
        {selected && (
            <>
                <div className="space-y-2 mt-4">{(subcategories[selected] || []).map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30">
                        <span className="font-medium text-violet-700 dark:text-violet-300 text-sm">{sub}</span>
                        <button onClick={() => onRemove(selected, sub)} className="w-9 h-9 flex items-center justify-center rounded-xl text-violet-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                ))}</div>
                <div className="flex gap-2 mt-3"><input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nova subcategoria" className="flex-1 h-11 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none text-sm" onKeyDown={e => e.key === 'Enter' && onAdd()} /><button onClick={onAdd} className="h-11 px-4 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-colors">Adicionar</button></div>
            </>
        )}
    </div>
)
