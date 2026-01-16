// ═══════════════════════════════════════════════════════════════════
// SUPPLIERS FILE HANDLERS
// ═══════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react'
import type { SupplierFormData, SupplierDocument } from '../types'

export interface UseFileHandlersProps {
    setFormData: React.Dispatch<React.SetStateAction<SupplierFormData>>; selectedDocCategory: string
    setUploadingFile: (v: string | null) => void; setUploadingFileType: (v: string | null) => void; setUploadProgress: (v: number) => void
    showToast: (message: string, type?: string) => void
}

export function useFileHandlers({ setFormData, selectedDocCategory, setUploadingFile, setUploadingFileType, setUploadProgress, showToast }: UseFileHandlersProps) {
    const handleFileSelect = useCallback((files: FileList) => {
        const maxSize = 5 * 1024 * 1024
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        Array.from(files).forEach((file: File) => {
            if (file.size > maxSize) { showToast(`${file.name} excede 5MB`, 'error'); return }
            if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) { showToast('Formato não suportado', 'error'); return }
            setUploadingFile(file.name); setUploadingFileType(file.type); setUploadProgress(0)
            const reader = new FileReader()
            reader.onprogress = (e: ProgressEvent<FileReader>) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }
            reader.onload = (e: ProgressEvent<FileReader>) => {
                setUploadProgress(100)
                const newDoc: SupplierDocument = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), name: file.name, type: file.type, size: file.size, dataUrl: (e.target?.result as string) || '', uploadedAt: new Date().toISOString(), category: selectedDocCategory }
                setTimeout(() => { setFormData(prev => ({ ...prev, documents: [...(prev.documents ?? []), newDoc] })); setUploadingFile(null); setUploadingFileType(null); setUploadProgress(0); showToast('Documento anexado!') }, 200)
            }
            reader.onerror = () => { setUploadingFile(null); setUploadingFileType(null); setUploadProgress(0); showToast('Erro ao ler arquivo', 'error') }
            reader.readAsDataURL(file)
        })
    }, [selectedDocCategory, setFormData, setUploadingFile, setUploadingFileType, setUploadProgress, showToast])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation() }, [])
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation() }, [])
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); const files = e.dataTransfer.files; if (files.length > 0) handleFileSelect(files) }, [handleFileSelect])
    const deleteDocument = useCallback((docId: string) => { setFormData(prev => ({ ...prev, documents: (prev.documents ?? []).filter(d => d.id !== docId) })); showToast('Documento removido') }, [setFormData, showToast])

    const downloadDocument = useCallback((doc: SupplierDocument) => {
        try {
            const dataUrl = doc.dataUrl; if (!dataUrl) { showToast('Arquivo não disponível', 'error'); return }
            const matches = dataUrl.match(/^data:(.+?);base64,(.*)$/)
            if (!matches) { const link = document.createElement('a'); link.href = dataUrl; link.download = doc.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); return }
            const mimeType = matches[1] || doc.type || 'application/octet-stream'; const base64Data = matches[2]
            if (!base64Data) { showToast('Dados do arquivo inválidos', 'error'); return }
            const binaryString = atob(base64Data); const bytes = new Uint8Array(binaryString.length); for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i) }
            const blob = new Blob([bytes], { type: mimeType }); const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement('a'); link.href = blobUrl; link.download = doc.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(() => URL.revokeObjectURL(blobUrl), 100); showToast('Arquivo baixado!')
        } catch (error) { console.error('Download error:', error); showToast('Erro ao baixar arquivo', 'error') }
    }, [showToast])

    return { handleFileSelect, handleDragOver, handleDragLeave, handleDrop, deleteDocument, downloadDocument }
}
