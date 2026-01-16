import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { useModal, useToast } from './stores/useUIStore'
import { useAppStore, useRecipes as useStoreRecipes } from './stores/useAppStore'
import { NewRecipe } from './types'
import {
    RecipeCategoryModal, ImageCropperModal, ImageLightbox,
    RecipeListView, RecipeDetailView,
    useRecipesState, useRecipeHandlers,
    LoadingState, ErrorState
} from './recipesModules'

/**
 * Recipes - Ultra-Premium Editorial Design v2.0
 * Refactored: Logic extracted to custom hooks and view components
 */
export default function Recipes() {
    const { toast } = useToast()
    const { modal } = useModal()

    // Zustand Store
    const recipes = useStoreRecipes()
    const { addRecipe, updateRecipe: storeUpdateRecipe, removeRecipe } = useAppStore()

    // Custom Hooks
    const state = useRecipesState()
    const handlers = useRecipeHandlers({
        selectedId: state.selectedId, setSelectedId: state.setSelectedId,
        isEditing: state.isEditing, setIsEditing: state.setIsEditing,
        setSyncing: state.setSyncing, setSyncError: state.setSyncError,
        setIsUploading: state.setIsUploading, setImageToCrop: state.setImageToCrop,
        storeUpdateRecipe, storeRemoveRecipe: removeRecipe, recipes, toast, modal
    })

    if (state.loading) return <LoadingState />
    if (state.loadError) return <ErrorState error={state.loadError} />

    const handleAddRecipe = () => {
        const newId = String(Date.now())
        addRecipe({
            id: parseInt(newId), name: 'Nova Criação', category: 'Tradicionais',
            prepTime: 30, cookTime: 15, image: null,
            sections: [
                { id: Date.now(), type: 'ingredients', title: 'BASE', items: [] },
                { id: Date.now() + 1, type: 'instructions', title: 'PASSOS', items: [] }
            ],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        } as unknown as NewRecipe)
        state.setSelectedId(newId)
        state.setIsEditing(true)
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 relative font-sans selection:bg-indigo-500/20">
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <AnimatePresence>
                {!state.selectedId && (
                    <RecipeListView recipes={recipes} filtered={handlers.filtered} categories={state.categories}
                        activeFilter={state.activeFilter} setActiveFilter={state.setActiveFilter}
                        setSelectedId={state.setSelectedId} setIsEditing={state.setIsEditing}
                        setShowCatModal={state.setShowCatModal} onAddRecipe={handleAddRecipe}
                        onDeleteRecipe={handlers.handleDeleteRecipe} modal={modal} />
                )}
            </AnimatePresence>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {state.selectedId && handlers.selected && (
                        <RecipeDetailView selected={handlers.selected} selectedId={state.selectedId}
                            isEditing={state.isEditing} syncing={state.syncing} syncError={state.syncError}
                            isUploading={state.isUploading} categories={state.categories}
                            scrollRef={state.scrollRef} setSelectedId={state.setSelectedId}
                            setIsEditing={state.setIsEditing} setZoomedImage={state.setZoomedImage}
                            updateRecipe={handlers.updateRecipe} handleImageUpload={handlers.handleImageUpload}
                            finishEditing={handlers.finishEditing}
                            onDeleteRecipe={() => handlers.handleDeleteRecipe(state.selectedId as number)} modal={modal} />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {state.showCatModal && (
                <RecipeCategoryModal categories={state.categories} onClose={() => state.setShowCatModal(false)}
                    onUpdate={state.setCategories} onRenameCategory={(oldName, newName) => {
                        recipes.filter(r => r.category === oldName).forEach(r => handlers.updateRecipe(r.id, { category: newName }))
                    }} />
            )}

            <AnimatePresence>
                {state.zoomedImage && <ImageLightbox src={state.zoomedImage} onClose={() => state.setZoomedImage(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {state.imageToCrop && (
                    <ImageCropperModal imageSrc={state.imageToCrop} onCancel={() => state.setImageToCrop(null)}
                        onCropComplete={handlers.onCropComplete} />
                )}
            </AnimatePresence>
        </div>
    )
}
