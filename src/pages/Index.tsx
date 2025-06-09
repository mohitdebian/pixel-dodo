import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import PromptInput from '@/components/PromptInput';
import GenerateButton from '@/components/GenerateButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from "sonner";
import { generateImage, GeneratedImage, initializeTogether } from '@/services/imageService';
import { Sparkles, Wand2, Image as ImageIcon, Stars, ZapIcon, Zap, Mail, AlertCircle, ArrowUpRight, Bot } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { hasEnoughCredits, isEmailVerified as checkEmailVerified, sendVerificationEmail, loginWithGoogle } from '@/services/auth';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load components
const ImageGrid = lazy(() => import('@/components/ImageGrid'));
const ImageSlideshow = lazy(() => import('@/components/ImageSlideshow'));
const Testimonials = lazy(() => import('@/components/Testimonials'));
const ImageCollagePlaceholder = lazy(() => import('@/components/ImageCollagePlaceholder'));

const Index: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Initialize Together client with environment variable
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    if (envApiKey) {
      initializeTogether(envApiKey);
    }
  }, []);

  // Check email verification status
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        try {
          // Force reload the user to get latest verification status
          await user.reload();
          
          // Check if email is verified after reload
          if (user.emailVerified) {
            toast.success('Email verified successfully! 🎉');
            return true;
          }
          
          // If not verified, check Firestore status
          const verified = await checkEmailVerified(user.uid);
          if (verified) {
            toast.success('Email verified successfully! 🎉');
            return true;
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      }
      return false;
    };

    let intervalId: NodeJS.Timeout;

    const startVerificationCheck = () => {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        // Initial check
        checkVerification();
        
        // Set up interval for subsequent checks
        intervalId = setInterval(async () => {
          const isVerified = await checkVerification();
          if (isVerified) {
            clearInterval(intervalId);
          }
        }, 4000); // Check every 4 seconds
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        startVerificationCheck();
      }
    });

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      unsubscribe();
    };
  }, []);

  const handleResendVerification = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setIsVerificationLoading(true);
      await sendVerificationEmail(user.uid);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // Memoize handlers
  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error('Please sign in to generate images');
      return;
    }

    if (!user.emailVerified) {
      toast.error('Please verify your email to generate images');
      return;
    }

    try {
      setIsGenerating(true);
      const image = await generateImage(prompt);
      setImages(prev => [image, ...prev]);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate img');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  const handlePurchaseCredits = useCallback(() => {
    setIsPurchaseModalOpen(true);
  }, []);

  const handleCloseCreditModal = useCallback(() => {
    setIsPurchaseModalOpen(false);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Logged in with Google successfully');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Failed to login with Google');
    }
  };

  // Memoize rendered components
  const memoizedImageGrid = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <ImageGrid images={images} />
    </Suspense>
  ), [images]);

  const memoizedTestimonials = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <Testimonials />
    </Suspense>
  ), []);

  return (
    <div className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <header className="w-full bg-gradient-to-b from-violet-900/20 to-background py-16 md:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute -left-24 top-1/3 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -right-24 top-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto relative z-10">
          {/* Email Verification Banner */}
          {auth.currentUser && !auth.currentUser.emailVerified && (
            <div className="mb-8 animate-fade-in-down mx-4 md:mx-8">
              <div className="glass-card p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-500/20">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-200 mb-1">
                        Please verify your email address
                      </h3>
                      <p className="text-yellow-100/80 text-sm">
                        We've sent a verification email to {auth.currentUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isVerificationLoading}
                    className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-lg transition-all duration-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerificationLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="small" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Resend Verification</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="inline-block mb-4 mt-5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 backdrop-blur-sm animate-fade-in-down">
            <span className="text-sm font-medium text-violet-300 flex items-center justify-center gap-2">
              <Stars className="h-4 w-4 animate-pulse" />
              AI-Powered Image Generation
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text font-display">
            Modern Pixel Magic
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-300 opacity-90 font-sans leading-relaxed font-semibold px-4 sm:px-0">
            Just write, and PixelMagic creates your image
          </p>
          
          <div className="flex flex-col gap-4 items-center mt-8 animate-fade-in-up animation-delay-500">
            <div className="relative w-full max-w-3xl px-4 md:px-8">
              <Sparkles className="absolute -top-6 -right-6 text-violet-500 animate-float w-12 h-12 opacity-70" />
              <Wand2 className="absolute -bottom-6 -left-6 text-indigo-500 animate-float animation-delay-1000 w-12 h-12 opacity-70" />
              <div className="glass-card p-1 rounded-xl border border-violet-500/20 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500 animate-glow">
                <div className="w-full mx-auto">
                  <div className="flex flex-col md:flex-row gap-4 items-center p-4 rounded-xl animate-fade-in">
                    <div className="flex-1 w-full">
                      <PromptInput 
                        onPromptChange={handlePromptChange}
                        disabled={isGenerating}
                      />
                    </div>
                    <div>
                      <GenerateButton 
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        isLoading={isGenerating}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isGenerating ? (
        <div className="flex justify-center my-10 animate-fade-in">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-muted-foreground animate-pulse font-sans">Creating your visual masterpiece...</p>
          </div>
        </div>
      ) : images.length > 0 ? (
        <div className="w-full max-w-7xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text font-display">
            Your Creations
          </h2>
          {memoizedImageGrid}
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 mb-12">
          {/* Art Gallery Placeholder */}
          <section className="mb-16">
            <div className="flex justify-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-xl rounded-full"></div>
                <div className="relative glass-card px-8 py-3 rounded-full border border-violet-500/20">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text font-display">
                    Art Gallery
                  </h2>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <div className="glass-card p-6 lg:p-8 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up hover:animate-glow">
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                  <img src="/slide5.jpg" alt="Smiling girl" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-medium mb-3 text-gray-100 font-heading">Smiling girl</h3>
                <p className="text-gray-400 font-body text-base lg:text-lg leading-relaxed">A smiling young woman standing in a bustling neon-lit Asian street at night, cinematic lighting, high detail, bokeh background, vibrant city vibe</p>
              </div>
              <div className="glass-card p-6 lg:p-8 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up hover:animate-glow">
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                  <img src="/slide4.jpg" alt="Sunset Drive" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-medium mb-3 text-gray-100 font-heading">Sunset Drive</h3>
                <p className="text-gray-400 font-body text-base lg:text-lg leading-relaxed">A sleek black sports car driving on a winding coastal road during sunset, golden hour lighting, cinematic style, hyper-realistic</p>
              </div>
            </div>
          </section>

          {/* User Testimonials */}
          <section className="mb-16 overflow-hidden">
            <div className="flex justify-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-xl rounded-full"></div>
                <div className="relative glass-card px-8 py-3 rounded-full border border-violet-500/20">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text font-display">
                    What Our Users Say
                  </h2>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Mobile view - vertical scroll */}
              <div className="md:hidden flex flex-col gap-4 px-4">
                {[
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
                ].map((testimonial, index) => (
                  <div key={index} className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up">
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

              {/* Desktop view - horizontal scroll */}
              <div className="hidden md:flex gap-6 animate-flow hover:pause-animation">
                {[
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
                ].map((testimonial, index) => (
                  <div key={index} className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up flex-shrink-0 w-[400px]">
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
                {/* Duplicate testimonials for seamless loop */}
                {[
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
                ].map((testimonial, index) => (
                  <div key={`duplicate-${index}`} className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up flex-shrink-0 w-[400px]">
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
            </div>
          </section>

          {/* Credit System Display */}
          <section className="mb-16">
            <div className="glass-card p-8 rounded-xl relative overflow-hidden">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-purple-500/10 animate-gradient"></div>
              
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text font-display">
                    Start Creating Today
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="px-4 py-2 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium">
                      ✨ 50 Free Credits
                    </div>
                    <div className="px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium">
                      🎨 10 Credits per Image
                    </div>
                  </div>
                  <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                    Join thousands of creators and transform your ideas into stunning visuals with our powerful AI models.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <div className="glass-card p-6 rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-3 text-white">Free Trial</h3>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-violet-400">✓</span>
                        50 Free Credits
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-violet-400">✓</span>
                        Try All Features Risk-Free
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-violet-400">✓</span>
                        No Credit Card Required
                      </li>
                    </ul>
                    <Button
                      onClick={handleGoogleLogin}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Sign Up Free
                    </Button>
                  </div>

                  <div className="glass-card p-6 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-3 text-white">Premium Credits</h3>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-indigo-400">✓</span>
                        Bulk Credit Discounts
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-indigo-400">✓</span>
                        Priority Generation
                      </li>
                      <li className="flex items-center gap-2 text-gray-300">
                        <span className="text-indigo-400">✓</span>
                        Exclusive New Feature Access
                      </li>
                    </ul>
                    <Button
                      onClick={handlePurchaseCredits}
                      className="w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      Purchase Credits
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Project Sale Banner */}
      <div className="w-full relative py-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-purple-500/5"></div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="glass-card p-6 rounded-2xl border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20">
                  <Zap className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
                    Project Available for Sale
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Complete AI Image Generation Platform with Modern UI</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                </div>
                <a 
                  href="mailto:devbyte.mohit@gmail.com" 
                  className="md:hidden px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30"
                >
                  <Mail className="w-4 h-4" />
                  Contact for Purchase
                </a>
                <a 
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=devbyte.mohit@gmail.com&su=I want to purchase PixelMagic&body=Hello,%0A%0AI am interested in purchasing the PixelMagic project. Please provide more information about the purchase process.%0A%0ABest regards,"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium hover:scale-105 transition-all duration-300 items-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30"
                >
                  <Mail className="w-4 h-4" />
                  Contact for Purchase
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full py-8 px-4 border-t border-gray-800 mt-auto font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 animate-fade-in">
            <h3 className="font-bold text-xl bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text hover:scale-105 transition-transform duration-300 cursor-pointer font-display">
              Modern Pixel Magic
            </h3>
          </div>
          <p className="text-sm text-gray-400 animate-fade-in animation-delay-300">
            © {new Date().getFullYear()} Modern Pixel Magic. All rights reserved.
          </p>
        </div>
      </footer>

      {auth.currentUser && (
        <CreditPurchaseModal 
          isOpen={isPurchaseModalOpen}
          onClose={handleCloseCreditModal}
          userId={auth.currentUser.uid}
        />
      )}
    </div>
  );
};

export default React.memo(Index);
