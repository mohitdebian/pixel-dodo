import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '@/services/imageService';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getProxiedImageUrl, downloadProxiedImage } from '@/services/imageProxyService';

interface ImageGridProps {
  images: GeneratedImage[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => {}; // Cleanup if needed, but no active observation for this purpose
  }, []);

  const handleDownload = async (image: GeneratedImage) => {
    if (!image.url) {
      toast.error('Invalid image URL');
      return;
    }

    try {
      toast.loading('Downloading image...', { id: 'download' });
      await downloadProxiedImage(image.url, `pixelmagic-${Date.now()}.jpg`);
      toast.success('Image downloaded successfully!', { id: 'download' });
    } catch (error: any) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image', { id: 'download' });
    }
  };

  const handleRetryLoad = (imageUrl: string) => {
    // Clear both loaded and failed states to force a re-render and re-attempt native loading
    setLoadedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    // The browser's native img tag will re-attempt loading automatically
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image, index) => (
        <div
          key={image.url}
          className="glass-card rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="aspect-square relative bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
            {/* Show spinner if not loaded and not failed */}
            {!loadedImages.has(image.url) && !failedImages.has(image.url) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-slow-spin"></div>
              </div>
            )}
            
            <img
              src={image.url ? getProxiedImageUrl(image.url) : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
              alt={image.prompt || 'Generated image'}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                loadedImages.has(image.url) ? 'opacity-100' : 'opacity-0'
              }`}
              crossOrigin="anonymous"
              onLoad={() => {
                // Mark as loaded upon native img load success
                setLoadedImages((prev) => new Set([...prev, image.url]));
                // Remove from failed if it was there
                setFailedImages((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(image.url);
                  return newSet;
                });
              }}
              onError={() => {
                // Mark as failed upon native img load error
                setFailedImages((prev) => new Set([...prev, image.url]));
                // Ensure it's not marked as loaded if it failed
                setLoadedImages((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(image.url);
                  return newSet;
                });
              }}
            />

            {/* Failed image overlay */}
            {failedImages.has(image.url) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 p-4 text-center z-10">
                <p className="text-red-500 text-sm mb-2">Failed to load image</p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/20"
                    onClick={() => image.url && handleRetryLoad(image.url)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/20"
                    onClick={() => window.open(getProxiedImageUrl(image.url), '_blank')}
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm font-medium mb-4 line-clamp-2">
                  {image.prompt || 'No prompt provided'}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-violet-400 hover:bg-white/10"
                    onClick={() => handleDownload(image)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(ImageGrid);
