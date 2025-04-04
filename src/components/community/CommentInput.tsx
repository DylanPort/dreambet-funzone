
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onSubmit: (postId: string, content: string, parentId?: string) => Promise<boolean | undefined>;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  postId, 
  parentId, 
  onSubmit, 
  onCancel, 
  placeholder = "Write a comment...",
  className = "" 
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = usePXBPoints();

  const handleSubmit = async () => {
    if (!userProfile) {
      toast.error('You must be logged in to comment');
      return;
    }

    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(postId, content, parentId);
    setIsSubmitting(false);
    
    if (success) {
      setContent('');
      if (onCancel) onCancel();
    }
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0 border border-dream-accent1/30">
          <AvatarImage 
            src={userProfile?.avatar_url || '/lovable-uploads/be6baddd-a67e-4583-b969-a471b47274e1.png'} 
            alt={userProfile?.username || 'User'} 
          />
          <AvatarFallback className="bg-dream-accent1/20 text-dream-accent1 text-xs">
            {userProfile?.username?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={userProfile ? placeholder : "Log in to comment"}
            className="min-h-[60px] bg-accent/20 border-accent/20 resize-none text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!userProfile || isSubmitting}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          variant="default" 
          size="sm" 
          className="bg-dream-accent1 hover:bg-dream-accent1/90" 
          onClick={handleSubmit}
          disabled={!userProfile || !content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="mr-1 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit
              <Send size={16} className="ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CommentInput;
