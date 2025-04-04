
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

interface Comment {
  id: string;
  bounty_id: string; // This is actually the post_id
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    username: string | null;
    wallet_address: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  has_liked?: boolean;
}

interface PostCommentsProps {
  postId: string;
}

export const PostComments: React.FC<PostCommentsProps> = ({ postId }) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: authenticatedUser } = await supabase.auth.getSession();
      const userId = authenticatedUser.session?.user?.id;
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users(
            username,
            wallet_address,
            avatar_url
          )
        `)
        .eq('bounty_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Cast to the expected Comment[] type
      let commentsWithLikes = [...((data as unknown) as Comment[])];
      
      if (userId) {
        // Get likes for each comment
        for (let comment of commentsWithLikes) {
          // Check if user liked this comment
          const { data: likeData } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', userId)
            .maybeSingle();
          
          // Count total likes for this comment
          const { count } = await supabase
            .from('comment_likes')
            .select('id', { count: 'exact', head: true })
            .eq('comment_id', comment.id);
          
          comment.has_liked = !!likeData;
          comment.likes_count = count || 0;
        }
      }
      
      return commentsWithLikes;
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You need to be logged in to comment');
        return;
      }
      
      const userId = session.user.id;
      
      // Add comment
      await supabase
        .from('comments')
        .insert({
          bounty_id: postId, // using bounty_id for post_id because of the table structure
          author_id: userId,
          content: newComment.trim()
        });
      
      // Call the SQL function via RPC
      await supabase
        .rpc('increment_post_comments', { post_id: postId });
      
      setNewComment("");
      toast.success('Comment added successfully');
      refetch();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLikeComment = async (commentId: string, hasLiked: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You need to be logged in to like comments');
        return;
      }
      
      const userId = session.user.id;
      
      if (hasLiked) {
        // Unlike the comment
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);
      } else {
        // Like the comment
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: userId });
      }
      
      refetch();
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }
  
  if (error) {
    return <div className="text-red-400 py-4">Error loading comments</div>;
  }
  
  return (
    <div>
      <h4 className="font-medium mb-4">Comments {comments?.length ? `(${comments.length})` : ''}</h4>
      
      <form onSubmit={handleSubmitComment} className="mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="bg-white/5 border-white/10 focus-visible:ring-dream-accent1/40 mb-2 h-20"
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
            className="bg-dream-accent1 hover:bg-dream-accent1/90"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
      
      <div className="space-y-4">
        {comments?.length === 0 ? (
          <div className="text-center py-4 text-white/60">No comments yet. Be the first to comment!</div>
        ) : (
          comments?.map(comment => (
            <div key={comment.id} className="border-b border-white/10 pb-4 last:border-0">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 border border-dream-accent1/30">
                  <AvatarImage src={comment.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-dream-accent3/20 text-dream-accent3 text-xs">
                    {comment.author?.username ? comment.author.username.substring(0, 2).toUpperCase() 
                      : comment.author?.wallet_address.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {comment.author?.username || comment.author?.wallet_address.slice(0, 6) + '...' + comment.author?.wallet_address.slice(-4)}
                    </div>
                    <div className="text-xs text-white/40">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="mt-1 text-sm text-white/90">{comment.content}</div>
                  
                  {comment.likes_count !== undefined && (
                    <button 
                      onClick={() => comment.has_liked !== undefined && handleLikeComment(comment.id, comment.has_liked)}
                      className={`mt-2 flex items-center gap-1 text-xs ${comment.has_liked ? 'text-dream-accent2' : 'text-white/60 hover:text-white'}`}
                    >
                      <Heart className={`h-3 w-3 ${comment.has_liked ? 'fill-dream-accent2' : ''}`} />
                      <span>{comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
