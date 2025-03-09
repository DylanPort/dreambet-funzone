
import { useEffect, useCallback } from 'react';

export const useVisibilityChange = (onVisibilityChange: () => void) => {
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      onVisibilityChange();
    }
  }, [onVisibilityChange]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
};
