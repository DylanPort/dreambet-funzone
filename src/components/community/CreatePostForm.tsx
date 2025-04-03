
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImagePlus, X, SendHorizonal } from 'lucide-react';
import { createPost } from '@/services/communityService';
import { supabase } from "@/integrations/supabase/client";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user profile from users table
        const { data, error } = await supabase
          .from('users')
          .select('username, avatar_url, display_name')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setCurrentUser({
            id: user.id,
            ...data
          });
        }
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if one was selected
      if (image) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `post_images/${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('community_images')
            .upload(filePath, image);
            
          if (!uploadError) {
            const { data } = supabase.storage
              .from('community_images')
              .getPublicUrl(filePath);
              
            imageUrl = data.publicUrl;
          }
        }
      }
      
      // Create post
      const post = await createPost(content, imageUrl);
      
      if (post) {
        setContent('');
        setImage(null);
        setImagePreview(null);
        
        if (onPostCreated) {
          onPostCreated();
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || 'AN';
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-[#10121f] rounded-lg border border-indigo-900/30">
      <div className="flex">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={currentUser?.avatar_url || ''} alt={currentUser?.username} />
          <AvatarFallback className="bg-indigo-600">{getInitials(currentUser?.username || '')}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-[#191c31] border-indigo-900/30 focus:ring-1 focus:ring-indigo-500 text-white"
          />
          
          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 rounded"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="flex justify-between mt-3">
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <ImagePlus className="h-5 w-5 mr-1" />
                <span>Add Image</span>
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!content.trim() || isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <SendHorizonal className="h-5 w-5 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreatePostForm;
