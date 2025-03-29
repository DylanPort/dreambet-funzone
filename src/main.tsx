
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeWalletCompatibility } from './utils/browserUtils';

// Initialize compatibility layer before rendering the app
initializeWalletCompatibility();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
