import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthUser extends User {
  credits?: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data including credits from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser({ ...user, credits: userSnap.data().credits });
          } else {
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deductCreditsInFirebase = async (amount: number) => {
    if (!user) return false;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.error('User document does not exist');
        return false;
      }

      const currentCredits = userSnap.data().credits || 0;
      if (currentCredits < amount) {
        console.error('Insufficient credits');
        return false;
      }

      // Update credits in Firestore
      await updateDoc(userRef, {
        credits: currentCredits - amount
      });

      // Update local state
      setUser(prev => prev ? { ...prev, credits: currentCredits - amount } : null);
      
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  };

  const deductCredits = async (amount: number) => {
    return deductCreditsInFirebase(amount);
  };

  return {
    user,
    loading,
    deductCredits,
    deductCreditsInFirebase,
  };
} 