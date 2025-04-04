
-- Enable full replica identity for the posts table so that realtime can get full row data
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add the posts table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
