'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function Home() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle payment status from URL parameters
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');

    if (paymentId && status) {
      if (status === 'succeeded') {
        toast.success('✅ Payment successful! Credits will be added soon.');
        // TODO: Optionally update credits here (use API call)
      } else {
        toast.error('❌ Payment failed or cancelled.');
      }
    }
  }, [searchParams]);

  // ... rest of your existing component code ...
} 