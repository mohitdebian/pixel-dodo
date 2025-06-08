import React from 'react';
import { GeneratedImage } from '@/services/imageService';

interface ImageGridProps {
  images: GeneratedImage[];
}

const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {images.map((image) => (
        <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
          <img
            src={image.url}
            alt={image.prompt}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            width={512}
            height={512}
            decoding="async"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
