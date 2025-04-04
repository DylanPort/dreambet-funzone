
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { toast } from 'sonner';

const CommunityPage = () => {
  const [message, setMessage] = useState('');
  const { publicKey, connected } = useWallet();
  const { messages, loading, error, postMessage } = useCommunityMessages();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error("Please connect your wallet to post a message");
      return;
    }
    
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    
    try {
      await postMessage(message);
      setMessage('');
      toast.success("Message posted successfully!");
    } catch (error) {
      console.error("Error posting message:", error);
      toast.error("Failed to post message. Please try again.");
    }
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };
  
  const truncateAddress = (address: string) => {
    return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  };
  
  return (
    <div className="min-h-screen bg-dream-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-display font-bold text-dream-foreground">Community Chat</h1>
            <p className="text-dream-foreground/70 mt-2">Connect with other members of the community</p>
          </div>
          
          {/* Message Form */}
          <Card className="p-6 bg-dream-background/30 border border-dream-foreground/10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={connected ? "What's on your mind?" : "Connect wallet to join the conversation"}
                  disabled={!connected}
                  className="w-full bg-dream-background/20 border border-dream-foreground/10 focus:border-dream-accent2/50 rounded-lg px-4 py-3 pr-12 min-h-24 placeholder:text-dream-foreground/30 focus:outline-none focus:ring-1 focus:ring-dream-accent2/50 transition-all resize-none"
                />
                <Button 
                  type="submit" 
                  disabled={!connected || !message.trim()}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
          
          {/* Messages List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-display font-bold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-dream-accent2" />
                Community Messages
              </h2>
              {loading && (
                <div className="text-sm text-dream-foreground/50 animate-pulse">
                  Loading messages...
                </div>
              )}
            </div>
            
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
                Error loading messages. Please try refreshing the page.
              </div>
            )}
            
            {!loading && messages.length === 0 ? (
              <div className="text-center py-12 text-dream-foreground/50">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg">No messages yet</p>
                <p className="text-sm mt-2">Be the first to start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <Card 
                    key={msg.id} 
                    className="p-4 bg-dream-background/20 border border-dream-foreground/10 hover:border-dream-foreground/20 transition-all"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center mr-2">
                          <User className="w-4 h-4 text-dream-foreground/70" />
                        </div>
                        <span className="font-medium">{msg.username || truncateAddress(msg.user_id)}</span>
                      </div>
                      <span className="text-dream-foreground/50 text-sm">{formatTimeAgo(msg.created_at)}</span>
                    </div>
                    <p className="text-dream-foreground/90 mt-1">{msg.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
