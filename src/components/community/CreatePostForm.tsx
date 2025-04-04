
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';

interface CreatePostFormProps {
  userId: string;
  onSuccess: () => void;
}

const CreatePostForm = ({ userId, onSuccess }: CreatePostFormProps) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);

      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('User validation error:', userError);
        toast.error('User validation failed. Please try again later.');
        return;
      }
      
      let imageUrl = null;
      
      // Upload image if available
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `posts/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, image);
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          return;
        }
        
        // Get public URL
        const { data } = supabase.storage.from('media').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
      
      // Create the post
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          likes_count: 0,
          comments_count: 0
        });
        
      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        return;
      }
      
      // Reset form
      setContent('');
      removeImage();
      
      // Notify success
      toast.success('Post created successfully!');
      
      // Call onSuccess callback
      onSuccess();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel">
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-black/30 border-dream-accent2/20 focus:border-dream-accent1/60"
          />
          
          {imagePreview && (
            <div className="relative">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <img 
                src={imagePreview} 
                alt="Image preview" 
                className="rounded-md max-h-64 w-auto object-contain mx-auto" 
              />
            </div>
          )}
          
          <div className="flex justify-between">
            <div>
              <label htmlFor="image-upload" className="cursor-pointer">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-dream-accent3"
                >
                  <ImagePlus className="h-5 w-5 mr-2" />
                  Add Image
                </Button>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="bg-dream-accent1 hover:bg-dream-accent1/80"
            >
              {isSubmitting ? (
                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
