import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import PromptInput from '@/components/PromptInput';
import GenerateButton from '@/components/GenerateButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import ApiKeyInput from '@/components/ApiKeyInput';
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
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Memoize static data
  const AI_MODELS = useMemo(() => [
    {
      id: '1',
      imageUrl: 'slide5.jpg',
      title: 'Smiling girl',
      description: 'A smiling young woman standing in a bustling neon-lit Asian street at night, cinematic lighting, high detail, bokeh background, vibrant city vibe',
    },
    {
      id: '2',
      imageUrl: '/slide4.jpg',
      title: 'Sunset Drive',
      description: 'A sleek black sports car driving on a winding coastal road during sunset, golden hour lighting, cinematic style, hyper-realistic',
    },
    {
      id: '3',
      imageUrl: '/slide1.jpg',
      title: 'Coffee Moments',
      description: 'A cup of freshly brewed espresso on a wooden café table, scattered coffee beans, barista in background, warm sunlight through windows, cozy aesthetic',
    },
    {
      id: '4',
      imageUrl: '/Anime_1.jpg',
      title: 'Rainfall Warrior',
      description: 'Dark-haired anime girl with intense eyes wearing a hooded cloak, standing in rain, cinematic lighting, ultra-realistic anime style, mysterious vibe',
    },
  ], []);

  const SLIDESHOW_IMAGES = useMemo(() => [
    {
      url: '/Anime_1.jpg',
      prompt: 'A serene landscape with mountains and a lake at sunset'
    },
    {
      url: '/examples/example2.jpg',
      prompt: 'A futuristic cityscape with flying cars and neon lights'
    },
    {
      url: '/examples/example3.jpg',
      prompt: 'A magical forest with glowing mushrooms and fairy lights'
    },
    {
      url: '/examples/example4.jpg',
      prompt: 'An underwater scene with bioluminescent creatures'
    },
    {
      url: '/examples/example5.jpg',
      prompt: 'A steampunk-inspired mechanical dragon'
    },
    {
      url: '/examples/example6.jpg',
      prompt: 'A cozy cafe interior with warm lighting and vintage decor'
    }
  ], []);

  const tutorialSteps = useMemo(() => [
    {
      icon: <Wand2 className="w-12 h-12 text-violet-400" />,
      title: "Welcome to Pixel Magic!",
      description: "Generate stunning images from text prompts using the power of AI.",
    },
    {
      icon: <Zap className="w-12 h-12 text-indigo-400" />,
      title: "Get Started Instantly",
      description: "Sign up or log in to receive free credits and unlock full features.",
    },
    {
      icon: <Bot className="w-12 h-12 text-purple-400" />,
      title: "Explore AI Models",
      description: "Discover fine-tuned models to create images in various styles.",
    },
  ], []);

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

  useEffect(() => {
    const envApiKey = import.meta.env.VITE_TOGETHER_API_KEY;
    
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

  useEffect(() => {
    const tutorialShown = localStorage.getItem('tutorialShown');
    if (!tutorialShown) {
      setShowTutorial(true);
    }
  }, []);

  // Memoize handlers
  const handlePromptChange = useCallback((value: string) => {
    setPrompt(value);
  }, []);

  const handleApiKeyChange = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
  }, []);

  const handleResendVerification = useCallback(async () => {
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
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    
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

    setIsGenerating(true);

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

    try {
      const [verified, hasCredits] = await Promise.all([
        checkEmailVerified(user.uid),
        hasEnoughCredits(user.uid)
      ]);
      
      setIsEmailVerified(verified);
      
      if (!verified) {
        toast.error('Please verify your email before generating images', {
          duration: 4000,
          className: "font-medium border border-red-200",
          icon: <Mail className="h-5 w-5 text-red-400 animate-pulse" />,
        });
        setIsGenerating(false);
        return;
      }
      
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
      
      const newImage = await generateImage(prompt);
      
      setImages(prevImages => [newImage, ...prevImages]);
      
      toast.success('Image generated successfully!', {
        duration: 3000,
        className: "font-medium border border-green-200",
        icon: <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />,
      });
      
    } catch (error) {
      console.error('Error generating image:', error);
      
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
      setIsGenerating(false);
    }
  }, [prompt, isApiKeySet, isGenerating]);

  const handleNextTutorial = useCallback(() => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('tutorialShown', 'true');
    }
  }, [tutorialStep, tutorialSteps.length]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await loginWithGoogle();
      toast.success('Logged in with Google successfully');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Failed to login with Google');
    }
  }, []);

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

  const handleApiKeySubmit = useCallback(async (apiKey: string) => {
    try {
      initializeTogether(apiKey);
      setIsApiKeySet(true);
      toast.success("API key set successfully!");
    } catch (error) {
      console.error("Error setting API key:", error);
      toast.error("Failed to set API key. Please try again.");
    }
  }, []);

  const handleCloseApiKeyModal = useCallback(() => {
    setIsApiKeySet(false);
  }, []);

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

  return (
    <>
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent
          className="w-[95%] max-w-lg mx-auto glass-card shadow-2xl animate-fade-in-up p-0 overflow-visible"
          style={{
            background: 'rgba(17, 17, 23, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '2rem',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
          hideClose
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-purple-500/10 animate-gradient-x"></div>
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-glow border-4 border-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 opacity-30"></div>

          <DialogHeader className="relative z-10 flex flex-col items-center gap-4 pt-16 pb-8 px-8 w-full">
            {/* Icon with enhanced glow effect */}
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/40 to-indigo-500/40 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                {tutorialSteps[tutorialStep].icon}
              </div>
            </div>

            {/* Title with enhanced gradient and animation */}
            <DialogTitle className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text drop-shadow-lg text-center font-display tracking-tight animate-fade-in-up">
              {tutorialSteps[tutorialStep].title}
            </DialogTitle>

            {/* Description with enhanced styling */}
            <DialogDescription className="text-lg sm:text-xl text-indigo-200/90 font-medium text-center mt-2 animate-fade-in-up animation-delay-200 max-w-md leading-relaxed">
              {tutorialSteps[tutorialStep].description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress indicators with enhanced styling */}
          <div className="relative z-10 flex justify-center items-center gap-4 mt-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`relative h-3 w-3 rounded-full transition-all duration-500 ${
                  index === tutorialStep 
                    ? 'bg-gradient-to-r from-violet-400 to-indigo-400 scale-150' 
                    : 'bg-gray-600/50'
                }`}
              >
                {index === tutorialStep && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full animate-pulse"></div>
                )}
              </div>
            ))}
          </div>

          {/* Final step special content */}
          {tutorialStep === tutorialSteps.length - 1 && (
            <div className="relative z-10 flex flex-col items-center gap-6 px-8 py-8 mt-8 bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl mx-8 animate-fade-in-up animation-delay-300">
              <div className="flex items-center gap-4 text-green-400 font-medium">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full animate-pulse"></div>
                  <span className="relative text-3xl animate-bounce">✨</span>
                </div>
                <span className="text-xl">Get 50 free credits on signup!</span>
              </div>
              <div className="flex items-center gap-4 text-indigo-400 font-medium">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full animate-pulse"></div>
                  <span className="relative text-3xl animate-float">🎨</span>
                </div>
                <span className="text-xl">Over 1,500+ images generated!</span>
              </div>
            </div>
          )}

          {/* Enhanced button styling */}
          <div className="relative z-10 flex justify-center mt-8 mb-12 px-8 w-full">
            <Button
              onClick={handleNextTutorial}
              className="relative px-10 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 group"
            >
              <span className="relative z-10">
                {tutorialStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className={`min-h-screen flex flex-col items-center ${showTutorial ? 'blur-sm pointer-events-none' : ''} overflow-x-hidden`}>
        <header className="w-full bg-gradient-to-b from-violet-900/20 to-background py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute -left-24 top-1/3 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -right-24 top-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
          
          <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto relative z-10">
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
              {renderVerificationBanner()}
              
              <div className="relative w-full max-w-3xl px-4 md:px-8">
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
            {/* AI Models Showcase */}
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
                {AI_MODELS.map((model) => (
                  <div key={model.id} className="glass-card p-6 lg:p-8 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up hover:animate-glow">
                    <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                      <img src={model.imageUrl} alt={model.title} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-medium mb-3 text-gray-100 font-heading">{model.title}</h3>
                    <p className="text-gray-400 font-body text-base lg:text-lg leading-relaxed">{model.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Example Gallery
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text font-display">
                Inspiration Gallery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SLIDESHOW_IMAGES.slice(0, 6).map((image, index) => (
                  <div key={index} className="glass-card rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300 animate-fade-in-up">
                    <div className="aspect-square relative">
                      <img src={image.url} alt={`Example ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white text-sm font-medium">{image.prompt}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section> */}

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
    </>
  );
};

export default React.memo(Index);
