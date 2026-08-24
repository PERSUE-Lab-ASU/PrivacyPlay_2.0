
create table public.sessions (
  id uuid primary key,
  started_at timestamptz default now(),
  user_agent text,
  screen_size text
);
create table public.events (
  id bigserial primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  stage text,
  event_type text,
  event_data jsonb,
  client_timestamp timestamptz default now()
);
create index events_session_idx on public.events(session_id);
create index events_stage_idx on public.events(stage);
create index events_type_idx on public.events(event_type);

grant select, insert on public.sessions to anon, authenticated;
grant all on public.sessions to service_role;
grant select, insert on public.events to anon, authenticated;
grant usage, select on sequence public.events_id_seq to anon, authenticated;
grant all on public.events to service_role;
grant all on sequence public.events_id_seq to service_role;

alter table public.sessions enable row level security;
alter table public.events enable row level security;

create policy "anyone can insert sessions" on public.sessions for insert to anon, authenticated with check (true);
create policy "anyone can read sessions" on public.sessions for select to anon, authenticated using (true);
create policy "anyone can insert events" on public.events for insert to anon, authenticated with check (true);
create policy "anyone can read events" on public.events for select to anon, authenticated using (true);
