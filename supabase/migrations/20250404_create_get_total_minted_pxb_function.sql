
-- Create a database function to get the total minted PXB
CREATE OR REPLACE FUNCTION public.get_total_minted_pxb()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(points), 0)
  FROM public.users
  WHERE points > 0;
$$;
