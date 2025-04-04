
import React, { useState } from 'react';
import { Comment } from '@/types/pxb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentInput from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onLike: (postId: string, commentId: string) => Promise<boolean | undefined>;
  onReply: (postId: string, content: string, parentId?: string) => Promise<boolean | undefined>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, onLike, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const handleLike = async () => {
    const liked = await onLike(postId, comment.id);
    if (liked !== undefined) {
      setIsLiked(liked);
    }
  };

  const formatCreatedAt = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0 border border-dream-accent1/30">
          <AvatarImage 
            src={comment.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} 
            alt={comment.username || 'User'} 
          />
          <AvatarFallback className="bg-dream-accent1/20 text-dream-accent1 text-xs">
            {comment.username?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="bg-accent/20 rounded-md p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-xs">{comment.username}</span>
              <span className="text-xs text-muted-foreground">{formatCreatedAt(comment.created_at)}</span>
            </div>
            <p>{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 px-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-2 text-xs ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              onClick={handleLike}
            >
              <Heart size={14} className="mr-1" />
              {comment.likes_count > 0 ? comment.likes_count : ''}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageSquare size={14} className="mr-1" />
              Reply
            </Button>
          </div>
          
          {isReplying && (
            <CommentInput 
              postId={postId} 
              parentId={comment.id}
              onSubmit={onReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
            />
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-5 mt-3 space-y-3 border-l-2 border-accent/30 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
