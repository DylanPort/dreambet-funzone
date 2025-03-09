
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, User, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for comments
const MOCK_COMMENTS = [
  {
    id: '1',
    author: '3jLk...7Ujq',
    content: 'This token is about to explode! 🚀',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    votes: 5
  },
  {
    id: '2',
    author: 'xR4t...9Pzv',
    content: 'I'm betting big on migration, the team is solid.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    votes: 3
  },
  {
    id: '3',
    author: 'q7Yz...2Wsd',
    content: 'Looks like a classic rug pattern to me.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    votes: -2
  }
];

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  votes: number;
}

interface TokenCommentsProps {
  tokenId: string;
  tokenName: string;
}

const TokenComments: React.FC<TokenCommentsProps> = ({ tokenId, tokenName }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  
  useEffect(() => {
    loadComments();
  }, [tokenId]);
  
  const loadComments = () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setComments(MOCK_COMMENTS);
      setLoading(false);
    }, 500);
  };
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to add a comment",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Mock adding a comment
    const userAddress = publicKey ? publicKey.toString() : 'Anonymous';
    const shortenedAddress = userAddress.slice(0, 4) + '...' + userAddress.slice(-4);
    
    const newCommentObj = {
      id: Date.now().toString(),
      author: shortenedAddress,
      content: newComment,
      timestamp: new Date().toISOString(),
      votes: 0
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment('');
    
    toast({
      title: "Comment added",
      description: "Your comment has been added to the discussion",
    });
  };
  
  const handleVote = (id: string, direction: 'up' | 'down') => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }
    
    setComments(comments.map(comment => {
      if (comment.id === id) {
        return {
          ...comment,
          votes: comment.votes + (direction === 'up' ? 1 : -1)
        };
      }
      return comment;
    }));
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-dream-accent2" />
          <h2 className="text-xl font-display font-bold">Community Discussion</h2>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadComments}
          disabled={loading}
          className="text-dream-foreground/70 hover:text-dream-foreground"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={connected ? `Share your thoughts on ${tokenName}...` : "Connect wallet to comment"}
            disabled={!connected}
            className="w-full bg-dream-background/30 border border-dream-foreground/10 focus:border-dream-accent2/50 rounded-lg px-4 py-3 pr-12 min-h-24 placeholder:text-dream-foreground/30 focus:outline-none focus:ring-1 focus:ring-dream-accent2/50 transition-all"
          />
          <Button 
            type="submit" 
            disabled={!connected || !newComment.trim()}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-dream-foreground/50">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div 
              key={comment.id} 
              className="bg-dream-background/30 border border-dream-foreground/10 rounded-lg p-4 animate-fade-in transform transition-all hover:scale-[1.01] hover:border-dream-foreground/20"
            >
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/30 to-dream-accent2/30 flex items-center justify-center mr-2">
                    <User className="w-4 h-4 text-dream-foreground/70" />
                  </div>
                  <span className="font-medium">{comment.author}</span>
                </div>
                <span className="text-dream-foreground/50 text-sm">{formatTimeAgo(comment.timestamp)}</span>
              </div>
              
              <p className="mb-3 text-dream-foreground/90">{comment.content}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleVote(comment.id, 'up')}
                    className="p-1 rounded-full hover:bg-dream-accent2/10 text-dream-foreground/50 hover:text-dream-accent2 transition-colors"
                    disabled={!connected}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 19-7-7 7-7"></path>
                      <path d="M5 12h14"></path>
                    </svg>
                  </button>
                  
                  <span className={`font-medium ${
                    comment.votes > 0 ? 'text-green-400' : 
                    comment.votes < 0 ? 'text-red-400' : 
                    'text-dream-foreground/50'
                  }`}>
                    {comment.votes}
                  </span>
                  
                  <button 
                    onClick={() => handleVote(comment.id, 'down')}
                    className="p-1 rounded-full hover:bg-dream-accent3/10 text-dream-foreground/50 hover:text-dream-accent3 transition-colors"
                    disabled={!connected}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
                      <path d="m12 19-7-7 7-7"></path>
                      <path d="M5 12h14"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="relative group">
                  <button className="text-dream-foreground/30 hover:text-dream-foreground/70 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-dream-accent2/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TokenComments;
