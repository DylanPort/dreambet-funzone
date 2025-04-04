
import React from 'react';
import { Post } from '@/types/pxb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const formatCreatedAt = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

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
    </Card>
  );
};

export default PostCard;
