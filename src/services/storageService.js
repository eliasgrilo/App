/**
 * Firebase Storage Service
 * Apple-quality file upload with progress tracking, compression, and URL generation
 */

import { initializeApp, getApp } from 'firebase/app'
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'firebase/storage'

// Get storage instance
let storage
try {
    storage = getStorage(getApp())
} catch {
    // Firebase not initialized yet
    storage = null
}

// File type mappings
const FILE_TYPES = {
    'image/jpeg': 'IMAGE',
    'image/png': 'IMAGE',
    'image/gif': 'IMAGE',
    'image/webp': 'IMAGE',
    'application/pdf': 'PDF',
    'application/msword': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENT',
    'application/vnd.ms-excel': 'DOCUMENT',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'DOCUMENT',
    'text/plain': 'DOCUMENT',
    'text/csv': 'DOCUMENT'
}

// Max file sizes (in bytes)
const MAX_SIZES = {
    IMAGE: 10 * 1024 * 1024, // 10MB
    PDF: 25 * 1024 * 1024, // 25MB
    DOCUMENT: 15 * 1024 * 1024, // 15MB
    OTHER: 50 * 1024 * 1024 // 50MB
}

/**
 * Compress image before upload
 * @param {File} file - Original file
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Compressed blob
 */
async function compressImage(file, maxWidth = 1920, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
            img.src = e.target.result
        }

        img.onload = () => {
            const canvas = document.createElement('canvas')
            let { width, height } = img

            // Scale down if needed
            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to compress image'))
                    }
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = reject
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Generate thumbnail for image
 * @param {File} file - Original file
 * @param {number} maxSize - Maximum dimension
 * @returns {Promise<Blob>} - Thumbnail blob
 */
async function generateThumbnail(file, maxSize = 200) {
    return compressImage(file, maxSize, 0.7)
}

/**
 * Get file type category
 * @param {string} mimeType - MIME type
 * @returns {string} - File type category
 */
function getFileType(mimeType) {
    return FILE_TYPES[mimeType] || 'OTHER'
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFile(file) {
    const fileType = getFileType(file.type)
    const maxSize = MAX_SIZES[fileType]

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
        }
    }

    return { valid: true }
}

/**
 * Generate unique storage path
 * @param {string} entityType - Entity type (products, recipes, etc)
 * @param {string} entityId - Entity ID
 * @param {string} fileName - Original file name
 * @returns {string} - Storage path
 */
function generateStoragePath(entityType, entityId, fileName) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `${entityType}/${entityId}/${timestamp}_${random}_${sanitizedName}`
}

/**
 * Upload file to Firebase Storage
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {string} options.entityType - Entity type (products, recipes, costs, etc)
 * @param {string} options.entityId - Entity ID
 * @param {boolean} options.compress - Compress images
 * @param {boolean} options.generateThumb - Generate thumbnail for images
 * @param {function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Upload result with URLs
 */
export async function uploadFile(file, options = {}) {
    const {
        entityType = 'files',
        entityId = 'general',
        compress = true,
        generateThumb = true,
        onProgress = () => { }
    } = options

    // Ensure storage is initialized
    if (!storage) {
        storage = getStorage(getApp())
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
        throw new Error(validation.error)
    }

    const fileType = getFileType(file.type)
    const storagePath = generateStoragePath(entityType, entityId, file.name)

    // Compress image if needed
    let uploadData = file
    if (fileType === 'IMAGE' && compress) {
        try {
            uploadData = await compressImage(file)
        } catch (e) {
            console.warn('Image compression failed, uploading original:', e)
            uploadData = file
        }
    }

    // Create storage reference
    const storageRef = ref(storage, storagePath)

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, uploadData, {
        contentType: file.type,
        customMetadata: {
            originalName: file.name,
            entityType,
            entityId,
            uploadedAt: new Date().toISOString()
        }
    })

    // Return promise with progress updates
    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                )
                onProgress(progress)
            },
            (error) => {
                console.error('Upload error:', error)
                reject(new Error(getUploadErrorMessage(error.code)))
            },
            async () => {
                try {
                    // Get download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

                    // Generate and upload thumbnail for images
                    let thumbnailUrl = null
                    if (fileType === 'IMAGE' && generateThumb) {
                        try {
                            const thumbnail = await generateThumbnail(file)
                            const thumbPath = storagePath.replace(/(\.[^.]+)$/, '_thumb$1')
                            const thumbRef = ref(storage, thumbPath)
                            await uploadBytesResumable(thumbRef, thumbnail, {
                                contentType: 'image/jpeg'
                            })
                            thumbnailUrl = await getDownloadURL(thumbRef)
                        } catch (e) {
                            console.warn('Thumbnail generation failed:', e)
                        }
                    }

                    resolve({
                        id: storageRef.fullPath.replace(/\//g, '_'),
                        name: file.name,
                        type: fileType,
                        mimeType: file.type,
                        size: uploadData.size || file.size,
                        storageUrl: downloadURL,
                        storagePath,
                        thumbnailUrl,
                        entityType,
                        entityId,
                        createdAt: new Date().toISOString()
                    })
                } catch (error) {
                    reject(error)
                }
            }
        )
    })
}

