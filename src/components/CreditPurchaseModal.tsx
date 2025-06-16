'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { purchaseCredits } from '../services/auth';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const CREDIT_PACKAGES = [
  { 
    amount: 100, 
    price: 3, 
    popular: false, 
    icon: "✨",
    productId: "pdt_pXCCBMDtusTUcsrB6KECY"  // 100 Credits
  },
  { 
    amount: 500, 
    price: 10, 
    popular: true, 
    icon: "🔥",
    productId: "pdt_QcERrcHmG3kzIBR0Su4Sc"  // 500 Credits
  },
  { 
    amount: 1000, 
    price: 18, 
    popular: false, 
    icon: "⚡",
    productId: "pdt_g1vldnHU4iWPsnPWuNfBF"  // 1000 Credits
  },
];  

// Declare Dodo global type
declare global {
  interface Window {
    Dodo: any;
  }
}

// Dodo API credentials
const DODO_API_KEY = "DiAdnIuZR0K9EOry.cPCHt-W42PjQrZXoAWRm4Myc94FhUOX1VeCN7gcJEdKlWtZ2";

export const CreditPurchaseModal = ({ isOpen, onClose, userId }: CreditPurchaseModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<{ name: string; email: string }>({ name: '', email: '' });

  useEffect(() => {
    // Get current user details
    const user = auth.currentUser;
    if (user) {
      setUserDetails({
        name: user.displayName ? user.displayName.replace(/[^a-zA-Z0-9\s]/g, '') : 'User',
        email: user.email || ''
      });
    }
  }, []);

  const handlePurchase = async (amount: number, price: number, productId: string) => {
    try {
      setIsLoading(true);
      setSelectedPackage(amount);

      // Construct the payment URL with the correct Dodo checkout domain and redirect URL
      const baseUrl = 'https://test.checkout.dodopayments.com/buy';
      // Use the current active ngrok URL for redirection
      const redirectUrl = 'https://pixeldodo.vercel.app/dodo-redirect';
      const paymentUrl = `${baseUrl}/${productId}?quantity=1&redirect_url=${encodeURIComponent(redirectUrl)}`;

      // Redirect to Dodo checkout
      window.location.href = paymentUrl;
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  const getValueText = (amount: number, price: number) => {
    if (amount === 100) return 'Basic';
    if (amount === 500) return 'Best Value';
    if (amount === 1000) return 'Pro Pack';
    
    return `$${(price / amount).toFixed(4)} per credit`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="bg-[#1a1a1a] border-[#2d2d2d] max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-1">
          <DialogTitle className="text-white text-xl font-bold">Power Up Your Creativity</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            Purchase credits to generate more amazing images
          </DialogDescription>
          <p className="text-violet-400 text-sm mt-2">
            10 credits per image generation
          </p>
        </DialogHeader>
        
        <div className="grid gap-3 py-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.amount}
              className={`relative rounded-lg border transition-all duration-300 overflow-hidden ${
                pkg.popular 
                  ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                  : 'border-[#2d2d2d] hover:border-blue-500/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{pkg.icon}</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">{pkg.amount} Credits</h3>
                      <p className="text-blue-400 text-xs">{getValueText(pkg.amount, pkg.price)}</p>
                    </div>
                  </div>
                  <div className="text-white text-xl font-bold">
                    <div className="flex items-center gap-1">
                      <span>${pkg.price}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className={`w-full py-2 text-white font-medium text-sm ${
                    pkg.popular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-[#2d2d2d] hover:bg-[#3d3d3d]'
                  }`}
                  onClick={() => handlePurchase(pkg.amount, pkg.price, pkg.productId)}
                  disabled={isLoading}
                >
                  {isLoading && selectedPackage === pkg.amount ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-1 text-center text-xs text-gray-500">
          Secure payments powered by Dodo.
        </div>
      </DialogContent>
    </Dialog>
  );
};