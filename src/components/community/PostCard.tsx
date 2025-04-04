
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Share2, Clock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';
import type { Post } from './CommunityFeed';

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
}

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  username?: string;
  avatar_url?: string;
};

const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { userProfile } = usePXBPoints();
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return formatDate(dateString).split(',')[0]; // Just return the date part
  };

  // Check if the current user has liked the post
  const checkLikeStatus = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userProfile.id)
        .eq('reaction_type', 'like')
        .maybeSingle();
        
      if (error) {
        console.error('Error checking like status:', error);
        return;
      }
      
      setLiked(!!data);
    } catch (error) {
      console.error('Error in checkLikeStatus:', error);
    }
  };

  // Toggle like status
  const toggleLike = async () => {
    if (!userProfile) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    try {
      if (liked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userProfile.id)
          .eq('reaction_type', 'like');
          
        if (error) {
          console.error('Error unliking post:', error);
          toast.error('Failed to unlike post');
          return;
        }
        
        // Update the likes count
        await supabase
          .from('posts')
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq('id', post.id);
          
        setLiked(false);
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: post.id,
            user_id: userProfile.id,
            reaction_type: 'like'
          });
          
        if (error) {
          console.error('Error liking post:', error);
          toast.error('Failed to like post');
          return;
        }
        
        // Update the likes count
        await supabase
          .from('posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', post.id);
          
        setLiked(true);
      }
      
      // Refresh the post to update like count
      onUpdate();
    } catch (error) {
      console.error('Error in toggleLike:', error);
    }
  };

  // Fetch comments for the post
  const fetchComments = async () => {
    if (!showComments) return;
    
    try {
      setLoadingComments(true);
      
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          users:user_id (username, avatar_url)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }
      
      // Transform the data
      const transformedComments = data.map(comment => ({
        ...comment,
        username: comment.users?.username,
        avatar_url: comment.users?.avatar_url
      }));
      
      setComments(transformedComments);
    } catch (error) {
      console.error('Error in fetchComments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit a new comment
  const submitComment = async () => {
    if (!userProfile) {
      toast.error('Please sign in to comment');
      return;
    }
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userProfile.id)
        .single();
      
      if (userError || !userData) {
        toast.error('User validation failed');
        return;
      }
      
      // Add the comment
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: userProfile.id,
          content: newComment
        });
        
      if (error) {
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
        return;
      }
      
      // Update the comments count
      await supabase
        .from('posts')
        .update({ comments_count: post.comments_count + 1 })
        .eq('id', post.id);
        
      // Clear the form
      setNewComment('');
      // Refresh comments
      fetchComments();
      // Refresh post to update comment count
      onUpdate();
      
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error in submitComment:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Share the post
  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.username || 'Anonymous'}`,
        text: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
        url: window.location.href + '?post=' + post.id
      })
      .then(() => toast.success('Shared successfully!'))
      .catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href + '?post=' + post.id)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  useEffect(() => {
    if (userProfile) {
      checkLikeStatus();
    }
  }, [userProfile, post.id]);

  useEffect(() => {
    fetchComments();
    
    // Set up real-time subscription for comments
    const commentsChannel = supabase
      .channel(`comments-for-post-${post.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'post_comments',
        filter: `post_id=eq.${post.id}`
      }, payload => {
        console.log('Comment change received:', payload);
        fetchComments(); // Refresh comments when changes occur
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [showComments, post.id]);

  return (
    <Card className="glass-panel overflow-hidden">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3 mb-3">
          <Avatar className="h-10 w-10 border border-dream-accent3/30">
            <AvatarImage src={post.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} alt={post.username || 'User'} />
            <AvatarFallback className="bg-dream-accent3/20">{(post.username || 'User').substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{post.username || 'Anonymous User'}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {timeAgo(post.created_at)}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="whitespace-pre-line">{post.content}</p>
        </div>
        
        {post.image_url && (
          <div className="mb-4 flex justify-center">
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="rounded-md max-h-96 w-auto object-contain"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-stretch pt-0">
        <div className="flex justify-between items-center border-t border-white/10 pt-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLike}
              className={`flex items-center ${liked ? 'text-dream-accent1' : 'text-muted-foreground'}`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {post.likes_count > 0 && <span>{post.likes_count}</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center text-muted-foreground"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {post.comments_count > 0 && <span>{post.comments_count}</span>}
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={sharePost}
            className="text-muted-foreground"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        
        {showComments && (
          <div className="mt-4 space-y-4 w-full">
            {userProfile && (
              <div className="flex space-x-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage 
                    src={userProfile.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} 
                    alt={userProfile.username || 'You'} 
                  />
                  <AvatarFallback className="bg-dream-accent2/20">
                    {(userProfile.username || 'You').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Textarea 
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] flex-1 bg-black/40 border-dream-accent2/20 focus:border-dream-accent1/60"
                  />
                  <Button 
                    onClick={submitComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="self-end bg-dream-accent2 hover:bg-dream-accent2/80 text-black h-9"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin h-4 w-4 border-2 border-black rounded-full border-t-transparent" />
                    ) : (
                      'Post'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {loadingComments ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin h-6 w-6 border-2 border-dream-accent1 rounded-full border-t-transparent"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex space-x-2 bg-black/20 p-3 rounded-md">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage 
                        src={comment.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} 
                        alt={comment.username || 'User'} 
                      />
                      <AvatarFallback className="bg-dream-accent3/20">
                        {(comment.username || 'User').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="font-medium">{comment.username || 'Anonymous User'}</div>
                        <div className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</div>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-line">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
