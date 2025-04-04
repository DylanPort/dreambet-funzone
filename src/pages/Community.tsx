import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, User, Reply, ThumbsUp, ThumbsDown, Award } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { toast } from 'sonner';
import { CommunityMessage, CommunityReply } from '@/services/communityService';
import OnlineUsersSidebar from '@/components/OnlineUsersSidebar';
const CommunityPage = () => {
  const [message, setMessage] = useState('');
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});
  const {
    publicKey,
    connected
  } = useWallet();
  const {
    messages,
    messageReplies,
    messageReactions,
    topLikedMessages,
    loading,
    error,
    postMessage,
    loadRepliesForMessage,
    postReply,
    reactToMessage,
    fetchTopLiked
  } = useCommunityMessages();
  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll to bottom when new messages are added
    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
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
  const handleLoadReplies = async (messageId: string) => {
    try {
      if (!expandedReplies[messageId]) {
        const replies = await loadRepliesForMessage(messageId);
        if (replies.length > 0) {
          setExpandedReplies(prev => ({
            ...prev,
            [messageId]: true
          }));
        } else {
          toast.info("No replies yet. Be the first to reply!");
          setShowReplyInput(prev => ({
            ...prev,
            [messageId]: true
          }));
        }
      } else {
        setExpandedReplies(prev => ({
          ...prev,
          [messageId]: false
        }));
      }
    } catch (error) {
      console.error("Error loading replies:", error);
      toast.error("Failed to load replies. Please try again.");
    }
  };
  const handleReplyClick = (messageId: string) => {
    setShowReplyInput(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };
  const handleSubmitReply = async (messageId: string) => {
    if (!connected) {
      toast.error("Please connect your wallet to reply");
      return;
    }
    const content = replyContent[messageId];
    if (!content || !content.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    try {
      await postReply(messageId, content);
      setReplyContent(prev => ({
        ...prev,
        [messageId]: ''
      }));
      if (!expandedReplies[messageId]) {
        setExpandedReplies(prev => ({
          ...prev,
          [messageId]: true
        }));
      }
      toast.success("Reply posted successfully!");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply. Please try again.");
    }
  };
  const handleReaction = async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!connected) {
      toast.error("Please connect your wallet to like or dislike");
      return;
    }
    try {
      await reactToMessage(messageId, reactionType);
    } catch (error) {
      console.error("Error reacting to message:", error);
      toast.error("Failed to record your reaction. Please try again.");
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
  return <div className="min-h-screen bg-dream-background">
      <Navbar />
      
      <div className="flex max-w-7xl mx-auto pt-24 px-4 pb-20">
        {/* Online Users Sidebar */}
        <div className="hidden md:block w-72 mr-6 sticky top-24 self-start">
          <OnlineUsersSidebar />
          
          {/* Most Liked Messages Section */}
          <div className="mt-6 bg-dream-background/30 border border-dream-foreground/10 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              <h3 className="font-display font-bold text-lg">Most Liked Messages</h3>
            </div>
            
            {!topLikedMessages || topLikedMessages.length === 0 ? <p className="text-dream-foreground/50 text-sm text-center py-3">No liked messages yet</p> : <div className="space-y-3">
                {topLikedMessages.slice(0, 3).map(msg => <Card key={`liked-${msg.id}`} className="p-3 bg-dream-background/20 border border-dream-foreground/10 hover:border-dream-foreground/20 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center mr-2">
                          <User className="w-3 h-3 text-dream-foreground/70" />
                        </div>
                        <span className="text-sm font-medium">{msg.username || truncateAddress(msg.user_id)}</span>
                      </div>
                      <div className="flex items-center text-xs text-dream-foreground/50">
                        <ThumbsUp className="w-3 h-3 mr-1 text-green-500 fill-green-500" />
                        <span>{msg.likes_count || messageReactions[msg.id]?.likes || 0}</span>
                      </div>
                    </div>
                    <p className="text-sm text-dream-foreground/80 line-clamp-2 mt-1">
                      {msg.content}
                    </p>
                  </Card>)}
              </div>}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col space-y-8">
          {/* Header */}
          
          
          {/* Message Form */}
          <Card className="p-6 bg-dream-background/30 border border-dream-foreground/10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={connected ? "What's on your mind?" : "Connect wallet to join the conversation"} disabled={!connected} className="w-full bg-dream-background/20 border border-dream-foreground/10 focus:border-dream-accent2/50 rounded-lg px-4 py-3 pr-12 min-h-24 placeholder:text-dream-foreground/30 focus:outline-none focus:ring-1 focus:ring-dream-accent2/50 transition-all resize-none" />
                <Button type="submit" disabled={!connected || !message.trim()} className="absolute bottom-3 right-3 p-2 rounded-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90 text-white">
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
              {loading && <div className="text-sm text-dream-foreground/50 animate-pulse">
                  Loading messages...
                </div>}
            </div>
            
            {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
                Error loading messages. Please try refreshing the page.
              </div>}
            
            {!loading && messages.length === 0 ? <div className="text-center py-12 text-dream-foreground/50">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg">No messages yet</p>
                <p className="text-sm mt-2">Be the first to start the conversation!</p>
              </div> : <div className="space-y-4">
                {messages.map(msg => <Card key={msg.id} className="p-4 bg-dream-background/20 border border-dream-foreground/10 hover:border-dream-foreground/20 transition-all">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center mr-2">
                          <User className="w-4 h-4 text-dream-foreground/70" />
                        </div>
                        <span className="font-medium">{msg.username || truncateAddress(msg.user_id)}</span>
                      </div>
                      <span className="text-dream-foreground/50 text-sm">{formatTimeAgo(msg.created_at)}</span>
                    </div>
                    <p className="text-dream-foreground/90 mt-1 mb-3">{msg.content}</p>
                    
                    {/* Reaction buttons and counters */}
                    <div className="flex items-center justify-between mt-2 mb-1 text-dream-foreground/50">
                      <div className="flex items-center space-x-4">
                        {/* Like button */}
                        <Button variant="ghost" size="sm" onClick={() => handleReaction(msg.id, 'like')} className={`flex items-center text-xs px-2 py-1 h-auto group ${messageReactions[msg.id]?.userReaction === 'like' ? 'text-green-500' : ''}`} disabled={!connected}>
                          <ThumbsUp className={`w-4 h-4 mr-1 ${messageReactions[msg.id]?.userReaction === 'like' ? 'fill-green-500 text-green-500' : 'group-hover:text-green-400'}`} />
                          <span className={`font-medium ${messageReactions[msg.id]?.userReaction === 'like' ? 'text-green-500' : ''}`}>
                            {messageReactions[msg.id]?.likes || 0}
                          </span>
                        </Button>
                        
                        {/* Dislike button */}
                        <Button variant="ghost" size="sm" onClick={() => handleReaction(msg.id, 'dislike')} className={`flex items-center text-xs px-2 py-1 h-auto group ${messageReactions[msg.id]?.userReaction === 'dislike' ? 'text-red-500' : ''}`} disabled={!connected}>
                          <ThumbsDown className={`w-4 h-4 mr-1 ${messageReactions[msg.id]?.userReaction === 'dislike' ? 'fill-red-500 text-red-500' : 'group-hover:text-red-400'}`} />
                          <span className={`font-medium ${messageReactions[msg.id]?.userReaction === 'dislike' ? 'text-red-500' : ''}`}>
                            {messageReactions[msg.id]?.dislikes || 0}
                          </span>
                        </Button>
                        
                        {/* Reply button */}
                        <Button variant="ghost" size="sm" onClick={() => handleReplyClick(msg.id)} className="flex items-center text-xs px-2 py-1 h-auto group hover:text-dream-accent2">
                          <Reply className="w-4 h-4 mr-1 group-hover:text-dream-accent2" />
                          Reply
                        </Button>
                      </div>
                      
                      {/* Reply counter */}
                      {messageReplies[msg.id]?.length > 0 && <Button variant="ghost" size="sm" onClick={() => handleLoadReplies(msg.id)} className="flex items-center text-xs px-2 py-1 h-auto">
                          <span className="text-dream-accent2">
                            {messageReplies[msg.id].length} {messageReplies[msg.id].length === 1 ? 'reply' : 'replies'}
                          </span>
                        </Button>}
                    </div>
                    
                    {/* Reply input */}
                    {showReplyInput[msg.id] && <div className="mt-3 pl-4 border-l-2 border-dream-foreground/10">
                        <div className="relative">
                          <Textarea value={replyContent[msg.id] || ''} onChange={e => setReplyContent(prev => ({
                    ...prev,
                    [msg.id]: e.target.value
                  }))} placeholder={connected ? "Write a reply..." : "Connect wallet to reply"} disabled={!connected} className="w-full bg-dream-background/20 border border-dream-foreground/10 focus:border-dream-accent2/50 rounded-lg px-3 py-2 pr-10 min-h-16 text-sm placeholder:text-dream-foreground/30 focus:outline-none focus:ring-1 focus:ring-dream-accent2/50 transition-all resize-none" />
                          <Button onClick={() => handleSubmitReply(msg.id)} disabled={!connected || !replyContent[msg.id]?.trim()} className="absolute bottom-2 right-2 p-1 rounded-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90 text-white" size="sm">
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>}
                    
                    {/* Replies section */}
                    {expandedReplies[msg.id] && messageReplies[msg.id]?.length > 0 && <div className="mt-3 pl-4 border-l-2 border-dream-foreground/10 space-y-3">
                        {messageReplies[msg.id].map(reply => <div key={reply.id} className="pt-2">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center mr-2">
                                  <User className="w-3 h-3 text-dream-foreground/70" />
                                </div>
                                <span className="text-sm font-medium">{reply.username || truncateAddress(reply.user_id)}</span>
                              </div>
                              <span className="text-dream-foreground/50 text-xs">{formatTimeAgo(reply.created_at)}</span>
                            </div>
                            <p className="text-dream-foreground/80 text-sm ml-8">{reply.content}</p>
                          </div>)}
                      </div>}
                  </Card>)}
                <div ref={messageEndRef} />
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default CommunityPage;