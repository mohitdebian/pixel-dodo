import { BASE_URLS } from '@/config/urls';

const PROXY_URL = BASE_URLS.IMAGE_PROXY_URL;

/**
 * Gets a proxied URL for an image to avoid CORS issues
 * @param originalUrl - The original image URL
 * @returns The proxied URL
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  return `${PROXY_URL}/?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Downloads an image using the proxy service
 * @param imageUrl - The original image URL
 * @param filename - The name to save the file as
 * @returns Promise that resolves when the download is complete
 */
export async function downloadProxiedImage(imageUrl: string, filename: string): Promise<void> {
  if (!imageUrl) {
    throw new Error('Image URL is required');
  }

  const proxiedUrl = getProxiedImageUrl(imageUrl);
  
  try {
    const response = await fetch(proxiedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/jpeg,image/png,image/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Loads an image using the proxy service
 * @param imageUrl - The original image URL
 * @returns Promise that resolves with the loaded image
 */
export function loadProxiedImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('Image URL is required'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    
    img.src = getProxiedImageUrl(imageUrl);
  });
} 