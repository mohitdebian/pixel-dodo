import React from 'react';

const ImageCollagePlaceholder: React.FC = () => {
  const collageImages = [
    { src: '/placeholder-images/img1.jpg', alt: 'Abstract image 1' },
    { src: '/placeholder-images/img2.jpg', alt: 'Abstract image 2' },
    { src: '/placeholder-images/img3.jpg', alt: 'Abstract image 3' },
    { src: '/placeholder-images/img4.jpg', alt: 'Abstract image 4' },
    { src: '/placeholder-images/img5.jpg', alt: 'Abstract image 5' },
    { src: '/placeholder-images/img6.jpg', alt: 'Abstract image 6' },
    { src: '/placeholder-images/img7.jpg', alt: 'Abstract image 7' },
    { src: '/placeholder-images/img8.jpg', alt: 'Abstract image 8' },
  ];

  return (
    <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full p-4 md:p-8 animate-fade-in-up">
      {collageImages.map((image, index) => (
        <div key={index} className="relative overflow-hidden rounded-lg aspect-square group">
          <img 
            src={image.src} 
            alt={image.alt} 
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {image.alt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageCollagePlaceholder; 