/**
 * Compress and resize an image file using the Canvas API.
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
        // 1. Check if it's an image
        if (!file.type.match(/image.*/)) {
            return reject(new Error('File is not an image'));
        }

        // 2. Create an image element
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = (err) => reject(err);

        img.onload = () => {
            // 3. Calculate new dimensions
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

            // 4. Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            ctx.drawImage(img, 0, 0, width, height);

            // 5. Convert to Blob/File (JPEG)
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Compression failed'));

                    // Create new File with same name but likely smaller size
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // Check if compression actually increased size (rare but possible for small optimized images)
                    if (compressedFile.size > file.size) {
                        resolve(file); // Return original if smaller
                    } else {
                        resolve(compressedFile);
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = (err) => reject(err);

        // Start reading
        reader.readAsDataURL(file);
    });
}
