import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FeaturedModelShowcase: React.FC = () => {
  // Data for the featured model (based on the image)
  const featuredModel = {
    id: 'leonardo-anime-xl',
    imageUrl: 'Anime_1.jpg', // Assuming image is in public/models
    title: 'Leonardo Anime XL',
    description: 'A new high-speed Anime-focused model that excels at a range of anime, illustrative, and CG styles.',
  };

  // Placeholder functions for navigation (if this section were interactive)
  const handlePrev = () => { console.log('Previous model'); };
  const handleNext = () => { console.log('Next model'); };

  return (
    <section className="w-full py-16 md:py-24 bg-background text-gray-300 text-center relative overflow-hidden">
      {/* Subtle background elements for large screens */}
      <div className="hidden md:block absolute top-1/4 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
      <div className="hidden md:block absolute bottom-1/4 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

      <div className="max-w-4xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 relative z-10">
        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-bold mb-12 leading-tight font-display">
          <span className="text-white">Unveil New Creative</span> <br className="block sm:hidden" /> Horizons with <span className="bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text">Fine-tuned</span> <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text">Models</span>
        </h2>

        {/* Featured Model Card */}
        <div className="glass-card p-4 md:p-6 rounded-xl max-w-2xl mx-auto animate-fade-in-up">
          <div className="rounded-lg overflow-hidden mb-6">
            <img 
              src={featuredModel.imageUrl} 
              alt={featuredModel.title} 
              className="w-full h-auto object-cover"
            />
          </div>
          <h3 className="text-xl md:text-2xl font-medium text-gray-100 mb-2 font-heading tracking-tight">
            {featuredModel.title}
          </h3>
          <p className="text-gray-400 font-body leading-relaxed mb-6">
            {featuredModel.description}
          </p>

          {/* Navigation Buttons */}
          <div className="flex justify-center space-x-6">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Previous model"
            >
              <ChevronLeft className="w-6 h-6 text-gray-400" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label="Next model"
            >
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedModelShowcase; 