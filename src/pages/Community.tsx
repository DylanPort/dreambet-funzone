
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User, Heart, Reply, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { toast } from 'sonner';

const CommunityPage = () => {
  const [message, setMessage] = useState('');
  const { publicKey, connected } = useWallet();
  const { messages, loading, error, postMessage, postReply, toggleLike } = useCommunityMessages();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
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

  const handleReplySubmit = async (messageId: string) => {
    if (!connected) {
      toast.error("Please connect your wallet to reply");
      return;
    }
    
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    
    try {
      await postReply(messageId, replyContent);
      setReplyContent('');
      setReplyingTo(null);
      toast.success("Reply posted successfully!");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply. Please try again.");
    }
  };

  const handleLike = async (messageId: string) => {
    if (!connected) {
      toast.error("Please connect your wallet to like messages");
      return;
    }
    
    try {
      await toggleLike(messageId);
    } catch (error) {
      console.error("Error liking message:", error);
      toast.error("Failed to like message. Please try again.");
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
                    
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dream-foreground/5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center text-dream-foreground/60 hover:text-dream-accent2"
                        onClick={() => handleLike(msg.id)}
                        disabled={!connected}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        <span>{msg.likes_count || 0}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center text-dream-foreground/60 hover:text-dream-accent2"
                        onClick={() => setReplyingTo(replyingTo === msg.id ? null : msg.id)}
                        disabled={!connected}
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        <span>Reply</span>
                      </Button>
                    </div>
                    
                    {/* Reply form */}
                    {replyingTo === msg.id && (
                      <div className="mt-3 pl-4 border-l-2 border-dream-foreground/10">
                        <div className="flex gap-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-dream-background/20 border border-dream-foreground/10 focus:border-dream-accent2/50 rounded-lg px-3 py-2 min-h-20 placeholder:text-dream-foreground/30 focus:outline-none focus:ring-1 focus:ring-dream-accent2/50 transition-all resize-none"
                          />
                          <Button
                            onClick={() => handleReplySubmit(msg.id)}
                            disabled={!replyContent.trim()}
                            className="self-end bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90 text-white"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Replies */}
                    {msg.replies && msg.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-dream-foreground/10 space-y-3">
                        <div className="text-xs text-dream-foreground/50 font-medium uppercase">
                          Replies
                        </div>
                        {msg.replies.map((reply) => (
                          <div key={reply.id} className="bg-dream-background/10 rounded-lg p-3">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center mr-2">
                                  <User className="w-3 h-3 text-dream-foreground/70" />
                                </div>
                                <span className="font-medium text-sm">{reply.username || truncateAddress(reply.user_id)}</span>
                              </div>
                              <span className="text-dream-foreground/50 text-xs">{formatTimeAgo(reply.created_at)}</span>
                            </div>
                            <p className="text-dream-foreground/80 text-sm ml-8">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
