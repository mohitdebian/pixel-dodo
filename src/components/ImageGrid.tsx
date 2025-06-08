import React, { useState, useEffect, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { GeneratedImage } from '@/services/imageService';
import { Download, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AutoSizer from 'react-virtualized-auto-sizer';

interface ImageGridProps {
  images: GeneratedImage[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const COLUMN_COUNT = 3;
  const ROW_HEIGHT = 300;
  const COLUMN_WIDTH = 300;
  const GUTTER_SIZE = 16;

  useEffect(() => {
    const preloadImages = async () => {
      const newLoadedImages = new Set(loadedImages);
      for (const image of images) {
        if (!loadedImages.has(image.url)) {
          const img = new Image();
          img.src = image.url;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          newLoadedImages.add(image.url);
        }
      }
      setLoadedImages(newLoadedImages);
    };
    preloadImages();
  }, [images]);

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel-magic-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const handleShare = async (imageUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Pixel Magic Generated Image',
          text: 'Check out this AI-generated image!',
          url: imageUrl,
        });
        toast.success('Image shared successfully!');
      } else {
        await navigator.clipboard.writeText(imageUrl);
        toast.success('Image URL copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share image');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      // Add your delete logic here
      toast.success('Image deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  const Cell = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex;
    const image = images[index];
    
    if (!image) return null;

    return (
      <div style={{
        ...style,
        padding: GUTTER_SIZE,
      }}>
        <div className="relative group rounded-lg overflow-hidden bg-secondary/20 animate-fade-in">
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
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white text-sm mb-2 line-clamp-2">{image.prompt}</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => handleDownload(image.url)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => handleShare(image.url)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => handleDelete(image.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [images, loadedImages, isDeleting]);

  return (
    <div className="w-full h-full">
      <AutoSizer>
        {({ height, width }) => (
          <Grid
            columnCount={COLUMN_COUNT}
            columnWidth={COLUMN_WIDTH}
            height={height}
            rowCount={Math.ceil(images.length / COLUMN_COUNT)}
            rowHeight={ROW_HEIGHT}
            width={width}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
};

export default React.memo(ImageGrid);
