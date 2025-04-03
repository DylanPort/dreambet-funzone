
-- Create storage bucket for community images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'community_images', 'community_images', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'community_images');

-- Set up RLS policies for the storage bucket
BEGIN;
  -- Remove any existing policies
  DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

  -- Create policies
  -- Public read access policy
  CREATE POLICY "Allow public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'community_images');

  -- Upload policy for authenticated users
  CREATE POLICY "Allow authenticated users to upload files"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'community_images' AND
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Update policy
  CREATE POLICY "Allow users to update their own files"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'community_images' AND
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Delete policy
  CREATE POLICY "Allow users to delete their own files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'community_images' AND
      auth.role() = 'authenticated' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
COMMIT;
