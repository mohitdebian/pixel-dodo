import { useState, useEffect } from 'react';

interface User {
  credits: number;
  // Add other user properties as needed
}

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { credits: 100 }; // Default 100 credits
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const updateCredits = (newCredits: number) => {
    setUser(prev => prev ? { ...prev, credits: newCredits } : null);
  };

  return { user, updateCredits };
} 