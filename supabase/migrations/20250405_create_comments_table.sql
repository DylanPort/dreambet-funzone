
-- Create comments table for post comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable row level security on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Allow public read access to comments" ON public.comments 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create comments" ON public.comments 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own comments" ON public.comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments" ON public.comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add table to realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END
$$;
