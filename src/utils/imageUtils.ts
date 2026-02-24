/**
 * Check if a file is an image by MIME type OR by extension.
 * Handles edge cases like HEIC files from iPhones that may have empty MIME types.
 */
export function isImageFile(file: File): boolean {
    // Check MIME type first
    if (file.type && file.type.startsWith('image/')) return true;

    // Fallback: check extension (handles HEIC, HEIF, etc. with missing MIME)
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
        'heic', 'heif', 'avif', 'tiff', 'tif', 'ico'
    ];
    return imageExtensions.includes(ext);
}

/**
 * Compress and resize an image file using the Canvas API.
 * Accepts all image formats the browser can render (JPEG, PNG, WebP, BMP, GIF, AVIF, etc.)
 * HEIC/HEIF may not be supported on all browsers — the function will return the original file if it can't render.
 * 
 * @param file - The original File object from <input type="file">
 * @param maxWidth - Maximum width (default: 1200px)
 * @param maxHeight - Maximum height (default: 1200px)
 * @param quality - JPEG quality (0.0 to 1.0, default: 0.7)
 * @returns Promise<File> - The compressed File object
 */
export async function compressImage(
    file: File,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7
): Promise<File> {
    return new Promise((resolve, reject) => {
        // Accept any file that looks like an image (by MIME or extension)
        if (!isImageFile(file)) {
            return reject(new Error('Il file non è un\'immagine supportata'));
        }

        // Create an image element
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = (err) => reject(err);

        img.onload = () => {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG Blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Compressione fallita'));

                    // Create new File with .jpg extension
                    const newName = file.name.replace(/\.[^.]+$/, '.jpg');
                    const compressedFile = new File([blob], newName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // Return original if compression made it bigger
                    if (compressedFile.size > file.size) {
                        resolve(file);
                    } else {
                        resolve(compressedFile);
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => {
            // Browser can't render this format (e.g. HEIC on Chrome) — return original
            console.warn(`[ImageUtils] Browser cannot render ${file.name}, returning original`);
            resolve(file);
        };

        // Start reading
        reader.readAsDataURL(file);
    });
}
