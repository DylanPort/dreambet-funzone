
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart, MoreHorizontal, SendHorizonal, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import CommentCard from '@/components/community/CommentCard';
import { supabase } from '@/integrations/supabase/client';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  fetchPosts, 
  Post, 
  fetchComments, 
  Comment, 
  createComment, 
  likePost, 
  deletePost 
} from '@/services/communityService';

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      if (!postId) return;
      
      setIsLoading(true);
      setIsCommentsLoading(true);
      
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // Fetch post details
      const posts = await fetchPosts();
      const foundPost = posts.find(p => p.id === postId);
      
      if (foundPost) {
        setPost(foundPost);
        setIsLiked(foundPost.isLiked || false);
        setLikesCount(foundPost.likes_count || 0);
        
        // Check if current user is post author
        if (user && user.id === foundPost.user_id) {
          setIsAuthor(true);
        }
      } else {
        toast.error('Post not found');
        navigate('/community');
      }
      
      setIsLoading(false);
      
      // Fetch comments
      const fetchedComments = await fetchComments(postId);
      setComments(fetchedComments);
      setIsCommentsLoading(false);
    };
    
    loadData();
    
    // Set up realtime subscription for comments
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          // Refresh comments when a new one is added
          fetchComments(postId).then(updatedComments => {
            setComments(updatedComments);
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, navigate]);
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    
    setIsSubmitting(true);
    const comment = await createComment(postId, newComment);
    setIsSubmitting(false);
    
    if (comment) {
      setNewComment('');
      // Refresh comments
      const updatedComments = await fetchComments(postId);
      setComments(updatedComments);
      
      // Update post comment count
      if (post) {
        setPost({
          ...post,
          comments_count: post.comments_count + 1
        });
      }
    }
  };
  
  const handleLike = async () => {
    if (!postId) return;
    
    const result = await likePost(postId);
    if (result !== null) {
      setIsLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
      
      // Update post likes count
      if (post) {
        setPost({
          ...post,
          likes_count: result ? post.likes_count + 1 : post.likes_count - 1,
          isLiked: result
        });
      }
    }
  };
  
  const handleDelete = async () => {
    if (!postId) return;
    
    if (confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      const success = await deletePost(postId);
      setIsDeleting(false);
      
      if (success) {
        toast.success('Post deleted');
        navigate('/community');
      }
    }
  };
  
  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    
    // Update post comment count
    if (post) {
      setPost({
        ...post,
        comments_count: Math.max(0, post.comments_count - 1)
      });
    }
  };
  
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  if (!post) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
          <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
            <div className="text-center py-10">
              <h1 className="text-2xl font-bold text-white mb-2">Post Not Found</h1>
              <p className="text-gray-400 mb-4">The post you're looking for doesn't exist or has been removed.</p>
              <Link to="/community">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back to Community
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <Link to="/community">
              <Button variant="ghost" className="text-gray-400">
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Community
              </Button>
            </Link>
          </div>
          
          <Card className="mb-6 bg-[#10121f] border-indigo-900/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Link to={`/community/profile/${post.user_id}`}>
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={post.avatar_url || ''} alt={post.username} />
                      <AvatarFallback className="bg-indigo-600">{getInitials(post.username || '')}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to={`/community/profile/${post.user_id}`} className="font-semibold text-white hover:text-indigo-400 transition">
                      {post.display_name || post.username || 'Anonymous'}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1d2d] border border-indigo-900/50">
                      <DropdownMenuItem 
                        className="text-red-500 cursor-pointer flex items-center"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4 mr-2" /> 
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 py-3">
              <div className="whitespace-pre-wrap text-gray-200 text-lg">{post.content}</div>
              {post.image_url && (
                <div className="mt-4">
                  <img 
                    src={post.image_url} 
                    alt="Post attachment" 
                    className="rounded-md max-h-[500px] object-contain bg-black/20 mx-auto"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 py-3 flex justify-between border-t border-indigo-900/30">
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
                  onClick={handleLike}
                  disabled={!isAuthenticated}
                >
                  <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-gray-400"
                >
                  <Heart className="h-5 w-5 mr-1" />
                  <span>{post.comments_count}</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <div className="bg-[#10121f] rounded-lg border border-indigo-900/30 mb-6">
            <div className="p-4 border-b border-indigo-900/30">
              <h2 className="text-lg font-semibold text-white">Comments ({post.comments_count})</h2>
            </div>
            
            {isAuthenticated && (
              <div className="p-4 border-b border-indigo-900/30">
                <form onSubmit={handleCommentSubmit}>
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-3 bg-[#191c31] border-indigo-900/30 text-white"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <SendHorizonal className="h-5 w-5 mr-2" />
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="p-4">
              {isCommentsLoading ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p>No comments yet</p>
                  {isAuthenticated ? (
                    <p className="text-sm">Be the first to comment!</p>
                  ) : (
                    <p className="text-sm">Sign in to add a comment</p>
                  )}
                </div>
              ) : (
                <div>
                  {comments.map(comment => (
                    <CommentCard 
                      key={comment.id} 
                      comment={comment} 
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))}
                </div>
              )}
              
              {!isAuthenticated && (
                <div className="mt-6 p-4 bg-indigo-900/20 rounded-lg text-center">
                  <p className="text-white mb-3">Sign in to participate in the discussion</p>
                  <Link to="/profile">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Connect Wallet
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PostDetail;
