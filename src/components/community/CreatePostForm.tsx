
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { nanoid } from 'nanoid';
import WalletConnectButton from '../WalletConnectButton';

export const CreatePostForm = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connected, publicKey } = useWallet();
  const { addPointsToUser } = usePXBPoints();
  
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !imageFile) {
      toast.error('Please add some content to your post');
      return;
    }
    
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet to post');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First, get or create the user in the users table using the wallet address
      const walletAddress = publicKey.toString();
      
      // Check if user exists
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      let userId;
      
      if (findError) {
        console.error('Error finding user:', findError);
      }
      
      if (!existingUser) {
        // Create a new user record if none exists
        console.log('Creating new user with wallet:', walletAddress);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress,
            points: 0 // Start with 0 points
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating user:', createError);
          toast.error('Failed to create user profile');
          setIsSubmitting(false);
          return;
        }
        
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }
      
      // Handle image upload if present
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${nanoid()}.${fileExt}`;
        const filePath = `post_images/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('media')
          .upload(filePath, imageFile);
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          setIsSubmitting(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase
          .storage
          .from('media')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }
      
      console.log('Creating post with user ID:', userId);
      
      // Add post using the UUID from the users table
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content.trim(),
          image_url: imageUrl,
          likes_count: 0,
          comments_count: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        setIsSubmitting(false);
        return;
      }
      
      // Award points for posting
      const pointsAmount = 10;
      await addPointsToUser(pointsAmount, 'Created a post');
      
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      
      toast.success('Post created! +10 PXB');
    } catch (error) {
      console.error('Error in handleSubmitPost:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload only images (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // If not connected, show a simplified form with connect wallet button
  if (!connected) {
    return (
      <div className="glass-panel p-5 animate-fade-in">
        <h3 className="text-lg font-medium mb-4">Sign in to share your thoughts with the community</h3>
        <div className="flex justify-center">
          <WalletConnectButton />
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-5 animate-fade-in">
      <h3 className="text-lg font-medium mb-4">Create a Post</h3>
      
      <form onSubmit={handleSubmitPost}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="bg-white/5 border-white/10 focus-visible:ring-dream-accent1/40 mb-2 h-24"
        />
        
        {imagePreview && (
          <div className="relative mb-4 mt-2">
            <div className="rounded-lg overflow-hidden border border-white/10">
              <img src={imagePreview} alt="Upload preview" className="max-h-60 w-auto mx-auto" />
            </div>
            <button 
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <input
              type="file"
              id="image-upload"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="image-upload" 
              className="cursor-pointer text-dream-accent1 hover:text-dream-accent1/80 flex items-center gap-1.5"
            >
              <ImageIcon size={18} />
              <span>Add Image</span>
            </label>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || (!content.trim() && !imageFile)}
            className="bg-dream-accent1 hover:bg-dream-accent1/90"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </div>
  );
};
