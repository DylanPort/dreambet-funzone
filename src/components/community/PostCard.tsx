
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, MoreHorizontal, Trash } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Post, likePost, deletePost } from '@/services/communityService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
  onPostLiked?: (postId: string, isLiked: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostLiked }) => {
  const [isLiked, setIsLiked] = useState<boolean>(post.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Check if current user is post author
  const [isAuthor, setIsAuthor] = useState<boolean>(false);
  
  React.useEffect(() => {
    const checkAuthor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === post.user_id) {
        setIsAuthor(true);
      }
    };
    
    checkAuthor();
  }, [post.user_id]);

  const handleLike = async () => {
    const result = await likePost(post.id);
    if (result !== null) {
      setIsLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
      if (onPostLiked) onPostLiked(post.id, result);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      const success = await deletePost(post.id);
      setIsDeleting(false);
      
      if (success) {
        if (onPostDeleted) onPostDeleted();
        toast.success('Post deleted');
      }
    }
  };

  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };

  return (
    <Card className="w-full mb-4 bg-[#10121f] border-indigo-900/30">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to={`/community/profile/${post.user_id}`}>
              <Avatar className="h-10 w-10 mr-3">
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
      <CardContent className="px-4 py-2">
        <Link to={`/community/post/${post.id}`}>
          <div className="whitespace-pre-wrap text-gray-200">{post.content}</div>
          {post.image_url && (
            <div className="mt-3">
              <img 
                src={post.image_url} 
                alt="Post attachment" 
                className="rounded-md max-h-96 object-contain bg-black/20"
              />
            </div>
          )}
        </Link>
      </CardContent>
      <CardFooter className="px-4 py-2 flex justify-between border-t border-indigo-900/30">
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-red-500' : ''}`} />
            <span>{likesCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-gray-400"
            onClick={() => navigate(`/community/post/${post.id}`)}
          >
            <MessageSquare className="h-5 w-5 mr-1" />
            <span>{post.comments_count}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
