
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HeartIcon, MessageCircleIcon, Share2Icon, HeartFilledIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@supabase/auth-helpers-react';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  username?: string;
  avatar_url?: string;
}

interface PostCardProps {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  onLikeUpdate?: () => void;
}

const PostCard = ({
  id,
  userId,
  username,
  avatarUrl,
  content,
  imageUrl,
  createdAt,
  likesCount,
  commentsCount,
  onLikeUpdate
}: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
        
        // Check if user has liked this post
        if (data.user.id) {
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', id)
            .eq('user_id', data.user.id)
            .single();
          
          setIsLiked(!!likeData);
        }
      }
    };
    
    fetchCurrentUser();
  }, [id]);

  // Toggle comments visibility
  const toggleComments = async () => {
    const newVisibility = !showComments;
    setShowComments(newVisibility);
    
    if (newVisibility && comments.length === 0) {
      await fetchComments();
    }
  };

  // Fetch comments for this post
  const fetchComments = async () => {
    try {
      // Get comments for this post
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: false });
      
      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }
      
      // Fetch user details for each comment
      const commentsWithUserDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', comment.user_id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data for comment:', userError);
            return {
              ...comment,
              username: 'Unknown User',
              avatar_url: null
            };
          }
          
          return {
            ...comment,
            username: userData?.username || 'Unknown User',
            avatar_url: userData?.avatar_url
          };
        })
      );
      
      setComments(commentsWithUserDetails);
    } catch (error) {
      console.error('Error in fetchComments:', error);
      toast.error('Failed to load comments');
    }
  };

  // Handle like/unlike post
  const handleLikePost = async () => {
    if (!currentUserId) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    try {
      if (isLiked) {
        // Unlike post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
        
        setIsLiked(false);
        setLikes(prev => prev - 1);
      } else {
        // Like post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: id,
            user_id: currentUserId
          });
        
        if (error) throw error;
        
        setIsLiked(true);
        setLikes(prev => prev + 1);
      }
      
      // Call the optional callback to refresh parent component
      if (onLikeUpdate) {
        onLikeUpdate();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to process your like');
    }
  };

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    if (!currentUserId) {
      toast.error('Please sign in to comment');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add the comment to the comments table
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: currentUserId,
          content: newComment,
          likes_count: 0
        });
      
      if (error) throw error;
      
      // Fetch the current user data to display in the new comment
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', currentUserId)
        .single();
      
      if (userError) throw userError;
      
      // Update comments list with the new comment
      const newCommentObj: Comment = {
        id: crypto.randomUUID(), // This will be replaced when we refresh
        post_id: id,
        user_id: currentUserId,
        content: newComment,
        created_at: new Date().toISOString(),
        likes_count: 0,
        username: userData?.username || 'Unknown User',
        avatar_url: userData?.avatar_url
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      
      // Increment comments count in the UI
      // Note: The actual count in the database is updated by a trigger
      
      // Refresh comments to get the accurate data
      fetchComments();
      
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel mb-6">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-10 w-10 border border-dream-accent2/30">
          <AvatarImage src={avatarUrl || `/placeholder.svg`} alt={username} />
          <AvatarFallback>{username?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-dream-foreground">{username}</h3>
          <p className="text-xs text-dream-muted">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4">
        <p className="text-dream-foreground mb-4">{content}</p>
        
        {imageUrl && (
          <div className="w-full rounded-md overflow-hidden mt-4">
            <img 
              src={imageUrl} 
              alt="Post image" 
              className="w-full h-auto object-cover max-h-[400px]" 
            />
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-dream-muted mt-4">
          <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
          <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
        </div>
      </CardContent>
      
      <Separator className="bg-dream-accent2/10" />
      
      <CardFooter className="py-3 px-6 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center ${isLiked ? 'text-dream-accent1' : 'text-dream-muted'}`}
          onClick={handleLikePost}
        >
          {isLiked ? (
            <HeartIcon className="mr-1 h-5 w-5 fill-dream-accent1 text-dream-accent1" />
          ) : (
            <HeartIcon className="mr-1 h-5 w-5" />
          )}
          Like
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-dream-muted"
          onClick={toggleComments}
        >
          <MessageCircleIcon className="mr-1 h-5 w-5" />
          Comment
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center text-dream-muted"
        >
          <Share2Icon className="mr-1 h-5 w-5" />
          Share
        </Button>
      </CardFooter>
      
      {showComments && (
        <div className="px-6 pb-4">
          <Separator className="bg-dream-accent2/10 mb-4" />
          
          <div className="flex gap-4 mb-4">
            <Avatar className="h-8 w-8 border border-dream-accent2/30">
              <AvatarImage src={avatarUrl || `/placeholder.svg`} alt="Your avatar" />
              <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea 
                placeholder="Write a comment..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-black/30 border-dream-accent2/20 focus:border-dream-accent1/60 min-h-[80px]"
              />
              
              <div className="flex justify-end mt-2">
                <Button 
                  size="sm" 
                  className="bg-dream-accent1 hover:bg-dream-accent1/80"
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
          
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 border border-dream-accent2/30">
                    <AvatarImage src={comment.avatar_url || `/placeholder.svg`} alt={comment.username} />
                    <AvatarFallback>{comment.username?.substring(0, 2).toUpperCase() || 'UN'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="bg-black/20 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-dream-foreground">{comment.username}</h4>
                        <span className="text-xs text-dream-muted">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-dream-foreground">{comment.content}</p>
                    </div>
                    
                    <div className="flex gap-4 ml-2 mt-1 text-xs text-dream-muted">
                      <button className="hover:text-dream-accent1 transition-colors">Like</button>
                      <button className="hover:text-dream-accent1 transition-colors">Reply</button>
                      <span>{comment.likes_count} {comment.likes_count === 1 ? 'like' : 'likes'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-dream-muted text-sm py-4">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </Card>
  );
};

export default PostCard;
