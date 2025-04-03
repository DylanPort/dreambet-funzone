
-- Function to get posts with user information
CREATE OR REPLACE FUNCTION public.get_posts()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', p.id,
      'user_id', p.user_id,
      'content', p.content,
      'image_url', p.image_url,
      'likes_count', p.likes_count,
      'comments_count', p.comments_count,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'username', u.username,
      'avatar_url', u.avatar_url,
      'display_name', u.display_name
    )
  FROM
    public.posts p
  JOIN
    public.users u ON p.user_id = u.id
  ORDER BY
    p.created_at DESC
  LIMIT 50;
END;
$$;

-- Function to get a post by ID
CREATE OR REPLACE FUNCTION public.get_post_by_id(post_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', p.id,
      'user_id', p.user_id,
      'content', p.content,
      'image_url', p.image_url,
      'likes_count', p.likes_count,
      'comments_count', p.comments_count,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'username', u.username,
      'avatar_url', u.avatar_url,
      'display_name', u.display_name
    )
  FROM
    public.posts p
  JOIN
    public.users u ON p.user_id = u.id
  WHERE
    p.id = post_id;
END;
$$;

-- Function to get posts by user ID
CREATE OR REPLACE FUNCTION public.get_user_posts(p_user_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', p.id,
      'user_id', p.user_id,
      'content', p.content,
      'image_url', p.image_url,
      'likes_count', p.likes_count,
      'comments_count', p.comments_count,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'username', u.username,
      'avatar_url', u.avatar_url,
      'display_name', u.display_name
    )
  FROM
    public.posts p
  JOIN
    public.users u ON p.user_id = u.id
  WHERE
    p.user_id = p_user_id
  ORDER BY
    p.created_at DESC;
END;
$$;

-- Function to toggle post like (like or unlike)
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  like_exists BOOLEAN;
BEGIN
  -- Check if like already exists
  SELECT EXISTS(
    SELECT 1 FROM public.post_likes 
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO like_exists;
  
  IF like_exists THEN
    -- Unlike: delete the like
    DELETE FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    -- Decrement likes_count
    UPDATE public.posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = p_post_id;
    
    RETURN FALSE;
  ELSE
    -- Like: insert a new like
    INSERT INTO public.post_likes (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    
    -- Increment likes_count
    UPDATE public.posts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = p_post_id;
    
    RETURN TRUE;
  END IF;
END;
$$;

-- Function to get user's post likes
CREATE OR REPLACE FUNCTION public.get_user_post_likes(user_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object('post_id', post_id)
  FROM public.post_likes
  WHERE user_id = $1;
END;
$$;

-- Function to check if post is liked by user
CREATE OR REPLACE FUNCTION public.is_post_liked_by_user(p_post_id UUID, p_user_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object('liked', true)
  FROM public.post_likes
  WHERE post_id = p_post_id AND user_id = p_user_id;
END;
$$;

-- Function to get followers count
CREATE OR REPLACE FUNCTION public.get_followers_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.follows
  WHERE following_id = user_id;
  
  RETURN count;
END;
$$;

-- Function to get following count
CREATE OR REPLACE FUNCTION public.get_following_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.follows
  WHERE follower_id = user_id;
  
  RETURN count;
END;
$$;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION public.is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.follows
    WHERE follower_id = $1 AND following_id = $2
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to follow a user
CREATE OR REPLACE FUNCTION public.follow_user(p_follower_id UUID, p_following_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_follower_id, p_following_id);
END;
$$;

-- Function to unfollow a user
CREATE OR REPLACE FUNCTION public.unfollow_user(p_follower_id UUID, p_following_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.follows
  WHERE follower_id = p_follower_id AND following_id = p_following_id;
END;
$$;
