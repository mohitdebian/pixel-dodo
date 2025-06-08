import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '@/services/imageService';
import { Download, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageGridProps {
  images: GeneratedImage[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    images.forEach(image => {
      const img = new Image();
      img.src = image.url;
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, image.url]));
      };
    });
  }, [images]);

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixelmagic-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = async (image: GeneratedImage) => {
    try {
      if (navigator.share) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], 'pixelmagic-image.png', { type: 'image/png' });
        await navigator.share({
          title: 'Check out this AI-generated image!',
          text: 'Created with PixelMagic',
          files: [file]
        });
      } else {
        await navigator.clipboard.writeText(image.url);
        toast.success('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      toast.error('Failed to share image');
    }
  };

  const handleDelete = async (image: GeneratedImage) => {
    try {
      setIsDeleting(prev => new Set([...prev, image.url]));
      // Add your delete logic here
      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.url);
        return newSet;
      });
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
            {!loadedImages.has(image.url) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-slow-spin"></div>
              </div>
            )}
            <img
              src={image.url}
              alt={image.prompt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                loadedImages.has(image.url) ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm font-medium mb-4 line-clamp-2">{image.prompt}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-violet-400 hover:bg-white/10"
                    onClick={() => handleDownload(image)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-indigo-400 hover:bg-white/10"
                    onClick={() => handleShare(image)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-red-400 hover:bg-white/10"
                    onClick={() => handleDelete(image)}
                    disabled={isDeleting.has(image.url)}
                  >
                    <Trash2 className="w-4 h-4" />
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
