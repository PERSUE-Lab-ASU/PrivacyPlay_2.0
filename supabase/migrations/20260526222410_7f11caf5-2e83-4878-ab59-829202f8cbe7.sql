
drop policy "anyone can insert sessions" on public.sessions;
drop policy "anyone can insert events" on public.events;

create policy "public insert sessions" on public.sessions
  for insert to anon, authenticated
  with check (id is not null and (user_agent is null or length(user_agent) < 1000));

create policy "public insert events" on public.events
  for insert to anon, authenticated
  with check (
    session_id is not null
    and stage is not null and length(stage) < 64
    and event_type is not null and length(event_type) < 128
  );
