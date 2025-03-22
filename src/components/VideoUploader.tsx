
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  onUploadComplete: (url: string) => void;
  label?: string;
  currentVideoUrl?: string;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
  label = "Upload Video",
  currentVideoUrl
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploadSuccess(false);
      
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Validate file is a video
      if (!file.type.startsWith('video/')) {
        setError('Please upload a video file');
        return;
      }
      
      // Check file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Video must be smaller than 50MB');
        return;
      }
      
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `tour_videos/${fileName}`;
      
      // Track upload progress manually
      let lastLoaded = 0;
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      // Upload file to Supabase Storage (use tourvideo bucket)
      const { data, error: uploadError } = await supabase.storage
        .from('tourvideo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tourvideo')
        .getPublicUrl(filePath);
      
      // Notify parent component
      onUploadComplete(publicUrl);
      setUploadSuccess(true);
      
    } catch (error: any) {
      console.error('Error uploading video:', error);
      setError(error.message || 'Error uploading video');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [onUploadComplete]);
  
  const handleCancel = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {currentVideoUrl && !uploading && !error && (
          <div className="text-xs text-dream-foreground/70 flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Video already uploaded
          </div>
        )}
      </div>
      
      {!uploading && !uploadSuccess && (
        <div className="flex items-center">
          <Button 
            type="button" 
            variant="outline" 
            className="flex items-center gap-2 bg-dream-accent1/10 hover:bg-dream-accent1/20"
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-xs">{uploadProgress}%</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel} 
              className="h-6 text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="flex items-center text-green-500 text-sm">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Video uploaded successfully!
        </div>
      )}
      
      {error && (
        <div className="flex items-center text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      
      {currentVideoUrl && (
        <div className="mt-4 rounded-md overflow-hidden border border-dream-accent1/30">
          <video 
            src={currentVideoUrl} 
            controls 
            className="w-full h-auto max-h-[200px]" 
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
