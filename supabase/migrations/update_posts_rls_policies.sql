
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

-- Create policy to allow all inserts (since we manually check the user_id in the app)
CREATE POLICY "Allow all inserts to posts" 
ON public.posts 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create policy to allow users to view all posts
CREATE POLICY "Anyone can view posts" 
ON public.posts 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Create policy to allow users to update only their own posts
CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to delete only their own posts
CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
