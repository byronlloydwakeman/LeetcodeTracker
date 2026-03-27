import { useEffect, useState } from 'react';
import { auth } from '../../firebase.ts';
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Sign in anonymously
        try {
          const result = await signInAnonymously(auth);
          setUser(result.user);
        } catch (error) {
          console.error('Auth error:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};