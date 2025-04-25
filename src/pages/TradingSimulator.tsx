import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { Button } from '@/components/ui/button';
import { Home, ArrowRightLeft, Trophy, Wallet, Wrench, Settings, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import TokenSearchBar from '@/components/TokenSearchBar';
import BetReel from '@/components/BetReel';
import PriceChart from '@/components/PriceChart';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';
import TokenTransactions from '@/components/TokenTransactions';

const DEFAULT_TOKEN = "FZLJm7M2vmHuuEqtRu96xLXP9NrHyhZYebbQBdqqpump";

const TradingSimulator = () => {
  const [selectedToken, setSelectedToken] = useState(DEFAULT_TOKEN);
  const { rawTokens, isConnected } = usePumpPortal();
  
  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: ArrowRightLeft, label: 'Trade', path: '/simulator', active: true },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Wrench, label: 'Utility', path: '/utility' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleTokenSelect = (tokenId: string) => {
    setSelectedToken(tokenId);
  };

  return (
    <div className="min-h-screen bg-[#06070A] text-white flex">
      <aside className="w-64 border-r border-[#1a2e44]/20 p-6 space-y-8">
        <div className="mb-12">
          <img src="/lovable-uploads/13bfd45f-c74b-4847-999c-1ef46fac0bff.png" alt="Logo" className="w-32" />
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                item.active 
                  ? 'bg-[#0A1018] text-[#00E6FD] border border-[#1a2e44]' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#0A1018]/50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <BetReel />
        
        <div className="flex items-center justify-between mb-8">
          <div className="w-[600px]">
            <TokenSearchBar onTokenSelect={handleTokenSelect} />
          </div>
          <Button 
            className="bg-gradient-to-r from-[#0066FF] to-[#0098FF] text-white px-8 py-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            Connect Wallet
          </Button>
        </div>

        <div className="border border-[#1a2e44] rounded-2xl bg-[#0A1018]/80 p-8 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[#00E6FD] text-4xl mb-2">
                  {rawTokens.find(t => t.mint === selectedToken)?.name || 'Loading...'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {rawTokens.find(t => t.mint === selectedToken)?.symbol || ''}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedToken);
                      toast.success("Token address copied to clipboard");
                    }}
                    className="text-xs text-[#00E6FD] hover:text-[#00E6FD]/80 flex items-center"
                  >
                    {selectedToken.substring(0, 4)}...{selectedToken.substring(selectedToken.length - 4)}
                    <Copy className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <TokenMarketCap tokenId={selectedToken} />
              <TokenVolume tokenId={selectedToken} />
            </div>

            <div className="h-[400px] w-full mb-8">
              <PriceChart 
                tokenId={selectedToken}
                isLoading={false}
              />
            </div>

            <div className="mt-8">
              <TokenTransactions tokenId={selectedToken} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradingSimulator;
