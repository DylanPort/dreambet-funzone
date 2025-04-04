
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Ensure necessary storage buckets exist
export const initializeStorage = async () => {
  try {
    // Check if the post-images bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return false;
    }
    
    const postImagesBucket = buckets.find(bucket => bucket.name === 'post-images');
    
    // Create bucket if it doesn't exist
    if (!postImagesBucket) {
      const { error: createError } = await supabase
        .storage
        .createBucket('post-images', {
          public: true,
          fileSizeLimit: 2097152, // 2MB
        });
      
      if (createError) {
        console.error('Error creating post-images bucket:', createError);
        return false;
      }
      
      console.log('Created post-images bucket successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Upload a file to a specific bucket
export const uploadFile = async (
  bucketName: string,
  filePath: string,
  file: File
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);
    
    if (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      toast.error('Failed to upload file');
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile to ${bucketName}:`, error);
    return null;
  }
};

// Delete a file from a bucket
export const deleteFile = async (
  bucketName: string,
  filePath: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in deleteFile from ${bucketName}:`, error);
    return false;
  }
};

// Initialize storage on app start
initializeStorage().then(success => {
  if (success) {
    console.log('Storage initialized successfully');
  } else {
    console.warn('Storage initialization failed');
  }
});
