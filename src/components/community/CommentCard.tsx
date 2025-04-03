
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MoreHorizontal, Trash } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Comment, likeComment, deleteComment } from '@/services/communityService';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface CommentCardProps {
  comment: Comment;
  onCommentDeleted?: (commentId: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment, onCommentDeleted }) => {
  const [isLiked, setIsLiked] = useState<boolean>(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(comment.likes_count || 0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Check if current user is comment author
  const [isAuthor, setIsAuthor] = useState<boolean>(false);
  
  React.useEffect(() => {
    const checkAuthor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === comment.user_id) {
        setIsAuthor(true);
      }
    };
    
    checkAuthor();
  }, [comment.user_id]);

  const handleLike = async () => {
    const result = await likeComment(comment.id);
    if (result !== null) {
      setIsLiked(result);
      setLikesCount(prev => result ? prev + 1 : prev - 1);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      const success = await deleteComment(comment.id, comment.post_id);
      setIsDeleting(false);
      
      if (success && onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    }
  };

  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };

  return (
    <div className="py-3 border-b border-indigo-900/30 last:border-0">
      <div className="flex items-start">
        <Link to={`/community/profile/${comment.user_id}`}>
          <Avatar className="h-8 w-8 mr-3 mt-1">
            <AvatarImage src={comment.avatar_url || ''} alt={comment.username} />
            <AvatarFallback className="bg-indigo-600">{getInitials(comment.username || '')}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/community/profile/${comment.user_id}`} className="font-semibold text-white hover:text-indigo-400 transition">
                {comment.display_name || comment.username || 'Anonymous'}
              </Link>
              <span className="text-xs text-gray-400 ml-2">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 -mt-1 -mr-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1d2d] border border-indigo-900/50">
                  <DropdownMenuItem 
                    className="text-red-500 cursor-pointer flex items-center"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4 mr-2" /> 
                    {isDeleting ? 'Deleting...' : 'Delete Comment'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="mt-1 text-gray-200 whitespace-pre-wrap">{comment.content}</div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center mt-1 h-7 px-2 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-red-500' : ''}`} />
            <span className="text-xs">{likesCount}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
