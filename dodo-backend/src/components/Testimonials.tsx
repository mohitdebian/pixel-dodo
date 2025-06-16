import React, { useRef, useEffect } from 'react';
import { ArrowUpRight, Twitter } from 'lucide-react';

const Testimonials: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrame: number;
    let lastScrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      if (!container) return;
      
      lastScrollPosition += scrollSpeed;
      if (lastScrollPosition >= container.scrollWidth / 2) {
        lastScrollPosition = 0;
      }
      
      container.scrollLeft = lastScrollPosition;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Video Editor",
      content: "Other AI image tools are extremely expensive. I can get 90% of what I need with PixelMagic at a far lower price.",
      avatar: "👩‍🎨"
    },
    {
      name: "Michael Rodriguez",
      role: "Solo Developer",
      content: "For our landing page, we created hero photos using PixelMagic. We didn't have to hire a designer for our startup because it looked fantastic.",
      avatar: "👨‍💼"
    },
    {
      name: "Emma Thompson",
      role: "Freelancer",
      content: "As a freelance video creator, PixelMagic saves me time by quickly generating images I need. Plus, it's super affordable!",
      avatar: "👩‍💻"
    }
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
            ref={containerRef}
            className="flex gap-6 animate-flow hover:pause-animation"
            style={{ willChange: 'transform' }}
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up flex-shrink-0 w-[400px]"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  willChange: 'transform, opacity'
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-100">{testimonial.name}</h3>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 font-body">{testimonial.content}</p>
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

export default React.memo(Testimonials); 