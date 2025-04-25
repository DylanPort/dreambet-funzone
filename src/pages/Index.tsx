
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Trophy, 
  Wallet, 
  Settings, 
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PriceChart from '@/components/PriceChart';
import TokenSearchBar from '@/components/TokenSearchBar';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#010714] flex w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <img 
              src="/lovable-uploads/95e1164d-b5b3-479e-ab29-37f83a9f9fae.png" 
              alt="Pump Bounty Logo" 
              className="w-40 h-auto"
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {[
                { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
                { icon: ArrowRightLeft, label: 'Trade', path: '/trade' },
                { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
                { icon: Wallet, label: 'Wallet', path: '/wallet' },
                { icon: Wrench, label: 'Utility', path: '/utility' },
                { icon: Settings, label: 'Settings', path: '/settings' },
              ].map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-[#00E6FD] hover:bg-[#1a2e44]/50 transition-colors"
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <TokenSearchBar />
            </div>
            <Button 
              className="ml-4 bg-[#0066FF] hover:bg-[#0052CC] text-white"
            >
              Connect Wallet
            </Button>
          </div>

          <div className="grid gap-6">
            {/* Token Info Panel */}
            <div className="bg-[#0A1018]/80 border border-[#1a2e44] rounded-xl p-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h2 className="text-4xl text-[#00E6FD] font-bold mb-2">POINTS</h2>
                  <div className="text-3xl text-white mb-4">$0.000000</div>
                  <div className="text-sm text-gray-400">Last updated: 21 48.52</div>
                  
                  <div className="grid grid-cols-2 gap-8 mt-8">
                    <div>
                      <div className="text-gray-400 mb-2">Market Cap</div>
                      <div className="text-xl text-white">$72.50</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-2">24h Volume</div>
                      <div className="text-xl text-white">N/A</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-2">Holders</div>
                      <div className="text-xl text-white">$72.50</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-2">Holdings</div>
                      <div className="text-xl text-white">N/A</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex gap-4 mb-6">
                    <Button variant="outline" className="text-[#00E6FD] border-[#1a2e44]">0.10k</Button>
                    <Button variant="outline" className="text-[#00E6FD] border-[#1a2e44]">1.00k</Button>
                    <Button variant="outline" className="text-[#00E6FD] border-[#1a2e44]">2.00</Button>
                  </div>
                  
                  <div className="text-right mb-4">
                    <span className="text-[#00E6FD]">Auto-refreshing</span>
                  </div>
                  
                  <div className="bg-[#0A1018] border border-[#1a2e44] rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="text-[#00E6FD]">Buys</div>
                      <div className="text-red-500">Sells</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-2xl text-[#00E6FD]">3</div>
                      <div className="text-2xl text-red-500">3</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#0A1018] border border-[#1a2e44] rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-[#00E6FD] border-b border-[#1a2e44] pb-2 mb-2">
                      <div>Time</div>
                      <div>Buy</div>
                      <div>Volume</div>
                    </div>
                    {[
                      { time: '0.10', buy: '0.10', volume: '0.10' },
                      { time: '0.10', buy: '0.10', volume: '0.00' },
                      { time: '0.10', buy: '0.10', volume: '0.00' },
                    ].map((row, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 text-white">
                        <div>{row.time}</div>
                        <div>{row.buy}</div>
                        <div>{row.volume}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart Panel */}
            <div className="bg-[#0A1018]/80 border border-[#1a2e44] rounded-xl p-6">
              <PriceChart tokenId="your-token-id" />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
