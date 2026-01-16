/**
 * ImageCropperModal — Director-class image cropper
 */

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Cropper, { Area } from 'react-easy-crop'
import getCroppedImg from '../../utils/cropUtils'
import { useScrollLock } from '../../hooks/useScrollLock'

interface ImageCropperModalProps {
    imageSrc: string
    onCancel: () => void
    onCropComplete: (croppedImage: string) => void
}

type IconProps = React.SVGProps<SVGSVGElement>

export const ImageCropperModal = ({ imageSrc, onCancel, onCropComplete }: ImageCropperModalProps): React.ReactElement => {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isInteracting, setIsInteracting] = useState(false)

    useScrollLock(true)

    const onCropCompleteInternal = (_croppedArea: Area, croppedAreaPixels: Area): void => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels!)
            onCropComplete(croppedImage!)
        } catch (e) {
            console.error(e)
        }
    }

    const Icons = {
        Camera: (props: IconProps) => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        Plus: (props: IconProps) => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] bg-black flex flex-col"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-[20001] px-6 py-12 flex justify-between items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                <button onClick={onCancel} className="pointer-events-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 text-white text-sm font-semibold transition-all active:scale-95">
                    Cancelar
                </button>
                <h3 className="text-white text-sm font-bold uppercase tracking-widest opacity-80 mt-1">Redimensionar</h3>
                <button onClick={handleSave} className="pointer-events-auto px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold transition-all hover:bg-zinc-100 active:scale-95 shadow-[0_4px_24px_rgba(255,255,255,0.2)]">
                    OK
                </button>
            </div>

            {/* Cropper */}
            <div className="relative flex-1 bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 5}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropCompleteInternal}
                    showGrid={isInteracting}
                    onInteractionStart={() => setIsInteracting(true)}
                    onInteractionEnd={() => setIsInteracting(false)}
                    classes={{
                        containerClassName: 'bg-black',
                        mediaClassName: 'object-contain',
                        cropAreaClassName: 'border border-white/40 shadow-[0_0_0_1000px_rgba(0,0,0,0.7)]'
                    }}
                />
            </div>

            {/* Footer with Zoom */}
            <div className="absolute bottom-0 left-0 right-0 z-[20001] px-8 py-16 flex flex-col items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                <div className="w-full max-w-xs flex items-center gap-6 pointer-events-auto">
                    <button onClick={() => setZoom(Math.max(1, zoom - 0.1))} className="p-1 text-white/50 hover:text-white transition-colors">
                        <Icons.Camera />
                    </button>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.01}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(parseFloat(e.target.value))}
                        className="range-slider accent-white"
                    />
                    <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-1 text-white/50 hover:text-white transition-colors">
                        <Icons.Plus />
                    </button>
                </div>
                <div className="mt-8 flex gap-1 items-center opacity-30 select-none">
                    {[1, 1.5, 2, 2.5, 3].map(val => (
                        <div key={val} className={`w-1 h-3 rounded-full transition-all duration-300 ${zoom >= val ? 'bg-white h-5 opacity-100' : 'bg-white/40'}`} />
                    ))}
                </div>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full z-[20002]" />
        </motion.div>,
        document.body
    )
}

export default ImageCropperModal
