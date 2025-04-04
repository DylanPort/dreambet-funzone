
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImagePlus, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const createPost = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }

    try {
      setIsSubmitting(true);

      // First, check if the user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        toast.error('User validation failed. Please try again later.');
        return;
      }

      let imageUrl = null;

      // If there's an image, upload it first
      if (image) {
        const fileExt = image.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('post-images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image. Post will be created without image.');
        } else if (uploadData) {
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(filePath);
          
          imageUrl = urlData.publicUrl;
        }
      }

      // Create the post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post. Please try again.');
        return;
      }

      // Clear form
      setContent('');
      removeImage();
      toast.success('Post created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error in createPost:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 bg-black/20 border border-dream-accent1/20">
      <Textarea
        placeholder="Share something with the community..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] mb-4 bg-black/40 border-dream-accent2/20 focus:border-dream-accent1/60"
      />
      
      {imagePreview && (
        <div className="relative mb-4">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="rounded-md max-h-64 w-auto mx-auto object-contain"
          />
          <button 
            onClick={removeImage}
            className="absolute top-2 right-2 rounded-full p-1 bg-black/70 text-white hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <label 
            htmlFor="post-image" 
            className="cursor-pointer inline-flex items-center text-sm text-dream-accent2 hover:text-dream-accent1"
          >
            <ImagePlus className="h-5 w-5 mr-1" />
            Add Image
          </label>
          <input 
            id="post-image" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageChange}
          />
        </div>
        
        <Button 
          onClick={createPost}
          disabled={isSubmitting || !content.trim()}
          className="bg-dream-accent3 hover:bg-dream-accent3/80 text-white"
        >
          {isSubmitting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Post
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default CreatePostForm;
