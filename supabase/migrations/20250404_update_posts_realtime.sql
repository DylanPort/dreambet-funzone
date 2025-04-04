
-- Enable full replica identity for the posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add the posts table to the supabase_realtime publication if it's not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END
$$;
