
-- Make sure the posts table has the correct schema
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable row level security on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "Allow public read access to posts" ON public.posts 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create posts" ON public.posts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own posts" ON public.posts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own posts" ON public.posts 
  FOR DELETE USING (auth.uid() = user_id);

-- Create table for post comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable row level security on post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for post_comments
CREATE POLICY "Allow public read access to comments" ON public.post_comments 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create comments" ON public.post_comments 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own comments" ON public.post_comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments" ON public.post_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Create table for post reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable row level security on post_reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for post_reactions
CREATE POLICY "Allow public read access to reactions" ON public.post_reactions 
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create reactions" ON public.post_reactions 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to delete their own reactions" ON public.post_reactions 
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for these tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.post_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add tables to the realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts, public.post_comments, public.post_reactions, public.users;
  END IF;
END
$$;
