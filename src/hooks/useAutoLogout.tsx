import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useAutoLogout = () => {
  const { signOut, user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    if (user) {
      // Set inactivity timeout for 2 minutes (120000 ms)
      inactivityTimeoutRef.current = setTimeout(() => {
        signOut();
      }, 120000);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Reset timer on any user activity
    const resetTimer = () => resetInactivityTimer();
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the inactivity timer
    resetInactivityTimer();

    // Handle tab/window close
    const handleBeforeUnload = () => {
      signOut();
    };

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        timeoutRef.current = setTimeout(() => {
          signOut();
        }, 1000); // 1 second delay for tab switching
      } else {
        // User came back to tab
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        resetInactivityTimer();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user, signOut]);

  return null;
};