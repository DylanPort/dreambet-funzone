
-- Create a storage bucket for post images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'Post Images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM storage.policies 
    WHERE bucket_id = 'post-images' AND name = 'Allow authenticated users to upload images'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'post-images');
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM storage.policies 
    WHERE bucket_id = 'post-images' AND name = 'Allow public to view images'
  ) THEN
    CREATE POLICY "Allow public to view images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'post-images');
  END IF;
END $$;
