
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, X } from 'lucide-react';
import { toast } from 'sonner';

export const CreatePostForm: React.FC = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, username?: string, avatar_url?: string} | null>(null);
  
  React.useEffect(() => {
    // Get current user
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .eq('id', session.user.id)
          .single();
          
        setCurrentUser(userData);
      }
    };
    
    fetchUser();
  }, []);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !image) {
      toast.error('Please add some content to your post');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You need to be logged in to create a post');
        return;
      }
      
      let imageUrl = null;
      
      // Upload image if exists
      if (image) {
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `post-images/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('community')
          .upload(filePath, image);
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          return;
        }
        
        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from('community')
          .getPublicUrl(filePath);
          
        imageUrl = urlData.publicUrl;
      }
      
      // Create post
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content: content.trim(),
          image_url: imageUrl
        });
        
      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        return;
      }
      
      setContent("");
      setImage(null);
      setImagePreview(null);
      toast.success('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!currentUser) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="mb-4">Sign in to share your thoughts with the community</p>
        <Button className="bg-dream-accent1 hover:bg-dream-accent1/90">Connect Wallet</Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 animate-fade-in">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border border-dream-accent1/30">
          <AvatarImage src={currentUser.avatar_url || undefined} />
          <AvatarFallback className="bg-dream-accent3/20 text-dream-accent3">
            {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'PX'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community..."
            className="bg-white/5 border-white/10 focus-visible:ring-dream-accent1/40 min-h-[120px]"
          />
          
          {imagePreview && (
            <div className="relative mt-3 rounded-lg overflow-hidden border border-white/10">
              <img src={imagePreview} alt="Upload preview" className="w-full h-auto max-h-60 object-contain" />
              <button 
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="flex justify-between mt-4">
            <div>
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-white/60 hover:text-white">
                  <Image className="h-5 w-5" />
                  <span className="text-sm">Add Image</span>
                </div>
                <input 
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || (!content.trim() && !image)}
              className="bg-dream-accent1 hover:bg-dream-accent1/90"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
