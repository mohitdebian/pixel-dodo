// Base URLs
export const BASE_URLS = {
  // API endpoints
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // Image proxy service
  IMAGE_PROXY_URL: 'https://image-proxy.pixelmagic.workers.dev',
  
  // Payment related URLs
  PAYMENT: {
    CHECKOUT_DOMAIN: import.meta.env.PROD
      ? 'https://checkout.dodopayments.com'  // Production URL
      : 'https://test.checkout.dodopayments.com', // Development URL
    REDIRECT_URL: import.meta.env.PROD
      ? 'https://pixeldodo.vercel.app/dodo-redirect'  // Production URL
      : (import.meta.env.VITE_PAYMENT_REDIRECT_URL || 'http://localhost:3000/dodo-redirect'), // Development URL
  },
  
  // Firebase URLs
  FIREBASE: {
    AUTH_DOMAIN: 'pixel-magic-f5b9c.firebaseapp.com',
    STORAGE_BUCKET: 'pixel-magic-f5b9c.firebasestorage.app',
  },
  
  // Development URLs
  DEV: {
    NGROK_URL: import.meta.env.VITE_NGROK_URL || '',
    LOCALHOST: 'http://localhost:3000',
  },

  // Production URLs
  PROD: {
    APP_URL: 'https://pixel-magic-ai.web.app',
    FIREBASE_URL: 'https://pixel-magic-ai.firebaseapp.com',
  }
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${BASE_URLS.API_BASE_URL}${endpoint}`;
};

// Helper function to get full payment URL
export const getPaymentUrl = (sessionId: string): string => {
  return `${BASE_URLS.PAYMENT.CHECKOUT_DOMAIN}/c/pay/${sessionId}`;
}; 