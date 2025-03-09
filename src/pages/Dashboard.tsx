
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TokenCard from '@/components/TokenCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';

// Mock data for tokens
const mockTokens = [
  {
    id: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3500.75,
    priceChange: 5.23,
    timeRemaining: 45,
  },
  {
    id: '2',
    name: 'Solana',
    symbol: 'SOL',
    price: 125.62,
    priceChange: -2.14,
    timeRemaining: 32,
  },
  {
    id: '3',
    name: 'Algorand',
    symbol: 'ALGO',
    price: 0.58,
    priceChange: 1.75,
    timeRemaining: 58,
  },
  {
    id: '4',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.95,
    priceChange: -0.32,
    timeRemaining: 15,
  },
  {
    id: '5',
    name: 'Polkadot',
    symbol: 'DOT',
    price: 15.28,
    priceChange: 3.45,
    timeRemaining: 22,
  },
  {
    id: '6',
    name: 'Chainlink',
    symbol: 'LINK',
    price: 18.75,
    priceChange: 7.82,
    timeRemaining: 51,
  },
  {
    id: '7',
    name: 'Avalanche',
    symbol: 'AVAX',
    price: 42.36,
    priceChange: -1.28,
    timeRemaining: 38,
  },
  {
    id: '8',
    name: 'Polygon',
    symbol: 'MATIC',
    price: 1.23,
    priceChange: 2.56,
    timeRemaining: 27,
  },
];

const Dashboard = () => {
  const [tokens, setTokens] = useState(mockTokens);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filter tokens based on search query
  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Dashboard</h1>
          <p className="text-dream-foreground/70">Predict moon or die within the next hour for these migrating tokens</p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="glass-panel flex items-center w-full md:w-auto">
            <Search className="w-5 h-5 ml-3 text-dream-foreground/60" />
            <input
              type="text"
              placeholder="Search tokens..."
              className="bg-transparent border-none outline-none px-3 py-2 w-full md:w-64 text-dream-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button className="glass-panel flex items-center px-4 py-2">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <span>Filters</span>
          </button>
        </div>
        
        {/* Tokens Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="glass-panel p-10 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
              <p className="text-dream-foreground/70">Loading tokens...</p>
            </div>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-xl text-dream-foreground/70">No tokens found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTokens.map((token) => (
              <TokenCard key={token.id} {...token} />
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="glass-panel mt-20 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dream-foreground/40 text-sm">
            © {new Date().getFullYear()} DreamBet. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Dashboard;
