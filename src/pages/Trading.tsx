import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { fetchTokenDataFromSolscan } from '@/services/solscanService';
import { toast } from 'sonner';

const Trading = () => {
  const navigate = useNavigate();
  const { userProfile } = usePXBPoints();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    const savedSearches = localStorage.getItem('recentTokenSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
      } catch (e) {
        console.error('Error parsing saved searches:', e);
      }
    }
  }, []);

  const saveSearch = (token: any) => {
    if (!token) return;
    
    const updatedSearches = [token, ...recentSearches.filter(t => t.address !== token.address)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentTokenSearches', JSON.stringify(updatedSearches));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a token address or name');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const tokenData = await fetchTokenDataFromSolscan(searchQuery.trim());
      
      if (tokenData) {
        navigate(`/trading/token/${tokenData.address}`);
        saveSearch(tokenData);
      } else {
        toast.error('Token not found. Please check the address and try again.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching for token');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const navigateToToken = (tokenAddress: string) => {
    navigate(`/trading/token/${tokenAddress}`);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Token Trading</h1>
        
        <Card className="bg-black/20 backdrop-blur-md border-gray-800">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-2" />
                  Search Tokens
                </TabsTrigger>
                <TabsTrigger value="recent">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Searches
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Enter token address or name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </form>
                
                <div className="mt-4">
                  {isSearching ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((token) => (
                        <div 
                          key={token.address}
                          className="p-3 rounded-md border border-gray-800 bg-gray-900 flex justify-between items-center cursor-pointer hover:bg-gray-800"
                          onClick={() => navigateToToken(token.address)}
                        >
                          <div className="flex gap-3 items-center">
                            {token.icon && (
                              <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full" />
                            )}
                            <div>
                              <div className="font-medium">{token.name}</div>
                              <div className="text-xs text-gray-400">{token.symbol}</div>
                            </div>
                          </div>
                          <div className="text-gray-400 text-sm">{token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      {searchQuery.trim() ? 'No results found' : 'Search for a token by address or name'}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="recent">
                {recentSearches.length > 0 ? (
                  <div className="space-y-2">
                    {recentSearches.map((token) => (
                      <div 
                        key={token.address}
                        className="p-3 rounded-md border border-gray-800 bg-gray-900 flex justify-between items-center cursor-pointer hover:bg-gray-800"
                        onClick={() => navigateToToken(token.address)}
                      >
                        <div className="flex gap-3 items-center">
                          {token.icon && (
                            <img src={token.icon} alt={token.name} className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <div className="font-medium">{token.name}</div>
                            <div className="text-xs text-gray-400">{token.symbol}</div>
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">{token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    No recent searches yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Trading Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-black/20 backdrop-blur-md border-gray-800 hover:border-gray-600 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center mb-2">
                    <ArrowUpRight className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Buy Tokens with PXB</h3>
                  <p className="text-sm text-gray-400">Use your PXB points to acquire tokens from various Solana projects</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/20 backdrop-blur-md border-gray-800 hover:border-gray-600 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-2">
                    <ArrowDownRight className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="font-semibold">Sell Tokens for PXB</h3>
                  <p className="text-sm text-gray-400">Convert your tokens back to PXB points whenever you want</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/20 backdrop-blur-md border-gray-800 hover:border-gray-600 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Track Your Portfolio</h3>
                  <p className="text-sm text-gray-400">Monitor performance of your token holdings in real-time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
