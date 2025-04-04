
import React, { useState, useEffect } from 'react';
import { Post } from '@/types/pxb';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Eye, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCardProps {
  post: Post;
  expanded: boolean;
  onExpand: (postId: string) => void;
  onLike: (postId: string) => Promise<boolean | undefined>;
  onComment: (postId: string, content: string, parentId?: string) => Promise<boolean | undefined>;
  onCommentLike: (postId: string, commentId: string) => Promise<boolean | undefined>;
  comments: React.ReactNode;
  loadingComments: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  expanded, 
  onExpand, 
  onLike, 
  onComment,
  onCommentLike,
  comments,
  loadingComments
}) => {
  const [isLiked, setIsLiked] = useState(false);
  
  const handleLike = async () => {
    const liked = await onLike(post.id);
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

  // Generate interaction score for sorting (more interaction = higher score)
  const interactionScore = post.comments_count * 3 + post.likes_count * 2 + post.views_count;

  return (
    <Card className="mb-4 border-accent/20 bg-card/80 backdrop-blur">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Avatar className="h-10 w-10 border border-dream-accent1/30">
          <AvatarImage 
            src={post.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} 
            alt={post.username || 'User'} 
          />
          <AvatarFallback className="bg-dream-accent1/20 text-dream-accent1">
            {post.username?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0">
          <span className="font-medium">{post.username}</span>
          <span className="text-xs text-muted-foreground">{formatCreatedAt(post.created_at)}</span>
        </div>
        <div className="ml-auto flex items-center">
          <div className="text-xs text-muted-foreground bg-accent/20 py-1 px-2 rounded-full">
            Score: {interactionScore}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-3">
            <img 
              src={post.image_url} 
              alt="Post attachment" 
              className="rounded-md max-h-80 mx-auto object-contain" 
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col pt-0">
        <div className="flex items-center justify-between w-full border-t border-accent/20 pt-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-sm ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              onClick={handleLike}
            >
              <Heart size={16} className="mr-1" />
              {post.likes_count} Likes
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm text-muted-foreground"
              onClick={() => onExpand(post.id)}
            >
              <MessageSquare size={16} className="mr-1" />
              {post.comments_count} Comments
            </Button>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Eye size={16} className="mr-1" />
              {post.views_count} Views
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-muted-foreground"
            onClick={() => onExpand(post.id)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        
        {expanded && (
          <div className="w-full mt-4 space-y-4">
            <CommentInput 
              postId={post.id} 
              onSubmit={onComment}
              placeholder="Write a comment..."
            />
            
            {loadingComments ? (
              <div className="space-y-4 mt-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-20 w-full rounded-md" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>{comments}</>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
