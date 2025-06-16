import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AiModel {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

const AI_MODELS: AiModel[] = [
  {
    id: '1',
    imageUrl: 'Anime_1.jpg', // Replace with actual image path
    title: 'Leonardo Anime XL',
    description: 'A new high-speed Anime-focused model that excels at a range of anime, illustrative, and CG styles.',
  },
  {
    id: '2',
    imageUrl: 'Anime_1.jpg', // Replace with actual image path
    title: 'Leonardo Lightning XL',
    description: 'Our new high-speed generalist image gen model. Great at everything from photorealism to painterly styles.',
  },
  {
    id: '3',
    imageUrl: 'Anime_1.jpg', // Replace with actual image path
    title: 'Leonardo Kino XL',
    description: 'A model with a strong focus on cinematic outputs. Excels at wider aspect ratios, and does not need a negative prompt.',
  },
  {
    id: '4',
    imageUrl: 'Anime_1.jpg', // Replace with actual image path
    title: 'Leonardo Diffusion XL',
    description: 'The next phase of the core Leonardo model. Stunning outputs, even with short prompts.',
  },
];

const AiModelShowcase: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-background via-background/95 to-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-200 tracking-tight font-heading">
            Fine-tuned Models
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-scroll space-x-6 pb-4 scrollbar-hide"
        >
          {AI_MODELS.map((model) => (
            <div 
              key={model.id} 
              className="flex-none w-72 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 flex flex-col border border-white/10"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img 
                  src={model.imageUrl} 
                  alt={model.title} 
                  className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
                />
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-lg font-medium text-gray-100 mb-2 font-heading tracking-tight">{model.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-body">{model.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AiModelShowcase; 