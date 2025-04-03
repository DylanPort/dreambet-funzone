
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MessageSquare, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { fetchPostById, fetchCommentsByPostId, createComment, likePost } from '@/services/communityService';
import { Post, Comment } from '@/types/community';
import OrbitingParticles from '@/components/OrbitingParticles';
import CommentCard from '@/components/community/CommentCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
  }, []);
  
  const loadPost = async () => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      
      const postData = await fetchPostById(postId);
      if (postData) {
        setPost(postData);
        setIsLiked(postData.isLiked || false);
        setLikesCount(postData.likes_count);
      } else {
        // Post not found
        navigate('/community');
        toast.error('Post not found');
      }
      
      const commentsData = await fetchCommentsByPostId(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPost();
  }, [postId]);
  
  // Set up realtime subscription for new comments
  useEffect(() => {
    if (!postId) return;
    
    const channel = supabase
      .channel('comment-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, () => {
        // Reload comments when a new one is created
        fetchCommentsByPostId(postId).then(commentsData => {
          setComments(commentsData);
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);
  
  const handleLikePost = async () => {
    if (!post) return;
    
    const result = await likePost(post.id);
    if (result !== null) {
      setIsLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
    }
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postId || !newComment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const comment = await createComment(postId, newComment);
      
      if (comment) {
        setNewComment('');
        // Update comments list with the new comment
        setComments(prev => [...prev, comment]);
        // Update comment count in post
        if (post) {
          setPost({
            ...post,
            comments_count: post.comments_count + 1
          });
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCommentDeleted = (commentId: string) => {
    // Remove the deleted comment from the list
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    
    // Update comment count in post
    if (post) {
      setPost({
        ...post,
        comments_count: post.comments_count - 1
      });
    }
  };
  
  const getInitials = (username?: string | null) => {
    return username ? username.substring(0, 2).toUpperCase() : 'AN';
  };
  
  const formatPostTime = (date?: string) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  if (isLoading) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </main>
      </>
    );
  }
  
  if (!post) {
    return (
      <>
        <OrbitingParticles />
        <Navbar />
        <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <p className="text-xl text-gray-400 mb-4">Post not found</p>
              <Button 
                variant="default"
                onClick={() => navigate('/community')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Community
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/community" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Community
          </Link>
          
          <div className="bg-[#10121f] rounded-lg border border-indigo-900/30 mb-6">
            <div className="p-4 border-b border-indigo-900/30">
              <div className="flex items-center mb-4">
                <Link to={`/community/profile/${post.user_id}`}>
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={post.avatar_url || ''} alt={post.username} />
                    <AvatarFallback className="bg-indigo-600">{getInitials(post.username)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link to={`/community/profile/${post.user_id}`} className="font-semibold text-white hover:text-indigo-400 transition">
                    {post.display_name || post.username || 'Anonymous'}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {formatPostTime(post.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="whitespace-pre-wrap text-gray-200 mb-4">{post.content}</div>
              
              {post.image_url && (
                <div className="mt-3 mb-4">
                  <img 
                    src={post.image_url} 
                    alt="Post attachment" 
                    className="rounded-md max-h-96 object-contain bg-black/20 mx-auto"
                  />
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
                  onClick={handleLikePost}
                >
                  <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="flex items-center text-gray-400"
                >
                  <MessageSquare className="h-5 w-5 mr-1" />
                  <span>{post.comments_count}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="flex items-center text-gray-400"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard');
                  }}
                >
                  <Share2 className="h-5 w-5 mr-1" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Comments</h2>
              
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] bg-[#191c31] border-indigo-900/30 text-white"
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      type="submit" 
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-3 bg-[#191c31] rounded border border-indigo-900/50 text-center">
                  <p className="text-gray-400 text-sm">Connect your wallet to comment on this post</p>
                </div>
              )}
              
              {comments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400">No comments yet</p>
                  <p className="text-gray-500 text-sm mt-1">Be the first to comment on this post!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {comments.map(comment => (
                    <CommentCard 
                      key={comment.id} 
                      comment={comment} 
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default PostDetail;