/**
 * Upload multiple files
 * @param {File[]} files - Array of files
 * @param {Object} options - Upload options
 * @param {function} options.onTotalProgress - Total progress callback
 * @returns {Promise<Object[]>} - Array of upload results
 */
export async function uploadMultipleFiles(files, options = {}) {
    const { onTotalProgress = () => { }, ...uploadOptions } = options
    const results = []
    const progressMap = new Map()

    const updateTotalProgress = () => {
        const total = files.length * 100
        const current = Array.from(progressMap.values()).reduce((sum, p) => sum + p, 0)
        onTotalProgress(Math.round((current / total) * 100))
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        progressMap.set(i, 0)

        try {
            const result = await uploadFile(file, {
                ...uploadOptions,
                onProgress: (progress) => {
                    progressMap.set(i, progress)
                    updateTotalProgress()
                }
            })
            results.push(result)
        } catch (error) {
            results.push({
                name: file.name,
                error: error.message
            })
        }
    }

    return results
}

/**
 * Delete file from Storage
 * @param {string} storagePath - Path from upload result
 * @returns {Promise<void>}
 */
export async function deleteFile(storagePath) {
    if (!storage) {
        storage = getStorage(getApp())
    }

    const fileRef = ref(storage, storagePath)

    try {
        await deleteObject(fileRef)

        // Try to delete thumbnail too
        const thumbPath = storagePath.replace(/(\.[^.]+)$/, '_thumb$1')
        const thumbRef = ref(storage, thumbPath)
        try {
            await deleteObject(thumbRef)
        } catch {
            // Thumbnail might not exist
        }
    } catch (error) {
        console.error('Delete error:', error)
        throw new Error(getDeleteErrorMessage(error.code))
    }
}

/**
 * Delete all files for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {Promise<number>} - Number of deleted files
 */
export async function deleteEntityFiles(entityType, entityId) {
    if (!storage) {
        storage = getStorage(getApp())
    }

    const folderRef = ref(storage, `${entityType}/${entityId}`)

    try {
        const result = await listAll(folderRef)
        let deleted = 0

        for (const item of result.items) {
            await deleteObject(item)
            deleted++
        }

        return deleted
    } catch (error) {
        console.error('Delete entity files error:', error)
        return 0
    }
}

/**
 * List files for an entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object[]>} - Array of file metadata
 */
export async function listEntityFiles(entityType, entityId) {
    if (!storage) {
        storage = getStorage(getApp())
    }

    const folderRef = ref(storage, `${entityType}/${entityId}`)

    try {
        const result = await listAll(folderRef)
        const files = []

        for (const item of result.items) {
            // Skip thumbnails
            if (item.name.includes('_thumb')) continue

            try {
                const metadata = await getMetadata(item)
                const url = await getDownloadURL(item)

                files.push({
                    name: metadata.customMetadata?.originalName || item.name,
                    mimeType: metadata.contentType,
                    size: metadata.size,
                    storageUrl: url,
                    storagePath: item.fullPath,
                    createdAt: metadata.timeCreated
                })
            } catch {
                // Skip files with errors
            }
        }

        return files
    } catch (error) {
        console.error('List files error:', error)
        return []
    }
}

/**
 * Get user-friendly upload error message
 */
function getUploadErrorMessage(code) {
    const messages = {
        'storage/unauthorized': 'Sem permissão para fazer upload',
        'storage/canceled': 'Upload cancelado',
        'storage/quota-exceeded': 'Limite de armazenamento excedido',
        'storage/retry-limit-exceeded': 'Limite de tentativas excedido. Tente novamente.',
        'storage/invalid-checksum': 'Arquivo corrompido. Tente novamente.',
        'storage/server-file-wrong-size': 'Erro no servidor. Tente novamente.'
    }
    return messages[code] || 'Erro ao fazer upload do arquivo'
}

/**
 * Get user-friendly delete error message
 */
function getDeleteErrorMessage(code) {
    const messages = {
        'storage/object-not-found': 'Arquivo não encontrado',
        'storage/unauthorized': 'Sem permissão para excluir'
    }
    return messages[code] || 'Erro ao excluir arquivo'
}

// Storage Service object
export const StorageService = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    deleteEntityFiles,
    listEntityFiles,
    validateFile,
    getFileType,
    compressImage,
    generateThumbnail
}

export default StorageService
