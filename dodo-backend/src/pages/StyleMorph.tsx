import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageSlider } from "@/components/ImageSlider";
import { Info, Image as ImageIcon, Wand2, Stars, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { client } from "@gradio/client";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CreditPurchaseModal } from "@/components/CreditPurchaseModal";

const BUILT_IN_LORAS = [
  { 
    id: "3D_Chibi", 
    name: "3D Chibi",
    description: "Transform your image into a cute 3D chibi character style"
  },
  { 
    id: "American_Cartoon", 
    name: "American Cartoon",
    description: "Turn your image into a classic American cartoon style"
  },
  { 
    id: "Chinese_Ink",  
    name: "Chinese Ink",
    description: "Transform your image into traditional Chinese ink painting style"
  },
  { 
    id: "Clay_Toy", 
    name: "Clay Toy",
    description: "Convert your image into a clay-like toy figure style"
  },
  { 
    id: "Fabric", 
    name: "Fabric",
    description: "Transform your image into a fabric art style"
  },
  { 
    id: "Ghibli", 
    name: "Ghibli",
    description: "Transform your image into Studio Ghibli's iconic anime style"
  },
  { 
    id: "Irasutoya", 
    name: "Irasutoya",
    description: "Convert your image into Irasutoya's cute illustration style"
  },
  { 
    id: "Jojo", 
    name: "Jojo",
    description: "Transform your image into Jojo's Bizarre Adventure style"
  },
  { 
    id: "LEGO", 
    name: "LEGO",
    description: "Convert your image into LEGO brick art style"
  },
  { 
    id: "Line", 
    name: "Line",
    description: "Transform your image into clean line art style"
  },
  { 
    id: "Macaron", 
    name: "Macaron",
    description: "Convert your image into a sweet macaron art style"
  },
  { 
    id: "Oil_Painting", 
    name: "Oil Painting",
    description: "Transform your image into classical oil painting style"
  },
  { 
    id: "Origami", 
    name: "Origami",
    description: "Transform your image into paper origami art style"
  },
  { 
    id: "Paper_Cutting", 
    name: "Paper Cutting",
    description: "Convert your image into paper cutting art style"
  },
  { 
    id: "Picasso", 
    name: "Picasso",
    description: "Transform your image into Picasso's cubist style"
  },
  { 
    id: "Pixel", 
    name: "Pixel",
    description: "Convert your image into pixel art style"
  },
  { 
    id: "Poly", 
    name: "Poly",
    description: "Transform your image into polygonal art style"
  },
  { 
    id: "Pop_Art", 
    name: "Pop Art",
    description: "Convert your image into pop art style"
  },
  { 
    id: "Rick_Morty", 
    name: "Rick and Morty",
    description: "Transform your image into Rick and Morty's art style"
  },
  { 
    id: "Snoopy", 
    name: "Snoopy",
    description: "Convert your image into Snoopy's comic style"
  },
  { 
    id: "Van_Gogh", 
    name: "Van Gogh",
    description: "Transform your image into Van Gogh's post-impressionist style"
  },
  { 
    id: "Vector", 
    name: "Vector",
    description: "Convert your image into a clean, modern vector art style"
  },
];

