
-- Function to ensure a user has a referral code
-- This is a SQL version that complements the Edge Function
CREATE OR REPLACE FUNCTION public.ensure_user_has_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ref_code TEXT;
BEGIN
    -- Check if user already has a referral code
    SELECT referral_code INTO ref_code FROM public.users WHERE id = user_id;
    
    -- If no referral code, generate one using the existing function
    IF ref_code IS NULL THEN
        -- Call the existing function to generate a code
        UPDATE public.users 
        SET referral_code = public.generate_referral_code()
        WHERE id = user_id
        RETURNING referral_code INTO ref_code;
    END IF;
    
    RETURN ref_code;
END;
$$;
