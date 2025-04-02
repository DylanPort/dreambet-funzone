
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MessageCircle, Send } from 'lucide-react';

interface TokenCommentsProps {
  tokenMint?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    wallet_address: string;
    username: string;
    avatar_url: string;
  };
}

const TokenComments: React.FC<TokenCommentsProps> = ({ tokenMint }) => {
  const { publicKey, connected } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenMint) return;
    
    const fetchComments = async () => {
      setLoading(true);
      try {
        // Use the comments table with bounty_id field to store token-related comments
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            author_id(id, wallet_address, username, avatar_url)
          `)
          .eq('bounty_id', tokenMint)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Transform the data to match our Comment interface
        const formattedComments = data.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author: {
            wallet_address: comment.author_id?.wallet_address || '',
            username: comment.author_id?.username || '',
            avatar_url: comment.author_id?.avatar_url || '',
          }
        }));
        
        setComments(formattedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
    
    // Set up real-time subscription for new comments
    const subscription = supabase
      .channel('comments-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments',
        filter: `bounty_id=eq.${tokenMint}`
      }, (payload) => {
        // Fetch the user data for the new comment
        const fetchNewComment = async () => {
          const { data, error } = await supabase
            .from('comments')
            .select(`
              id,
              content,
              created_at,
              author_id(id, wallet_address, username, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (!error && data) {
            const formattedComment = {
              id: data.id,
              content: data.content,
              created_at: data.created_at,
              author: {
                wallet_address: data.author_id?.wallet_address || '',
                username: data.author_id?.username || '',
                avatar_url: data.author_id?.avatar_url || '',
              }
            };
            setComments(prev => [formattedComment, ...prev]);
          }
        };
        
        fetchNewComment();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [tokenMint]);

  const handleSubmitComment = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet to comment');
      return;
    }
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    if (!tokenMint) {
      toast.error('Token information not available');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First check if the user has a profile already
      const walletAddress = publicKey.toString();
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (profileError) throw profileError;
      
      // If no profile found, create a new one
      let profileId = existingProfile?.id;
      
      if (!profileId) {
        // Need to create a new profile with a generated UUID
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            wallet_address: walletAddress,
            username: `user_${walletAddress.slice(0, 8)}`,
            first_sign_in: true
          })
          .select('id')
          .single();
          
        if (createProfileError) throw createProfileError;
        profileId = newProfile.id;
      }
      
      // Now create the comment
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          bounty_id: tokenMint,
          author_id: profileId,
          content: newComment.trim()
        });
        
      if (commentError) throw commentError;
      
      setNewComment('');
      toast.success('Comment posted successfully');
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!connected || isSubmitting}
          className="bg-black/30 border-dream-foreground/20 focus:border-dream-accent1 min-h-[100px]"
        />
        <div className="flex justify-between items-center">
          {!connected && (
            <p className="text-dream-foreground/60 text-sm">
              Connect your wallet to comment
            </p>
          )}
          <Button
            onClick={handleSubmitComment}
            disabled={!connected || isSubmitting || !newComment.trim()}
            className="ml-auto"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'} <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-dream-foreground/60">
            <MessageCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-dream-foreground/10 rounded-lg p-4 bg-black/30">
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <div className="bg-gradient-to-br from-dream-accent1 to-dream-accent2 h-full w-full flex items-center justify-center text-white font-bold">
                      {comment.author.username ? 
                        comment.author.username[0].toUpperCase() :
                        comment.author.wallet_address.slice(0, 2)
                      }
                    </div>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {comment.author.username || 
                       `${comment.author.wallet_address.slice(0, 4)}...${comment.author.wallet_address.slice(-4)}`}
                    </div>
                  </div>
                </div>
                <div className="text-dream-foreground/50 text-xs">
                  {formatDate(comment.created_at)}
                </div>
              </div>
              <div className="mt-2 text-dream-foreground/90 pl-10">
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TokenComments;
