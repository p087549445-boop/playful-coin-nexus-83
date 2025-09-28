import { useEffect } from 'react';
import { useAuth } from './useAuth';

export const useAutoLogout = () => {
  const { signOut, user } = useAuth();
  let inactivityTimer: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    if (user) {
      inactivityTimer = setTimeout(() => {
        signOut();
      }, 2 * 60 * 1000); // 2 minutes
    }
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    if (!user) return;

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up beforeunload listener for tab close
    const beforeUnloadListener = () => {
      signOut();
    };
    window.addEventListener('beforeunload', beforeUnloadListener);

    // Start the timer
    resetTimer();

    return () => {
      // Clean up listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      window.removeEventListener('beforeunload', beforeUnloadListener);
      clearTimeout(inactivityTimer);
    };
  }, [user, signOut]);
};