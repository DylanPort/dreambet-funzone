
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile } from '@/types/pxb';

interface CreatePostFormProps {
  onPostCreated: () => void;
  userProfile: UserProfile | null;
}

const CreatePostForm = ({ onPostCreated, userProfile }: CreatePostFormProps) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }
    
    if (!userProfile) {
      toast.error('You need to be signed in to create a post');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userProfile.id)
        .single();
      
      // If user doesn't exist, create a new user record
      if (userError || !userData) {
        await supabase.from('users').insert({
          id: userProfile.id,
          username: userProfile.username,
          wallet_address: userProfile.walletAddress || 'unknown',
          points: userProfile.pxbPoints
        });
      }
      
      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          user_id: userProfile.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Post created successfully!');
      setContent('');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel overflow-hidden">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-dream-background/50 focus-visible:ring-purple-500"
            disabled={isLoading || !userProfile}
          />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading || !content.trim() || !userProfile}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all"
            >
              {isLoading ? (
                <>Posting...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
