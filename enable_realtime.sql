-- Ensure Realtime is enabled for the friendships table
BEGIN;
  -- Remove if exists to avoid duplication errors (though ADD is usually safe)
  -- ALTER PUBLICATION supabase_realtime DROP TABLE public.friendships;
  
  -- Add it explicitly
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
COMMIT;
