/**
 * Image Compression Utility - Premium Quality
 * Optimizes images for Firebase storage with error handling
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const COMPRESSION_TIMEOUT = 15000; // 15 second timeout

export const compressImage = (base64Str, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!base64Str || typeof base64Str !== 'string') {
            reject(new Error('Invalid image data provided'));
            return;
        }

        // Check approximate size (base64 is ~33% larger than binary)
        const approxSize = (base64Str.length * 3) / 4;
        if (approxSize > MAX_FILE_SIZE) {
            reject(new Error('Imagem muito grande. Use uma foto menor que 10MB.'));
            return;
        }

        // Timeout protection
        const timeoutId = setTimeout(() => {
            reject(new Error('Tempo esgotado ao processar imagem. Tente novamente.'));
        }, COMPRESSION_TIMEOUT);

        const img = new Image();
        
        img.onload = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if needed
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Falha ao criar contexto de imagem.'));
                    return;
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                const result = canvas.toDataURL('image/jpeg', quality);
                
                // Validate output
                if (!result || result === 'data:,') {
                    reject(new Error('Falha ao comprimir imagem.'));
                    return;
                }
                
                resolve(result);
            } catch (err) {
                reject(new Error('Erro ao processar imagem: ' + err.message));
            }
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Falha ao carregar imagem. Verifique se o arquivo é válido.'));
        };

        img.src = base64Str;
    });
};
