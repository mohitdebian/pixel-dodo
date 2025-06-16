'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function DodoRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get the payment status from URL
        const status = searchParams.get('status');
        const orderId = searchParams.get('order_id');

        if (status === 'success' && orderId) {
          toast.success('Payment successful! Your credits will be added shortly.');
        } else {
          toast.error('Payment failed or was cancelled.');
        }

        // Redirect back to the main page
        router.push('/');
      } catch (error) {
        console.error('Redirect error:', error);
        toast.error('Something went wrong. Please contact support.');
        router.push('/');
      }
    };

    handleRedirect();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Processing Payment...</h1>
        <p className="text-gray-400">Please wait while we confirm your payment.</p>
      </div>
    </div>
  );
} 