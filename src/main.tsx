
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for potential wallet provider conflicts
const checkForProviderConflicts = () => {
  try {
    // Check if ethereum is already defined and not configurable
    const ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    if (ethereumDescriptor && !ethereumDescriptor.configurable) {
      console.warn('Non-configurable ethereum provider detected. This might cause conflicts with Solana wallet adapters.');
    }
    
    // Check for other common wallet provider conflicts
    const potentialConflicts = [
      'solana', 'solanaWeb3', 'phantom', 'solflare', 
      'coin98', 'clover', 'slope', 'coinbase'
    ];
    
    potentialConflicts.forEach(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(window, prop);
      if (descriptor && !descriptor.configurable) {
        console.warn(`Non-configurable ${prop} provider detected. This might cause conflicts.`);
      }
    });
  } catch (error) {
    console.error('Error checking for provider conflicts:', error);
  }
};

// Global error handler to catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  
  // Check if this is a wallet provider conflict error
  if (event.error && event.error.message && 
      (event.error.message.includes('redefine property') || 
       event.error.message.includes('ethereum'))) {
    console.warn('Detected potential wallet provider conflict. You may have multiple wallet extensions active.');
  }
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Initializing application');

try {
  // Check for potential conflicts before rendering
  checkForProviderConflicts();
  
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Failed to render application:', error);
  // Display fallback error UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      ">
        <h1 style="color: #e11d48;">Application Error</h1>
        <p>Sorry, the application failed to start. Please try refreshing the page.</p>
        <p>If you have multiple wallet extensions active, try disabling all but one.</p>
        <p>If the problem persists, check the browser console for more details.</p>
        <button onclick="window.location.reload();" style="
          background: #4f46e5;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          margin-top: 1rem;
        ">Refresh Page</button>
      </div>
    `;
  }
}
