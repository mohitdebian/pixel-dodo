import { useState, useEffect } from 'react';

export function useCredits() {
  const [credits, setCredits] = useState(() => {
    const savedCredits = localStorage.getItem('credits');
    return savedCredits ? parseInt(savedCredits, 10) : 10; // Default 10 credits
  });

  useEffect(() => {
    localStorage.setItem('credits', credits.toString());
  }, [credits]);

  const deductCredits = (amount: number) => {
    setCredits(prev => Math.max(0, prev + amount));
  };

  return { credits, deductCredits };
} 