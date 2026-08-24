DROP POLICY IF EXISTS "anyone can read events" ON public.events;
DROP POLICY IF EXISTS "anyone can read sessions" ON public.sessions;
REVOKE SELECT ON public.events FROM anon, authenticated;
REVOKE SELECT ON public.sessions FROM anon, authenticated;