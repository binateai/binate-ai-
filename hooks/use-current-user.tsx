import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@shared/schema';

// Create a context for the current user
type CurrentUserContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);

// Provider component
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the current user on mount
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If 401, we just set the user to null
        if (response.status === 401) {
          setUser(null);
        } else {
          throw new Error('Failed to fetch user');
        }
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the user on component mount
  useEffect(() => {
    fetchUser();
  }, []);
  
  return (
    <CurrentUserContext.Provider
      value={{
        user,
        isLoading,
        error,
        refetchUser: fetchUser,
        setUser
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

// Hook to use the current user context
export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
}