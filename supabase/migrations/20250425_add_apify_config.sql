
-- Create app_features table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policy to protect the config
ALTER TABLE app_features ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to read config
CREATE POLICY "Allow authenticated users to read app_features"
ON app_features FOR SELECT
TO authenticated
USING (true);

-- Insert the Apify API key
INSERT INTO app_features (feature_name, config)
VALUES (
  'apify',
  jsonb_build_object('api_key', '${process.env.APIFY_API_KEY}')
)
ON CONFLICT (feature_name) 
DO UPDATE SET 
  config = jsonb_build_object('api_key', '${process.env.APIFY_API_KEY}'),
  updated_at = now()
WHERE app_features.feature_name = 'apify';
