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
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageSlideshow from '@/components/ImageSlideshow';

// Lazy load components
const ImageGrid = lazy(() => import('@/components/ImageGrid'));
const Testimonials = lazy(() => import('@/components/Testimonials'));
const ImageCollagePlaceholder = lazy(() => import('@/components/ImageCollagePlaceholder'));

const Index: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  const tutorialSteps = [
    {
      icon: <Stars className="h-8 w-8 text-violet-400 animate-pulse" />,
      title: 'Welcome to Pixel Magic!',
      description: 'Generate AI images in seconds. Let us show you how to get started.'
    },
    {
      icon: <Sparkles className="h-8 w-8 text-indigo-400 animate-bounce" />,
      title: 'Step 1: Sign In',
      description: 'Sign in with Google to start generating images and track your credits.'
    },
    {
      icon: <Wand2 className="h-8 w-8 text-purple-400 animate-spin-slow" />,
      title: 'Step 2: Enter a Prompt',
      description: 'Describe what you want to see. The AI will create an image based on your prompt.'
    },
    {
      icon: <ImageIcon className="h-8 w-8 text-pink-400 animate-fade-in" />,
      title: 'Step 3: Generate & Download',
      description: 'Click generate, then download or share your masterpiece!'
    },
    {
      icon: <Zap className="h-8 w-8 text-green-400 animate-pulse" />,
      title: 'Start Creating Now!',
      description: 'Get started with your free credits and join our growing community of creators.'
    }
  ];

  // Check email verification status when user is logged in
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const verified = await checkEmailVerified(user.uid);
          setIsEmailVerified(verified);
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      } else {
        setIsEmailVerified(null);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkVerification();
      } else {
        setIsEmailVerified(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Together client with environment variable or user input
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    
    // If environment variable exists, use it directly
    if (envApiKey) {
      try {
        initializeTogether(envApiKey);
        setApiKey(envApiKey);
        setIsApiKeySet(true);
        console.log("Using API key from environment variable");
      } catch (error) {
        console.error("Error initializing Together client:", error);
        toast.error("Invalid API key in environment variable");
      }
    }
    // Otherwise use provided API key from input
    else if (apiKey) {
      try {
        initializeTogether(apiKey);
        setIsApiKeySet(true);
      } catch (error) {
        console.error("Error initializing Together client:", error);
        toast.error("Invalid API key format");
        setIsApiKeySet(false);
      }
    }
  }, [apiKey]);

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const handleResendVerification = async () => {
    try {
      setIsVerificationLoading(true);
      const user = auth.currentUser;
      if (user) {
        await sendVerificationEmail(user);
      } else {
        toast.error('Please log in to resend verification email');
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const handleGenerate = React.useCallback(async () => {
    // Prevent multiple clicks
    if (isGenerating) return;
    
    // Validation checks
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first', {
        duration: 3000,
        className: "font-medium border border-red-200",
        icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
      });
      return;
    }

    if (!isApiKeySet) {
      toast.error('Please enter your Together AI API key first or set VITE_TOGETHER_API_KEY environment variable', {
        duration: 4000,
        className: "font-medium border border-red-200",
        icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
      });
      return;
    }

    // Start loading state immediately for better user feedback
    setIsGenerating(true);

    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please log in to generate images', {
        duration: 3000,
        className: "font-medium border border-red-200",
        icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
      });
      setIsGenerating(false);
      return;
    }

    // Run checks in parallel for better performance
    try {
      // Start both checks at the same time
      const [verified, hasCredits] = await Promise.all([
        checkEmailVerified(user.uid),
        hasEnoughCredits(user.uid)
      ]);
      
      // Update verification state
      setIsEmailVerified(verified);
      
      // Handle verification error
      if (!verified) {
        toast.error('Please verify your email before generating images', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Mail className="h-5 w-5 text-red-400 animate-pulse" />,
        });
        setIsGenerating(false);
        return;
      }
      
      // Handle insufficient credits
      if (!hasCredits) {
        toast.error('Insufficient credits. Please purchase more to continue.', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
        });
        setIsPurchaseModalOpen(true);
        setIsGenerating(false);
        return;
      }
      
      // All checks passed, generate the image
      const newImage = await generateImage(prompt);
      
      // Update UI with new image
      setImages(prevImages => [newImage, ...prevImages]);
      
      toast.success('Image generated successfully!', {
        duration: 3000,
        className: "font-medium border border-green-200",
        icon: <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />,
      });
      
    } catch (error) {
      // Handle errors
      console.error('Error generating image:', error);
      
      // Don't show duplicate error toasts
      if (error instanceof Error && 
         !error.message.includes('Insufficient credits') && 
         !error.message.includes('Email not verified')) {
        toast.error('Failed to generate image. Please check your API key and try again.', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Zap className="h-5 w-5 text-red-400 animate-pulse" />,
        });
      }
    } finally {
      // Always reset loading state
      setIsGenerating(false);
    }
  }, [
    prompt, 
    isApiKeySet, 
    isGenerating, 
    setIsEmailVerified, 
    setIsPurchaseModalOpen
  ]);

  const handleNextTutorial = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  // Inside the return statement, after the API key input / prompt input section
  // Check if user is logged in but email is not verified
  const renderVerificationBanner = () => {
    const user = auth.currentUser;
    
    if (user && isEmailVerified === false) {
      return (
        <div className="w-full max-w-3xl mx-auto px-4 py-3 mb-6 glass-card rounded-lg border border-yellow-500/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-white">
                Please verify your email address to generate images. Check your inbox for a verification link.
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={handleResendVerification}
              disabled={isVerificationLoading}
              className="flex-shrink-0"
            >
              {isVerificationLoading ? 'Sending...' : 'Resend Email'}
            </Button>
          </div>
        </div>
      );
    }
    
    return null;
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
    <>
      {/* Main Home Screen Content */}
      <div className="min-h-screen flex flex-col items-center">
        <header className="w-full bg-gradient-to-b from-violet-900/20 to-background py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute -left-24 top-1/3 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-24 top-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
          
          <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto relative z-10 px-4">
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

            {/* Navigation Toggler */}
            <div className="flex justify-center mb-4 px-8">
              <div className="relative inline-flex items-center p-1 rounded-full bg-violet-900/40 border border-violet-500/30 backdrop-blur-md shadow-lg">
                {/* Sliding background */}
                <div 
                  className="absolute inset-0 transition-all duration-300 ease-in-out rounded-full"
                  style={{
                    transform: location.pathname === '/stylemorph' ? 'translateX(100%)' : 'translateX(0%)',
                    width: '50%',
                    background: 'linear-gradient(to right, var(--tw-gradient-stops)) var(--pixel-magic-gradient-from) var(--pixel-magic-gradient-to)',
                    '--pixel-magic-gradient-from': '#8B5CF6',
                    '--pixel-magic-gradient-to': '#A78BFA',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
                  } as React.CSSProperties}
                ></div>
                
                <Link
                  to="/"
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5
                    ${location.pathname === '/' 
                      ? 'text-white font-semibold scale-105' 
                      : 'text-violet-300 hover:text-white/80'}`}
                >
                  <ImageIcon className={`w-3.5 h-3.5 ${location.pathname === '/' ? 'text-white' : 'text-violet-300'}`} />
                  Generate
                  {location.pathname === '/' && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  )}
                </Link>
                
                <Link
                  to="/stylemorph"
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5
                    ${location.pathname === '/stylemorph' 
                      ? 'text-white font-semibold scale-105' 
                      : 'text-violet-300 hover:text-white/80'}`}
                >
                  <Wand2 className={`w-3.5 h-3.5 ${location.pathname === '/stylemorph' ? 'text-white' : 'text-violet-300'}`} />
                  StyleMorph
                  <span className="px-1 py-0.5 text-[9px] bg-blue-500/20 text-blue-400 rounded-full">
                    New
                  </span>
                  {location.pathname === '/stylemorph' && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  )}
                </Link>
              </div>
            </div>

            <div className="inline-block mb-6 mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 backdrop-blur-sm animate-fade-in-down">
              <span className="text-sm font-medium text-violet-300 flex items-center justify-center gap-2">
                <Stars className="h-4 w-4 animate-pulse" />
                AI-Powered Image Generation
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-2 mt-4 animate-fade-in-up bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text font-display">
              Modern Pixel Magic
            </h1>
            <p className="text-xl md:text-2xl mb-4 mt-2 text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-300 opacity-90 font-sans leading-relaxed font-semibold px-4 sm:px-0">
              Just write, and PixelMagic creates your image
            </p>
            
            {/* Image Generation Section */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
              <div className="flex flex-col gap-4 items-center animate-fade-in-up animation-delay-500">
                {renderVerificationBanner()}
                
                <div className="relative w-full max-w-3xl">
                  <Sparkles className="absolute -top-6 -right-6 text-violet-500 animate-float w-12 h-12 opacity-70" />
                  <Wand2 className="absolute -bottom-6 -left-6 text-indigo-500 animate-float animation-delay-1000 w-12 h-12 opacity-70" />
                  <div className="glass-card p-1 rounded-xl border border-violet-500/20 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500 animate-glow">
                    <div className="w-full mx-auto">
                      <ApiKeyInput onApiKeyChange={handleApiKeyChange} />
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
                            disabled={!prompt.trim() || !isApiKeySet}
                            isLoading={isGenerating}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SoloPush Badge */}
                <div className="mt-6 flex justify-center">
                  <a 
                    href="https://solopush.com/product/pixelmagic" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:opacity-90 transition-opacity"
                  >
                    <img 
                      src="https://solopush.com/1-dark.png" 
                      alt="View on SoloPush" 
                      style={{ width: '250px' }}
                    />
                  </a>
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
                        onClick={loginWithGoogle}
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
                        onClick={() => setIsPurchaseModalOpen(true)}
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

        {/* Credit Purchase Modal */}
        {auth.currentUser && (
          <CreditPurchaseModal 
            isOpen={isPurchaseModalOpen}
            onClose={() => setIsPurchaseModalOpen(false)}
            userId={auth.currentUser.uid}
          />
        )}
      </div>
    </>
  );
};

export default React.memo(Index);
