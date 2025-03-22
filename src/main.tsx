
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import SolanaWalletProvider from './providers/SolanaWalletProvider';
import { PXBPointsProvider } from './contexts/pxb/PXBPointsContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SolanaWalletProvider>
      <PXBPointsProvider>
        <Router>
          <App />
        </Router>
      </PXBPointsProvider>
    </SolanaWalletProvider>
  </React.StrictMode>,
);