export default function StyleMorph() {
  const location = useLocation();
  const { user, loading, deductCreditsInFirebase } = useAuth();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedLora, setSelectedLora] = useState(BUILT_IN_LORAS[0].id);
  const [customLoraPath, setCustomLoraPath] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(24);
  const [guidance, setGuidance] = useState(3.5);
  const [seed, setSeed] = useState(42);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creditsDeducted, setCreditsDeducted] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState("original");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedShape, setSelectedShape] = useState("square");
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const SHAPE_OPTIONS = [
    { id: "square", label: "Default (1:1)", aspectRatio: 1 },
    { id: "circle", label: "Circle (1:1)", aspectRatio: 1 },
  ];

  const getResolutionDimensions = (shape: string) => {
    const shapeInfo = SHAPE_OPTIONS.find(s => s.id === shape) || SHAPE_OPTIONS[0];
    const aspectRatio = shapeInfo.aspectRatio;
    
    return {
      width: 1024,
      height: Math.round(1024 / aspectRatio)
    };
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    
    // Check if user has enough credits
    if (!user || user.credits < 10) {
      toast.error("Insufficient credits", {
        description: "You need 10 credits to generate an image. Please purchase more credits.",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setCreditsDeducted(false);

    try {
      const app = await client("yiren98/OmniConsistency");
      const imageBlob = new Blob([await uploadedImage.arrayBuffer()], { type: uploadedImage.type });
      const { width: newWidth, height: newHeight } = getResolutionDimensions(selectedShape);

      const result = await app.predict("/generate_image", {
        lora_name: selectedLora,
        custom_repo_id: customLoraPath || "",
        prompt: prompt,
        uploaded_image: imageBlob,
        width: newWidth.toString(),
        height: newHeight.toString(),
        guidance_scale: guidance,
        num_inference_steps: steps,
        seed: seed,
      });

      const generatedImageUrl = result.data?.[0]?.[1]?.url;
      if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
        console.log("Generated Image URL:", generatedImageUrl);
        setGeneratedImage(generatedImageUrl);
      } else {
        console.error("Invalid image URL received:", generatedImageUrl);
        throw new Error("Invalid image URL received from the server");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Beta trial ended", {
        description: error instanceof Error ? error.message : "Come back tomorrow",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    // Only deduct credits if not already done
    if (!creditsDeducted) {
      const success = await deductCreditsInFirebase(10);
      if (!success) {
        toast.error("Failed to deduct credits", {
          description: "You may not have enough credits or there was a network error.",
        });
        return;
      }
      setCreditsDeducted(true);
      toast.success("Credits deducted. Downloading image...");
    }

    // Proceed with download
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stylemorph-${selectedLora}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download image', {
        description: 'Please try again.',
      });
    }
  };

  const handleManualCreditDeduction = async () => {
    if (!user || !generatedImage) return;

    try {
      const success = await deductCreditsInFirebase(10);
      if (success) {
        setCreditsDeducted(true);
        toast.success("Image generated successfully", {
          description: `Generate more`,
        });
      } else {
        toast.error("Failed to deduct credits", {
          description: "Please try again later or contact support.",
        });
      }
    } catch (error) {
      console.error("Error deducting credits:", error);
      toast.error("Failed to deduct credits", {
        description: "Please try again later or contact support.",
      });
    }
  };

  const handleRegenerateWithResolution = async () => {
    if (!uploadedImage) return;
    
    // Check if user has enough credits
    if (!user || user.credits < 10) {
      toast.error("Insufficient credits", {
        description: "You need 10 credits to generate an image. Please purchase more credits.",
      });
      return;
    }

    setIsRegenerating(true);
    setGeneratedImage(null);
    setCreditsDeducted(false);

    try {
      const app = await client("yiren98/OmniConsistency");
      const imageBlob = new Blob([await uploadedImage.arrayBuffer()], { type: uploadedImage.type });
      const { width: newWidth, height: newHeight } = getResolutionDimensions(selectedShape);

      const result = await app.predict("/generate_image", {
        lora_name: selectedLora,
        custom_repo_id: customLoraPath || "",
        prompt: prompt,
        uploaded_image: imageBlob,
        width: newWidth.toString(),
        height: newHeight.toString(),
        guidance_scale: guidance,
        num_inference_steps: steps,
        seed: seed,
      });

      const generatedImageUrl = result.data?.[0]?.[1]?.url;
      if (generatedImageUrl) {
        setGeneratedImage(generatedImageUrl);
      } else {
        throw new Error("No image URL found in response");
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast.error("Regeneration failed", {
        description: error instanceof Error ? error.message : "Failed to regenerate image. Please try again.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const selectedLoraInfo = BUILT_IN_LORAS.find(lora => lora.id === selectedLora);

  return (
    <div className="min-h-screen flex flex-col items-center overflow-x-hidden">
      <header className="w-full bg-gradient-to-b from-violet-900/20 to-background py-16 md:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute -left-24 top-1/3 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -right-24 top-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto relative z-10 px-4">
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
              AI-Powered Style Transfer
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-2 mt-4 animate-fade-in-up bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text font-display">
            StyleMorph
          </h1>
          <p className="text-xl md:text-2xl mb-8 mt-2 text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-300 opacity-90 font-sans leading-relaxed font-semibold px-4 sm:px-0">
            Transform your images with AI-powered style transfer
          </p>

          <div className="glass-card p-6 rounded-xl border border-violet-500/20 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-500 animate-glow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">1. Upload Your Image</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Drag and drop an image or click to browse
                  </p>
                  <div className="relative z-20">
                    <ImageUpload
                      onImageSelect={setUploadedImage}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-medium">2. Choose a Style</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Select a style from our collection
                  </p>
                  <div className="relative mt-2">
                    <Select
                      value={selectedLora}
                      onValueChange={setSelectedLora}
                    >
                      <SelectTrigger className="w-full bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border-violet-500/30 backdrop-blur-md shadow-lg hover:from-violet-500/20 hover:to-indigo-500/20 hover:border-violet-500/50 transition-all duration-300">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent className="bg-gradient-to-b from-violet-900/30 to-indigo-900/30 border-violet-500/30 backdrop-blur-xl shadow-lg">
                        {BUILT_IN_LORAS.map((lora) => (
                          <SelectItem 
                            key={lora.id} 
                            value={lora.id}
                            className="flex items-center gap-2 hover:bg-violet-500/20 focus:bg-violet-500/20 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-sm font-medium text-violet-300">
                                  {lora.name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-violet-100">{lora.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-medium">3. Add Prompt (Optional)</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Add additional details to guide the style transfer
                  </p>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter additional details..."
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!uploadedImage || isGenerating || loading || !user || user.credits < 10}
                  className="w-full py-6 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : isGenerating ? "Generating..." : !user || user.credits < 10 ? "Insufficient Credits" : "Transform Image"}
                </Button>
                {loading ? (
                  <p className="text-sm text-violet-400 mt-2 text-center">
                    Loading user data...
                  </p>
                ) : !user || user.credits < 10 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-400 mt-2 text-center">
                      You need 10 credits to generate an image
                    </p>
                    <Button
                      onClick={() => setIsPurchaseModalOpen(true)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      <Stars className="w-4 h-4 mr-2" />
                      Buy Credits
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-violet-400 mt-2 text-center">
                      This will cost 10 credits
                    </p>
                    <Button
                      onClick={() => setIsPurchaseModalOpen(true)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      <Stars className="w-4 h-4 mr-2" />
                      Get More Credits
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">Preview</Label>
                  <div className="mt-2 aspect-square rounded-lg overflow-hidden bg-violet-900/20 border border-violet-500/20 relative group">
                    {generatedImage ? (
                      <>
                        <div className="relative w-full h-full">
                          <div className={`w-full h-full ${selectedShape === 'circle' ? 'rounded-full overflow-hidden' : ''}`}>
                            <img
                              src={generatedImage}
                              alt="Generated"
                              className={`w-full h-full ${selectedShape === 'circle' ? 'object-cover' : 'object-contain'}`}
                              onError={(e) => {
                                console.error("Image load error:", e);
                                toast.error("Failed to load generated image", {
                                  description: "Please try generating again.",
                                });
                              }}
                            />
                          </div>
                          {!creditsDeducted && (
                            <>
                              {/* Watermark overlay */}
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center p-4">
                                  <div className="text-2xl font-bold text-white mb-2">Preview Only</div>
                                  <div className="text-sm text-gray-300 mb-4">Click to View</div>
                                  <Button
                                    onClick={handleManualCreditDeduction}
                                    className="bg-violet-500 hover:bg-violet-600 text-white"
                                  >
                                    <Stars className="w-4 h-4 mr-2" />
                                    Click to View
                                  </Button>
                                </div>
                              </div>
                              {/* Diagonal watermark text */}
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="transform -rotate-45 text-white/20 text-4xl font-bold whitespace-nowrap">
                                    PREVIEW ONLY
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          {creditsDeducted && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <Button
                                onClick={handleDownload}
                                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {isGenerating ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating your image...</span>
                          </div>
                        ) : (
                          "Your transformed image will appear here"
                        )}
                      </div>
                    )}
                  </div>
                  {generatedImage && !creditsDeducted && (
                    <p className="text-sm text-amber-400 mt-2 text-center">
                      Credits haven't been deducted yet. Click the "Deduct Credits" button to download the full image.
                    </p>
                  )}
                </div>

                {generatedImage && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="relative inline-flex items-center p-1 rounded-full bg-violet-900/40 border border-violet-500/30 backdrop-blur-md shadow-lg">
                        {/* Sliding background */}
                        <div 
                          className="absolute inset-0 transition-all duration-300 ease-in-out rounded-full"
                          style={{
                            transform: selectedShape === 'circle' ? 'translateX(100%)' : 'translateX(0%)',
                            width: '50%',
                            background: 'linear-gradient(to right, var(--tw-gradient-stops)) var(--pixel-magic-gradient-from) var(--pixel-magic-gradient-to)',
                            '--pixel-magic-gradient-from': '#8B5CF6',
                            '--pixel-magic-gradient-to': '#A78BFA',
                            boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
                          } as React.CSSProperties}
                        ></div>
                        
                        <button
                          onClick={() => setSelectedShape('square')}
                          className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                            ${selectedShape === 'square' 
                              ? 'text-white font-semibold scale-105' 
                              : 'text-violet-300 hover:text-white/80'}`}
                        >
                          <div className={`w-4 h-4 border-2 ${selectedShape === 'square' ? 'border-white' : 'border-violet-300'}`}></div>
                          Default
                        </button>

                        <button
                          onClick={() => setSelectedShape('circle')}
                          className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                            ${selectedShape === 'circle' 
                              ? 'text-white font-semibold scale-105' 
                              : 'text-violet-300 hover:text-white/80'}`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 ${selectedShape === 'circle' ? 'border-white' : 'border-violet-300'}`}></div>
                          Circle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {user && (
        <CreditPurchaseModal 
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          userId={user.uid}
        />
      )}
    </div>
  );
} 