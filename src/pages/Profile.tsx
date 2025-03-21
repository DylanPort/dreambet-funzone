import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import WalletConnectButton from '@/components/WalletConnectButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bet } from '@/types/bet';
import { useWalletBets } from '@/hooks/useWalletBets';
import { fetchUserBets } from '@/services/supabaseService';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import PXBPointsBalance from '@/components/PXBPointsBalance';
import { updateUsername } from '@/services/userService';
import { Badge } from '@/components/ui/badge';
import { Coins, Loader2, Trophy, Clock, Check, X, Send, ArrowUpDown, Sparkles, Orbit, Copy, User, Pencil } from 'lucide-react';
import PXBWallet from '@/components/PXBWallet';
import { PXBBet } from '@/types/pxb';
import Navbar from '@/components/Navbar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface CombinedBet {
  betType: 'PXB' | 'SOL';
  id: string;
  tokenId: string;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  initiator: string;
  amount: number;
  prediction: string;
  timestamp: number;
  expiresAt: number;
  status: string;
  duration: number;
  onChainBetId?: string;
  transactionSignature?: string;
  currentMarketCap?: number;
}

const ProfilePage = () => {
  const {
    publicKey,
    connected
  } = useWallet();
  const [username, setUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const {
    bets: walletBets,
    isLoading: isLoadingWalletBets,
    loadBets
  } = useWalletBets();
  const [combinedBets, setCombinedBets] = useState<CombinedBet[]>([]);
  const [isLoadingAllBets, setIsLoadingAllBets] = useState(true);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [pxbIdCopied, setPxbIdCopied] = useState(false);
  const [displayedPxbId, setDisplayedPxbId] = useState<string>('');
  const {
    userProfile,
    bets: pxbBets,
    fetchUserProfile,
    fetchUserBets,
    generatePxbId
  } = usePXBPoints();

  const loadDetailedBets = async () => {
    setIsLoadingAllBets(true);
    try {
      if (publicKey) {
        await loadBets();
      }
      if (userProfile) {
        await fetchUserBets();
      }
    } catch (error) {
      console.error("Error loading bets:", error);
      toast.error("Failed to load all bets");
    } finally {
      setIsLoadingAllBets(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
      loadDetailedBets();
    }
  }, [connected, publicKey, userProfile?.id]);

  useEffect(() => {
    if (userProfile?.username) {
      setUsername(userProfile.username);
    } else if (publicKey) {
      setUsername(publicKey.toString().substring(0, 8));
    }
    if (userProfile?.id) {
      setDisplayedPxbId(userProfile.id);
    }
  }, [userProfile, publicKey]);

  useEffect(() => {
    if (walletBets && pxbBets) {
      const solBets = walletBets.map(bet => ({
        ...bet,
        betType: 'SOL' as const
      }));
      const formattedPxbBets = pxbBets.map(bet => ({
        ...bet,
        betType: 'PXB' as const,
        id: bet.id,
        tokenId: bet.tokenMint,
        tokenMint: bet.tokenMint,
        tokenSymbol: bet.tokenSymbol,
        tokenName: bet.tokenName,
        initiator: bet.userId,
        amount: bet.betAmount,
        prediction: bet.betType === 'up' ? 'migrate' : 'die',
        timestamp: new Date(bet.createdAt).getTime(),
        expiresAt: new Date(bet.expiresAt).getTime(),
        status: bet.status === 'pending' ? 'open' : bet.status === 'won' ? 'completed' : bet.status === 'lost' ? 'expired' : 'open',
        duration: 30,
        onChainBetId: `pxb-${bet.id}`,
        transactionSignature: `pxb-tx-${bet.id}`
      }));
      const combined = [...solBets, ...formattedPxbBets].sort((a, b) => b.timestamp - a.timestamp);
      setCombinedBets(combined);
    }
  }, [walletBets, pxbBets]);

  const handleOpenUsernameDialog = () => {
    setIsUsernameDialogOpen(true);
  };

  const handleCloseUsernameDialog = () => {
    setIsUsernameDialogOpen(false);
  };

  const handleUpdateUsernameSubmit = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    setIsUpdatingUsername(true);
    try {
      const walletAddress = publicKey.toString();
      const success = await updateUsername(walletAddress, username);
      if (success) {
        toast.success("Username updated successfully");
        await fetchUserProfile();
        handleCloseUsernameDialog();
      }
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleGeneratePxbId = async () => {
    if (!generatePxbId || !publicKey) return;
    setIsGeneratingId(true);
    try {
      const id = generatePxbId();
      setDisplayedPxbId(id);
      navigator.clipboard.writeText(id);
      setPxbIdCopied(true);
      setTimeout(() => setPxbIdCopied(false), 2000);
      toast.success("Your permanent PXB ID has been generated and copied to clipboard!");
      await fetchUserProfile();
    } catch (error) {
      console.error("Error generating PXB ID:", error);
      toast.error("Failed to generate PXB ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

  const handleCopyPxbId = () => {
    if (!displayedPxbId) return;
    navigator.clipboard.writeText(displayedPxbId);
    setPxbIdCopied(true);
    toast.success("PXB ID copied to clipboard!");
    setTimeout(() => setPxbIdCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, prediction: string) => {
    if (status === 'completed') {
      return <Badge className="bg-green-500/80 hover:bg-green-500">
          <Check className="w-3 h-3 mr-1" /> Won
        </Badge>;
    } else if (status === 'expired' || status === 'lost') {
      return <Badge variant="destructive">
          <X className="w-3 h-3 mr-1" /> Lost
        </Badge>;
    } else if (status === 'open' || status === 'pending') {
      return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
    } else {
      return <Badge variant="secondary">
          {status}
        </Badge>;
    }
  };

  const getBadgeForBetType = (betType: 'PXB' | 'SOL') => {
    if (betType === 'PXB') {
      return <Badge className="bg-purple-500/80 hover:bg-purple-500">
          <Coins className="w-3 h-3 mr-1" /> PXB
        </Badge>;
    } else {
      return <Badge className="bg-blue-500/80 hover:bg-blue-500">
          SOL
        </Badge>;
    }
  };

  return <>
      <Navbar />
      <div className="container mx-auto py-8 px-4 my-[99px]">
        {!connected && <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect your wallet to view your profile</h2>
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>
          </div>}

        {connected && <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1">
                <Card className="glass-panel border-dream-accent2/20">
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wallet">Wallet Address</Label>
                      <div className="px-3 py-2 bg-dream-background/40 border border-dream-accent1/10 rounded-md flex items-center">
                        <span className="text-sm font-mono text-dream-foreground/70 truncate">
                          {publicKey?.toString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="username">Username</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleOpenUsernameDialog} 
                          className="h-8 w-8 p-0 text-dream-foreground/50 hover:text-dream-foreground/90 hover:bg-dream-accent1/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="px-3 py-2 bg-dream-background/40 border border-dream-accent1/10 rounded-md flex items-center group hover:border-dream-accent1/30 transition-all">
                        <User className="h-4 w-4 mr-2 text-dream-foreground/50 group-hover:text-dream-foreground/70" />
                        <span className="text-sm text-dream-foreground/90 font-medium">
                          {username || "Set your username"}
                        </span>
                      </div>
                    </div>
                    
                    <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Your Username</DialogTitle>
                          <DialogDescription>
                            Choose a unique username that others will recognize you by.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="username-input">Username</Label>
                              <Input
                                id="username-input"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleCloseUsernameDialog}>Cancel</Button>
                          <Button 
                            onClick={handleUpdateUsernameSubmit} 
                            disabled={isUpdatingUsername || !username.trim()}
                          >
                            {isUpdatingUsername ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                            ) : (
                              <>Save</>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pxb-id">PXB ID</Label>
                      {!displayedPxbId ? <Button onClick={handleGeneratePxbId} disabled={isGeneratingId || !generatePxbId} className="w-full bg-gradient-to-r from-[#6E59A5] to-[#8B5CF6] hover:from-[#7E69AB] hover:to-[#9B87F5] text-white border-none relative overflow-hidden group">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-40 h-40 rounded-full bg-white/10 absolute animate-ping opacity-0 group-hover:opacity-30 duration-1000" />
                            <div className="w-32 h-32 rounded-full bg-white/20 absolute animate-ping opacity-0 group-hover:opacity-30 delay-100 duration-1000" />
                            <div className="w-24 h-24 rounded-full bg-white/30 absolute animate-ping opacity-0 group-hover:opacity-30 delay-200 duration-1000" />
                          </div>
                          
                          {isGeneratingId ? <div className="flex items-center justify-center relative z-10">
                              <Orbit className="h-5 w-5 mr-2 animate-spin" />
                              <span>Generating...</span>
                            </div> : <div className="flex items-center justify-center relative z-10">
                              <Sparkles className="h-5 w-5 mr-2" />
                              <span>Generate PXB ID</span>
                            </div>}
                        </Button> : <div className="bg-dream-background/40 border border-dream-accent1/10 rounded-md p-2 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                          <div className="flex-1">
                            <span className="text-sm font-mono text-dream-foreground/90 truncate block">
                              {displayedPxbId}
                            </span>
                            <p className="text-xs text-dream-foreground/50 mt-1">Your permanent ID for receiving PXB points</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-dream-foreground/50 hover:text-dream-foreground/90 hover:bg-purple-500/10" onClick={handleCopyPxbId}>
                            {pxbIdCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <PXBPointsBalance />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <div className="space-y-6">
                  <PXBWallet userProfile={userProfile} />
                  
                  <Card className="glass-panel border-dream-accent2/20">
                    <CardHeader>
                      <CardTitle>Betting Stats</CardTitle>
                      <CardDescription>Your betting performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-dream-background/40 p-4 rounded-lg border border-dream-accent1/10">
                          <p className="text-dream-foreground/60 text-sm">Total Bets</p>
                          <p className="text-2xl font-bold">{combinedBets.length}</p>
                        </div>
                        <div className="bg-dream-background/40 p-4 rounded-lg border border-dream-accent1/10">
                          <p className="text-dream-foreground/60 text-sm">Win Rate</p>
                          <p className="text-2xl font-bold">
                            {combinedBets.length > 0 ? Math.round(combinedBets.filter(bet => bet.status === 'completed').length / combinedBets.length * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-dream-background/40 p-4 rounded-lg border border-dream-accent1/10">
                          <p className="text-dream-foreground/60 text-sm">PXB Points</p>
                          <p className="text-2xl font-bold">{userProfile?.pxbPoints || 0}</p>
                        </div>
                        <div className="bg-dream-background/40 p-4 rounded-lg border border-dream-accent1/10">
                          <p className="text-dream-foreground/60 text-sm">Ranking</p>
                          <div className="flex items-center">
                            <Trophy className="h-5 w-5 mr-1 text-yellow-500" />
                            <p className="text-2xl font-bold">#12</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            <Card className="glass-panel border-dream-accent2/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Bets</CardTitle>
                    <CardDescription>History of your token bets</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadDetailedBets} disabled={isLoadingAllBets}>
                    {isLoadingAllBets ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpDown className="h-4 w-4 mr-2" />}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <BetsTable bets={combinedBets} isLoading={isLoadingAllBets} formatDate={formatDate} getStatusBadge={getStatusBadge} getBadgeForBetType={getBadgeForBetType} />
                  </TabsContent>
                  
                  <TabsContent value="active">
                    <BetsTable bets={combinedBets.filter(bet => bet.status === 'open' || bet.status === 'pending')} isLoading={isLoadingAllBets} formatDate={formatDate} getStatusBadge={getStatusBadge} getBadgeForBetType={getBadgeForBetType} />
                  </TabsContent>
                  
                  <TabsContent value="completed">
                    <BetsTable bets={combinedBets.filter(bet => bet.status === 'completed' || bet.status === 'expired' || bet.status === 'lost')} isLoading={isLoadingAllBets} formatDate={formatDate} getStatusBadge={getStatusBadge} getBadgeForBetType={getBadgeForBetType} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>}
      </div>
    </>;
};

interface BetsTableProps {
  bets: CombinedBet[];
  isLoading: boolean;
  formatDate: (timestamp: number) => string;
  getStatusBadge: (status: string, prediction: string) => React.ReactNode;
  getBadgeForBetType: (betType: 'PXB' | 'SOL') => React.ReactNode;
}

const BetsTable: React.FC<BetsTableProps> = ({
  bets,
  isLoading,
  formatDate,
  getStatusBadge,
  getBadgeForBetType
}) => {
  if (isLoading) {
    return <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-dream-accent1" />
        <span className="ml-3 text-dream-foreground/70">Loading bets...</span>
      </div>;
  }
  if (bets.length === 0) {
    return <div className="text-center py-8">
        <p className="text-dream-foreground/70">No bets found</p>
      </div>;
  }
  return <div className="rounded-md border border-dream-accent1/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map(bet => <TableRow key={`${bet.betType}-${bet.id}`}>
              <TableCell>{getBadgeForBetType(bet.betType)}</TableCell>
              <TableCell className="font-medium">{bet.tokenSymbol}</TableCell>
              <TableCell>
                <Badge variant={bet.prediction === 'migrate' || bet.prediction === 'up' ? "default" : "destructive"} className="capitalize">
                  {bet.prediction === 'migrate' || bet.prediction === 'up' ? 'Up' : 'Down'}
                </Badge>
              </TableCell>
              <TableCell>{bet.amount} {bet.betType}</TableCell>
              <TableCell>{formatDate(bet.timestamp)}</TableCell>
              <TableCell>{getStatusBadge(bet.status, bet.prediction)}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};

export default ProfilePage;
