import React from 'react';
import { ArrowUpRight, Twitter } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonialsData = [
    {
      quote: '"Other AI image tools are extremely expensive. I can get 90% of what I need with PixelMagic at a far lower price."',
      name: 'Sarah Chen',
      handle: 'Video Editor',
      avatar: 'user.png', // Assuming avatar images are in public/avatars
    },
    {
      quote: '"For our landing page, we created hero photos using PixelMagic. We did not have to hire a designer for our startup because it looked fantastic."',
      name: 'Michael Rodriguez',
      handle: 'Solo Developer',
      avatar: 'user.png', // Assuming avatar images are in public/avatars
    },
    {
      quote: '"As a freelance video creator, PixelMagic saves me time by quickly generating images I need. Plus, it’s super affordable!"',
      name: 'Emma Thompson',
      handle: 'Freelancer',
      avatar: 'user.png', // Assuming avatar images are in public/avatars
    },
    // {
    //   quote: '"Been on Leonardo since the alpha and it\'s been amazing watching the product grow. Highly recommend for any type of artist, from beginner to advanced."',
    //   name: 'AlphaArtist',
    //   handle: '@alphaartist',
    //   avatar: '/avatars/alpha-artist.png',
    // },
    // {
    //   quote: '"The speed and quality are unmatched. My workflow has improved drastically since I started using this platform."',
    //   name: 'CreativeFlow',
    //   handle: '@creativeflow',
    //   avatar: '/avatars/creative-flow.png',
    // },
    // {
    //   quote: '"A true game-changer for digital artists. The community features are incredibly inspiring!"',
    //   name: 'DigitalDreamer',
    //   handle: '@digitaldreamer',
    //   avatar: '/avatars/digital-dreamer.png',
    // },
  ];

  return (
    <section className="w-full py-16 md:py-24 bg-background text-gray-300 relative overflow-hidden">
      {/* Subtle background elements for large screens */}
      <div className="hidden md:block absolute top-1/3 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-1000"></div>
      <div className="hidden md:block absolute bottom-1/3 left-10 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-blob animation-delay-3000"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="relative">
          {/* Testimonial Cards Container */}
          <div 
            className="flex flex-col space-y-6 pb-4 md:flex-row md:space-x-6 md:space-y-0 md:overflow-x-auto md:whitespace-nowrap md:scrollbar-hide md:justify-start"
          >
            {/* No need to duplicate testimonials if not continuous marquee effect */}
            {testimonialsData.map((testimonial, index) => (
              <div 
                key={index} 
                className="flex-none w-80 p-6 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm animate-fade-in-up flex flex-col justify-between shadow-lg overflow-hidden flex-shrink-0"
                style={{ animationDelay: `${index * 50}ms` }} // Stagger initial fade-in
              >
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-violet-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-100 font-sans">{testimonial.name}</p>
                    <p className="text-sm text-gray-400 font-sans">{testimonial.handle}</p>
                  </div>
                  <Twitter className="w-5 h-5 text-blue-400 ml-auto" />
                </div>
                <p className="text-lg italic text-gray-200 leading-relaxed font-sans mb-4 flex-grow">
                  {testimonial.quote}
                </p>
              </div>
            ))}
          </div>
          {/* Fading overlay for ghosting effect on large screens */}
          <div className="hidden md:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
          <div className="hidden md:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 