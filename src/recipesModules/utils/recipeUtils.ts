/**
 * Recipe utilities
 */

// Image compression placeholder
export const compressImage = async (file: File): Promise<File> => file

// Get category name (handles both string and object format)
export const getCategoryName = (cat: any) => {
    if (typeof cat === 'string') return cat
    return cat?.name || 'Sem categoria'
}

// Get category color
export const getCategoryColor = (categories: any[], categoryName: string) => {
    const cat = categories.find(c => getCategoryName(c) === categoryName)
    if (!cat) return '#007AFF'
    return typeof cat === 'string' ? '#007AFF' : cat.color || '#007AFF'
}
