
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PriceChart from '@/components/PriceChart';
import CountdownTimer from '@/components/CountdownTimer';
import { ArrowLeft, ArrowUp, ArrowDown, Info } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { toast } from '@/hooks/use-toast';

// Mock token data
const mockTokens = {
  '1': {
    id: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3500.75,
    priceChange: 5.23,
    description: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality.',
    volume: 24500000,
    marketCap: 420000000000,
  },
  '2': {
    id: '2',
    name: 'Solana',
    symbol: 'SOL',
    price: 125.62,
    priceChange: -2.14,
    description: 'Solana is a highly functional open source project that implements a new, permissionless blockchain.',
    volume: 8700000,
    marketCap: 49000000000,
  },
  '3': {
    id: '3',
    name: 'Algorand',
    symbol: 'ALGO',
    price: 0.58,
    priceChange: 1.75,
    description: 'Algorand is a self-sustaining, decentralized, blockchain-based network that supports a wide range of applications.',
    volume: 320000,
    marketCap: 4100000000,
  },
  '4': {
    id: '4',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.95,
    priceChange: -0.32,
    description: 'Cardano is a proof-of-stake blockchain platform with a multi-asset ledger and verifiable smart contracts.',
    volume: 950000,
    marketCap: 33000000000,
  },
  '5': {
    id: '5',
    name: 'Polkadot',
    symbol: 'DOT',
    price: 15.28,
    priceChange: 3.45,
    description: 'Polkadot is a platform that allows diverse blockchains to transfer messages and value in a trust-free fashion.',
    volume: 1200000,
    marketCap: 18000000000,
  },
  '6': {
    id: '6',
    name: 'Chainlink',
    symbol: 'LINK',
    price: 18.75,
    priceChange: 7.82,
    description: 'Chainlink is a decentralized oracle network that provides real-world data to smart contracts on the blockchain.',
    volume: 780000,
    marketCap: 9800000000,
  },
  '7': {
    id: '7',
    name: 'Avalanche',
    symbol: 'AVAX',
    price: 42.36,
    priceChange: -1.28,
    description: 'Avalanche is an open-source platform for launching decentralized applications and enterprise blockchain deployments.',
    volume: 890000,
    marketCap: 14000000000,
  },
  '8': {
    id: '8',
    name: 'Polygon',
    symbol: 'MATIC',
    price: 1.23,
    priceChange: 2.56,
    description: 'Polygon is a protocol and a framework for building and connecting Ethereum-compatible blockchain networks.',
    volume: 1100000,
    marketCap: 12000000000,
  },
};

const TokenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedPrediction, setSelectedPrediction] = useState<'moon' | 'die' | null>(null);
  
  // Calculate end time (60 minutes from now)
  // Fix: Don't use 'new' with useState
  const [endTime] = useState<Date>(new Date(new Date().getTime() + 60 * 60 * 1000));
  
  useEffect(() => {
    // Simulate API call
    if (id && mockTokens[id as keyof typeof mockTokens]) {
      setTimeout(() => {
        setToken(mockTokens[id as keyof typeof mockTokens]);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [id]);
  
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimals
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };
  
  const handlePredictionSelect = (type: 'moon' | 'die') => {
    setSelectedPrediction(type);
  };
  
  const handleSubmitBet = () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedPrediction) {
      toast({
        title: "No prediction selected",
        description: "Please select either Moon or Die prediction",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would normally send the bet to your API
    toast({
      title: "Bet placed successfully!",
      description: `You bet $${betAmount} that ${token.name} will ${selectedPrediction} within the hour.`,
    });
    
    // Reset form
    setBetAmount('');
    setSelectedPrediction(null);
  };
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
            <p className="text-dream-foreground/70">Loading token data...</p>
          </div>
        </main>
      </>
    );
  }
  
  if (!token) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center">
          <div className="glass-panel p-10 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Token Not Found</h2>
            <p className="text-dream-foreground/70 mb-6">We couldn't find the token you're looking for.</p>
            <Link to="/dashboard" className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Back button */}
        <Link to="/dashboard" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Dashboard</span>
        </Link>
        
        {/* Token Header */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10 mr-4">
                <span className="font-display font-bold text-lg">{token.symbol.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold">{token.name}</h1>
                <p className="text-dream-foreground/60">{token.symbol}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-2xl font-bold">${token.price.toLocaleString()}</div>
              <div className={`flex items-center ${
                token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {token.priceChange >= 0 ? 
                  <ArrowUp className="w-4 h-4 mr-1" /> : 
                  <ArrowDown className="w-4 h-4 mr-1" />
                }
                {Math.abs(token.priceChange).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Token Chart and Info */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-semibold">Price Chart</h2>
                <CountdownTimer endTime={endTime} />
              </div>
              <PriceChart />
            </div>
            
            <div className="glass-panel p-6">
              <h2 className="text-xl font-display font-semibold mb-4">About {token.name}</h2>
              <p className="text-dream-foreground/80 mb-6">{token.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4">
                  <p className="text-dream-foreground/60 text-sm">24h Volume</p>
                  <p className="text-lg font-semibold">${token.volume.toLocaleString()}</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-dream-foreground/60 text-sm">Market Cap</p>
                  <p className="text-lg font-semibold">${token.marketCap.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Prediction Form */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-display font-semibold mb-6">Make Your Prediction</h2>
            
            <div className="mb-6">
              <label className="block text-dream-foreground/80 mb-2">Your Prediction</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  className={`btn-moon ${selectedPrediction === 'moon' ? 'ring-2 ring-dream-accent1' : ''}`}
                  onClick={() => handlePredictionSelect('moon')}
                >
                  Moon 🚀
                </button>
                <button 
                  className={`btn-die ${selectedPrediction === 'die' ? 'ring-2 ring-dream-accent2' : ''}`}
                  onClick={() => handlePredictionSelect('die')}
                >
                  Die 💀
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="bet-amount" className="block text-dream-foreground/80 mb-2">Bet Amount</label>
              <div className="glass-panel flex items-center">
                <span className="pl-4 pr-2 text-dream-foreground/60">$</span>
                <input
                  id="bet-amount"
                  type="text"
                  placeholder="Enter amount"
                  className="w-full bg-transparent border-none outline-none px-2 py-3"
                  value={betAmount}
                  onChange={handleBetAmountChange}
                />
              </div>
            </div>
            
            <div className="mb-6 glass-panel p-4 text-dream-foreground/80 text-sm flex items-start">
              <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-dream-accent2" />
              <p>
                By placing a bet, you predict that {token.name} will {selectedPrediction === 'moon' ? 'increase' : selectedPrediction === 'die' ? 'decrease' : '...'} in value within the next hour.
              </p>
            </div>
            
            <button 
              className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white font-medium py-3 rounded-lg hover:shadow-neon transition-all duration-300"
              onClick={handleSubmitBet}
            >
              Place Bet
            </button>
            
            <div className="mt-6 text-center text-dream-foreground/60 text-sm">
              Countdown until result: <CountdownTimer endTime={endTime} />
            </div>
          </div>
        </div>
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

export default TokenDetail;
