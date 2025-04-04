
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageSquare, Send, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Post, Comment } from '@/types/pxb';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface PostCardProps {
  post: Post;
  onInteraction: () => void;
}

const PostCard = ({ post, onInteraction }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [viewCount, setViewCount] = useState(post.views_count || 0);
  const { userProfile } = usePXBPoints();

  // Record a view when the post is rendered
  useEffect(() => {
    const recordView = async () => {
      try {
        // Update view count in the database
        await supabase
          .from('posts')
          .update({ views_count: (post.views_count || 0) + 1 })
          .eq('id', post.id);
        
        // Update local state
        setViewCount(prev => prev + 1);
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };
    
    recordView();
  }, [post.id, post.views_count]);

  // Check if the user has liked this post
  useEffect(() => {
    if (!userProfile) return;
    
    const checkIfLiked = async () => {
      try {
        const { data, error } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userProfile.id)
          .maybeSingle();
        
        if (error) throw error;
        setLiked(!!data);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkIfLiked();
  }, [post.id, userProfile]);

  // Fetch comments when showing comments
  useEffect(() => {
    if (!showComments) return;
    
    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // For each comment, fetch user information
        if (data) {
          const commentsWithUserInfo = await Promise.all(
            data.map(async (comment) => {
              try {
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('username, avatar_url')
                  .eq('id', comment.author_id)
                  .single();
                
                if (userError) throw userError;
                
                return {
                  ...comment,
                  user_id: comment.author_id, // Map author_id to user_id for consistency
                  username: userData?.username || 'Unknown User',
                  avatar_url: userData?.avatar_url || null,
                  likes_count: comment.likes_count || 0
                } as Comment;
              } catch (error) {
                console.error(`Error fetching user data for comment ${comment.id}:`, error);
                return {
                  ...comment,
                  user_id: comment.author_id,
                  username: 'Unknown User',
                  avatar_url: null,
                  likes_count: comment.likes_count || 0
                } as Comment;
              }
            })
          );
          
          setComments(commentsWithUserInfo);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    };
    
    fetchComments();
  }, [post.id, showComments]);

  const handleLikeToggle = async () => {
    if (!userProfile) {
      toast.error('You need to be signed in to like posts');
      return;
    }
    
    try {
      if (liked) {
        // Unlike the post
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userProfile.id);
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        
        // Update post like count
        await supabase
          .from('posts')
          .update({ likes_count: likeCount - 1 })
          .eq('id', post.id);
      } else {
        // Like the post
        await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: userProfile.id
          });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Update post like count
        await supabase
          .from('posts')
          .update({ likes_count: likeCount + 1 })
          .eq('id', post.id);
      }
      
      onInteraction();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like. Please try again.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentContent.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    if (!userProfile) {
      toast.error('You need to be signed in to comment');
      return;
    }
    
    try {
      // Create the comment - make sure to use post_id and not bounty_id
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_id: userProfile.id,
          content: commentContent,
          bounty_id: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update comment count
      const newCommentCount = commentCount + 1;
      setCommentCount(newCommentCount);
      
      // Update post comment count
      await supabase
        .from('posts')
        .update({ comments_count: newCommentCount })
        .eq('id', post.id);
      
      // Add the new comment to the list
      const newComment: Comment = {
        ...data,
        user_id: data.author_id,
        username: userProfile.username,
        avatar_url: userProfile.avatar_url || null,
        likes_count: 0
      };
      
      setComments(prev => [newComment, ...prev]);
      setCommentContent('');
      toast.success('Comment added successfully!');
      onInteraction();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    }
  };

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-3 p-4">
        <Avatar className="h-10 w-10 border-2 border-dream-background/20">
          <AvatarImage src={post.avatar_url || undefined} alt={post.username || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
            {post.username ? post.username.substring(0, 2).toUpperCase() : 'UN'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col">
          <p className="font-medium">{post.username || 'Unknown User'}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        
        {post.image_url && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post attachment" 
              className="w-full h-auto object-cover max-h-[400px]"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart 
              className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'hover:text-dream-foreground'} cursor-pointer`}
              onClick={handleLikeToggle}
            />
            <span>{likeCount}</span>
          </div>
          
          <div 
            className="flex items-center gap-1.5 cursor-pointer hover:text-dream-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentCount}</span>
          </div>
          
          <div className="flex items-center gap-1.5 ml-auto">
            <Eye className="w-4 h-4" />
            <span>{viewCount}</span>
          </div>
        </div>
        
        {showComments && (
          <div className="mt-4 w-full">
            <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
              <Textarea
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="min-h-[60px] bg-dream-background/50 focus-visible:ring-purple-500 text-sm"
                disabled={!userProfile}
              />
              
              <Button 
                type="submit" 
                size="sm"
                className="self-end bg-purple-600 hover:bg-purple-700"
                disabled={!commentContent.trim() || !userProfile}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            
            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto py-1 pr-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 text-sm">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={comment.avatar_url || undefined} alt={comment.username || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500/70 to-blue-600/70 text-xs">
                        {comment.username ? comment.username.substring(0, 2).toUpperCase() : 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="bg-dream-background/40 rounded-md p-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-xs">{comment.username || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="mt-1">{comment.content}</p>
                      </div>
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
