
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/community';
import { deletePost, likePost } from '@/services/communityService';
import { Heart, MessageSquare, MoreVertical, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface PostCardProps {
  post: Post;
  onPostDeleted: () => void;
  onPostLiked: (postId: string, isLiked: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostLiked }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const handleLikePost = async () => {
    if (isLiking) return;
    
    try {
      setIsLiking(true);
      const isLiked = await likePost(post.id);
      
      // Only update state if we got a valid response (not null)
      if (isLiked !== null) {
        onPostLiked(post.id, isLiked);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDeletePost = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const success = await deletePost(post.id);
      
      if (success) {
        toast.success('Post deleted successfully');
        onPostDeleted();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const isCurrentUserPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === post.user_id;
  };
  
  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const getInitials = (username?: string | null) => {
    return username ? username.substring(0, 2).toUpperCase() : 'AN';
  };

  return (
    <Card className="bg-[#10121f] border border-indigo-900/30">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Link to={`/community/profile/${post.user_id}`} className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={post.avatar_url || ''} />
              <AvatarFallback className="bg-indigo-600">{getInitials(post.username)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{post.display_name || post.username || 'Anonymous'}</p>
              <p className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</p>
            </div>
          </Link>
          
          {isCurrentUserPost() && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 text-gray-400 hover:text-white">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0 bg-[#191c31] border border-indigo-900/50">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-indigo-900/30 p-2"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
          
          {post.image_url && (
            <div className="mt-3">
              <img 
                src={post.image_url} 
                alt="Post" 
                className="rounded-md max-h-96 w-auto object-contain"
              />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-indigo-900/30 p-3">
        <div className="flex space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center ${post.isLiked ? 'text-red-400' : 'text-gray-400'} hover:text-red-400 hover:bg-transparent`}
            onClick={handleLikePost}
          >
            <Heart className={`h-5 w-5 mr-1 ${post.isLiked ? 'fill-red-400' : ''}`} />
            <span>{post.likes_count}</span>
          </Button>
          
          <Link to={`/community/post/${post.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-gray-400 hover:text-indigo-400 hover:bg-transparent"
            >
              <MessageSquare className="h-5 w-5 mr-1" />
              <span>{post.comments_count}</span>
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
