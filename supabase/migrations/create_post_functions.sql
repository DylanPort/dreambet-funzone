
-- Function to increment post likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement post likes count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comment count on posts
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comment count on posts
CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comment likes count
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET likes_count = likes_count + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comment likes count
CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversations for a user
CREATE OR REPLACE FUNCTION get_conversations(user_id UUID)
RETURNS TABLE (
  conversation_user_id UUID,
  conversation_username TEXT,
  conversation_avatar_url TEXT,
  conversation_display_name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH last_messages AS (
    SELECT DISTINCT ON (
      CASE
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END
    )
      CASE
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END AS other_user_id,
      content,
      created_at,
      sender_id = user_id AS is_sender
    FROM
      messages
    WHERE
      sender_id = user_id OR recipient_id = user_id
    ORDER BY
      other_user_id,
      created_at DESC
  ),
  unread_counts AS (
    SELECT
      sender_id,
      COUNT(*) AS count
    FROM
      messages
    WHERE
      recipient_id = user_id AND
      is_read = false
    GROUP BY
      sender_id
  )
  SELECT
    lm.other_user_id AS conversation_user_id,
    u.username AS conversation_username,
    u.avatar_url AS conversation_avatar_url,
    u.display_name AS conversation_display_name,
    lm.content AS last_message,
    lm.created_at AS last_message_time,
    COALESCE(uc.count, 0) AS unread_count
  FROM
    last_messages lm
  JOIN
    users u ON u.id = lm.other_user_id
  LEFT JOIN
    unread_counts uc ON uc.sender_id = lm.other_user_id
  ORDER BY
    lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
