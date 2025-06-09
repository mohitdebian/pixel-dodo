import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '@/services/imageService';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getProxiedImageUrl, downloadProxiedImage, loadProxiedImage } from '@/services/imageProxyService';

interface ImageGridProps {
  images: GeneratedImage[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    images.forEach((image) => {
      if (!image.url) return;
      
      loadProxiedImage(image.url)
        .then(() => {
          setLoadedImages((prev) => new Set([...prev, image.url]));
        })
        .catch((error) => {
          console.error('Error loading image:', error);
          setFailedImages((prev) => new Set([...prev, image.url]));
          toast.error('Failed to load image');
        });
    });
  }, [images]);

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image, index) => (
        <div
          key={image.url}
          className="glass-card rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="aspect-square relative bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
            {!loadedImages.has(image.url) && !failedImages.has(image.url) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-slow-spin"></div>
              </div>
            )}
            {failedImages.has(image.url) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
                <p className="text-red-500 text-sm">Failed to load image</p>
              </div>
            ) : (
              <img
                src={getProxiedImageUrl(image.url)}
                alt={image.prompt || 'Generated image'}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  loadedImages.has(image.url) ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
                onError={() => setFailedImages((prev) => new Set([...prev, image.url]))}
              />
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
