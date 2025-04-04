
-- Drop the post_comments table if it exists (it was causing confusion)
DROP TABLE IF EXISTS public.post_comments;

-- Alter the comments table to match our expected schema
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
DROP COLUMN IF EXISTS bounty_id,
DROP COLUMN IF EXISTS author_id;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add likes_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Update RLS policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to comments" ON public.comments;
DROP POLICY IF EXISTS "Allow authenticated users to create comments" ON public.comments;
DROP POLICY IF EXISTS "Allow users to update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Allow users to delete their own comments" ON public.comments;

-- Create new policies
CREATE POLICY "Allow public read access to comments" 
  ON public.comments 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create comments" 
  ON public.comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own comments" 
  ON public.comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments" 
  ON public.comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add table to the realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END $$;
