
/**
 * Safely checks if a property exists on the window object
 * without triggering errors from browser extensions that might
 * be intercepting property access.
 */
export const safeWindowHasProperty = (propertyName: string): boolean => {
  try {
    // Check using Object.prototype.hasOwnProperty to avoid extension conflicts
    return Object.prototype.hasOwnProperty.call(window, propertyName);
  } catch (error) {
    console.warn(`Error checking for window.${propertyName}:`, error);
    return false;
  }
};

/**
 * Safely access a property on the window object with error handling
 * for browser extension conflicts.
 */
export const safeWindowProperty = <T>(propertyName: string, defaultValue: T): T => {
  try {
    if (safeWindowHasProperty(propertyName)) {
      // Use Object.getOwnPropertyDescriptor to safely read the property
      const descriptor = Object.getOwnPropertyDescriptor(window, propertyName);
      if (descriptor && 'value' in descriptor) {
        return descriptor.value as T;
      }
    }
    return defaultValue;
  } catch (error) {
    console.warn(`Error accessing window.${propertyName}:`, error);
    return defaultValue;
  }
};

/**
 * Safely modifies how the application initializes to avoid
 * conflicts with browser extensions that redefine properties.
 */
export const initializeWalletCompatibility = (): void => {
  // Create a clean iframe to detect true browser capabilities without extension interference
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Store the original properties before extension modifications
    if (iframe.contentWindow) {
      const cleanWindow = iframe.contentWindow;
      
      // Save a reference to the clean window properties for later use
      (window as any).__cleanWindowProps = {
        hasEthereum: 'ethereum' in cleanWindow,
        hasSolana: 'solana' in cleanWindow
      };
    }
    
    // Clean up
    document.body.removeChild(iframe);
  } catch (error) {
    console.warn('Failed to initialize wallet compatibility layer:', error);
  }
};
