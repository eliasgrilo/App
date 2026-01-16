/**
 * Recipe utilities
 */

// Category type - can be string or object with name/color
type CategoryInput = string | { name: string; color?: string }

// Image compression - handles both File and base64 string
export const compressImage = async (file: File | string): Promise<string> => {
    if (typeof file === 'string') return file
    return URL.createObjectURL(file)
}

// Get category name (handles both string and object format)
export const getCategoryName = (cat: CategoryInput): string => {
    if (typeof cat === 'string') return cat
    return cat?.name || 'Sem categoria'
}

// Get category color
export const getCategoryColor = (categories: CategoryInput[], categoryName: string): string => {
    const cat = categories.find(c => getCategoryName(c) === categoryName)
    if (!cat) return '#007AFF'
    return typeof cat === 'string' ? '#007AFF' : cat.color || '#007AFF'
}
