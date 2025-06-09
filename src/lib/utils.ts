import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Downloads an image from a URL using CORS-compatible approach
 * @param url - The URL of the image to download
 * @param filename - The name to save the file as (defaults to "download.jpg")
 * @returns Promise that resolves when the download is complete
 */
export function downloadImageCORS(url: string, filename: string = "download.jpg"): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for CORS

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob and trigger download
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob from canvas"));
          return;
        }

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        resolve();
      }, "image/jpeg", 0.95); // 0.95 quality for better image quality
    };

    img.onerror = (error) => {
      console.error("Failed to load image or CORS issue:", error);
      reject(new Error("Failed to load image or CORS issue"));
    };

    img.src = url;
  });
}
