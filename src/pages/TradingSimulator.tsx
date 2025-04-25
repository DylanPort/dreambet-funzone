
import React from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { Button } from '@/components/ui/button';
import { Home, ArrowRightLeft, Trophy, Wallet, Wrench, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import TokenSearchBar from '@/components/TokenSearchBar';
import { formatNumber } from '@/lib/utils';

const TradingSimulator = () => {
  const { rawTokens, isConnected } = usePumpPortal();
  
  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: ArrowRightLeft, label: 'Trade', path: '/simulator', active: true },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Wrench, label: 'Utility', path: '/utility' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#06070A] text-white flex">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Search Bar and Connect Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-[600px]">
            <TokenSearchBar />
          </div>
          <Button 
            className="bg-gradient-to-r from-[#0066FF] to-[#0098FF] text-white px-8 py-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            Connect Wallet
          </Button>
        </div>

        {/* Token Stats Panel */}
        <div className="border border-[#1a2e44] rounded-2xl bg-[#0A1018]/80 p-8 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-[#00E6FD] text-4xl mb-2">POINT$</h2>
              <h3 className="text-3xl font-bold">$0.000000</h3>
              <p className="text-gray-400 text-sm mt-2">Last updated: 21 48.52</p>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[#00E6FD] mb-2">Market Cap</h4>
                <p className="text-2xl">$72.50</p>
              </div>
              <div>
                <h4 className="text-[#00E6FD] mb-2">24h Volume</h4>
                <p className="text-2xl">N/A</p>
              </div>
              <div>
                <span className="text-[#00E6FD] px-4 py-1 rounded-full border border-[#00E6FD]/30">
                  Auto-refreshing
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[#00E6FD] mb-2">Holders</h4>
                <p className="text-2xl">$72.50</p>
              </div>
              <div>
                <h4 className="text-[#00E6FD] mb-2">Holders</h4>
                <p className="text-2xl">N/A</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[#00E6FD]">Recent Transaction</h4>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[#00E6FD]">Buys</p>
                    <p className="text-2xl">3</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#FF3B3B]">Sells</p>
                    <p className="text-2xl">3</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#0A1018] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Time</div>
                    <div className="font-medium">Buy</div>
                    <div className="font-medium">Volume</div>
                  </div>
                  <div className="text-right">
                    <div>0.10</div>
                    <div>0.10</div>
                    <div>0.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradingSimulator;
