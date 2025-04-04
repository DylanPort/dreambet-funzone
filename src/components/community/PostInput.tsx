
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ImagePlus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface PostInputProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<boolean | undefined>;
}

const PostInput: React.FC<PostInputProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = usePXBPoints();

  const handleSubmit = async () => {
    if (!userProfile) {
      toast.error('You must be logged in to create a post');
      return;
    }

    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(content, imageUrl || undefined);
    setIsSubmitting(false);
    
    if (success) {
      setContent('');
      setImageUrl('');
    }
  };
  
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0 border border-dream-accent1/30">
          <AvatarImage 
            src={userProfile?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} 
            alt={userProfile?.username || 'User'} 
          />
          <AvatarFallback className="bg-dream-accent1/20 text-dream-accent1">
            {userProfile?.username?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={userProfile ? "What's on your mind?" : "Log in to post a message"}
            className="min-h-[80px] bg-accent/20 border-accent/20 resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!userProfile || isSubmitting}
          />
        </div>
      </div>
      
      {imageUrl && (
        <div className="relative max-w-xs mx-auto">
          <img 
            src={imageUrl} 
            alt="Post attachment" 
            className="rounded-md max-h-40 object-cover w-full" 
          />
          <button 
            className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
            onClick={() => setImageUrl('')}
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-dream-accent3"
            onClick={() => {
              // For this demo, we'll just ask for an image URL
              const url = prompt('Enter image URL:');
              if (url) setImageUrl(url);
            }}
            disabled={!userProfile || isSubmitting}
          >
            <ImagePlus size={18} className="mr-1" />
            Add Image
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-dream-accent1 hover:bg-dream-accent1/90" 
          onClick={handleSubmit}
          disabled={!userProfile || !content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
          <Send size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default PostInput;
