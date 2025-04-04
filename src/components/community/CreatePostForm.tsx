import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, X, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { nanoid } from 'nanoid';
import WalletConnectButton from '../WalletConnectButton';
import { useQueryClient } from '@tanstack/react-query';

export const CreatePostForm = () => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connected, publicKey } = useWallet();
  const { addPointsToUser } = usePXBPoints();
  const queryClient = useQueryClient();
  
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error('Please connect your wallet to post');
      return;
    }
    
    if (!content.trim() && !imageFile) {
      toast.error('Post cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get the session to ensure we have the user ID
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      
      // If no session (not authenticated via Supabase), use wallet address as fallback
      if (!userId && publicKey) {
        // Try to find or create a user record for this wallet
        const walletAddress = publicKey.toString();
        
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create a new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              wallet_address: walletAddress,
              username: `user_${walletAddress.substring(0, 4)}`,
              points: 0
            })
            .select('id')
            .single();
          
          if (createError) {
            console.error('Error creating user:', createError);
            toast.error('Failed to create user account');
            setIsSubmitting(false);
            return;
          }
          
          userId = newUser.id;
        }
      }
      
      if (!userId) {
        toast.error('Unable to identify user. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Creating post with user ID:', userId);
      
      let imageUrl = null;
      
      // If there's an image, upload it first
      if (imageFile) {
        // Check if storage bucket exists
        const { data: buckets } = await supabase
          .storage
          .listBuckets();
        
        const postImagesBucket = buckets?.find(b => b.name === 'post-images');
        
        // Create bucket if it doesn't exist
        if (!postImagesBucket) {
          await supabase
            .storage
            .createBucket('post-images', {
              public: true,
              fileSizeLimit: 5242880, // 5MB
            });
        }
        
        // Upload image
        const fileName = `${nanoid()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('post-images')
          .upload(fileName, imageFile);
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          setIsSubmitting(false);
          return;
        }
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase
          .storage
          .from('post-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }
      
      // Create post in the database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: content.trim(),
          image_url: imageUrl,
          likes_count: 0,
          comments_count: 0
        });
      
      if (postError) {
        console.error('Error creating post:', postError);
        toast.error('Failed to create post');
        setIsSubmitting(false);
        return;
      }
      
      // Add points for creating a post
      if (userId) {
        // Give user 10 points for creating a post
        await addPointsToUser(userId, 10, 'post_created');
      }
      
      // Reset form
      setIsSubmitting(false);
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      
      // Invalidate the posts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      
      toast.success('Post created! +10 PXB');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Something went wrong. Please try again.');
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
              <Image size={18} />
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
