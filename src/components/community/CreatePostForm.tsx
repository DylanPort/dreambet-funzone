
import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { createPost } from '@/services/communityService';
import { Upload, Image, X } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePostFormProps {
  onPostCreated: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !imageFile) {
      toast.error('Please enter some content or add an image');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const filename = `${user.id}-${Date.now()}-${imageFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filename, imageFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filename);
          
        imageUrl = publicUrl;
      }
      
      const newPost = await createPost(content, imageUrl);
      
      if (newPost) {
        setContent('');
        removeImage();
        onPostCreated();
        toast.success('Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 bg-[#10121f] border border-indigo-900/30">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="Share your thoughts with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-3 bg-[#191c31] border-indigo-900/30 min-h-[100px] text-white resize-none"
          />
          
          {imagePreview && (
            <div className="relative mb-3 inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-24 w-auto rounded-md object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex">
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center text-indigo-400 hover:text-indigo-300">
                  <Image className="h-5 w-5 mr-1" />
                  <span className="text-sm">Add Image</span>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !imageFile)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
