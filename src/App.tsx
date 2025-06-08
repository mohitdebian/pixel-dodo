import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { UserAvatar } from "./components/UserAvatar";
import { onAuthStateChange } from "./services/auth";
import { AuthModal } from "./components/AuthModal";
import { LogIn, Sparkles } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppRoutes from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Analytics />
          <div className="relative min-h-screen">
            {/* Glossy Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-violet-900/20 via-background to-background"></div>
            <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
            
            {/* Animated background elements */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-blob"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            </div>
            
            <div className="absolute top-4 left-4 z-50">
              <a href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-lg bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
                  Pixel Magic
                </div>
              </a>
            </div>
            <div className="absolute top-4 right-4 z-50">
              {isAuthChecking ? (
                <div className="w-10 h-10 rounded-full bg-[#2d2d2d] flex items-center justify-center animate-pulse">
                  <span className="sr-only">Loading</span>
                </div>
              ) : user ? (
                <UserAvatar />
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
        
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
