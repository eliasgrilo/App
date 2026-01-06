/**
 * recipesModules barrel exports
 */

// Components - Existing
export { RecipeCategoryModal } from './components/RecipeCategoryModal'
export { ImageCropperModal } from './components/ImageCropperModal'
export { ImageLightbox } from './components/ImageLightbox'
export { IngredientItem } from './components/IngredientItem'
export { InstructionItem } from './components/InstructionItem'
export { Icons } from './components/RecipeIcons'
export { SectionWrapper } from './components/SectionWrapper'

// Components - New (extracted from Recipes.tsx)
export { RecipeListView } from './components/RecipeListView'
export { RecipeDetailView } from './components/RecipeDetailView'
export { IngredientsTable } from './components/IngredientsTable'
export { InstructionsTable } from './components/InstructionsTable'
export { RecipeSection } from './components/RecipeSection'
export { LoadingState, ErrorState } from './components/StateComponents'

// Hooks
export { useRecipesState } from './hooks/useRecipesState'
export { useRecipeHandlers } from './hooks/useRecipeHandlers'
export type { RecipesStateReturn } from './hooks/useRecipesState'
export type { RecipeHandlersReturn, Recipe } from './hooks/useRecipeHandlers'

// Utils
export { getCategoryName, getCategoryColor, compressImage } from './utils/recipeUtils'
