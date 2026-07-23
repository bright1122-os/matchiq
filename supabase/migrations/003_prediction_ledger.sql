-- Prediction ledger: permanent, structured record of every analysis.
-- Run this in the Supabase SQL editor before the app's ledger writes can work.

create table if not exists public.predictions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users not null,
  fixture_id          text not null,
  home_team           text not null,
  away_team           text not null,
  competition         text not null,
  competition_code    text,
  kickoff_at          timestamptz not null,
  analyzed_at         timestamptz default now(),

  -- market context at time of analysis
  odds_home           numeric,
  odds_draw           numeric,
  odds_away           numeric,
  implied_home_prob   numeric,
  implied_draw_prob   numeric,
  implied_away_prob   numeric,

  -- synthesis output
  pick                text not null,
  confidence          numeric not null,
  confidence_label    text,
  model_probability   numeric,
  value_edge          numeric,
  bet_units           numeric,
  reasoning           text,
  data_quality        text,

  -- resolution (filled in later, after the match finishes)
  resolved            boolean default false,
  actual_result       text,
  final_score_home    integer,
  final_score_away    integer,
  correct             boolean,
  resolved_at         timestamptz,
  resolution_method   text
);

create table if not exists public.prediction_agents (
  id                  uuid primary key default gen_random_uuid(),
  prediction_id       uuid references public.predictions(id) on delete cascade not null,
  agent_type          text not null,
  edge                text,
  verdict_text        text,
  key_factors         jsonb default '[]',
  agreed_with_final   boolean,
  correct             boolean
);

create index if not exists predictions_user_id_idx on public.predictions (user_id);
create index if not exists predictions_fixture_id_idx on public.predictions (fixture_id);
create index if not exists predictions_resolved_idx on public.predictions (resolved);
create index if not exists prediction_agents_prediction_id_idx on public.prediction_agents (prediction_id);
create index if not exists prediction_agents_agent_type_idx on public.prediction_agents (agent_type);

alter table public.predictions enable row level security;
create policy "Users read own predictions" on public.predictions
  for select using (auth.uid() = user_id);
create policy "Users insert own predictions" on public.predictions
  for insert with check (auth.uid() = user_id);
create policy "Users update own predictions" on public.predictions
  for update using (auth.uid() = user_id);

alter table public.prediction_agents enable row level security;
create policy "Users read own prediction agents" on public.prediction_agents
  for select using (
    exists (select 1 from public.predictions
      where predictions.id = prediction_agents.prediction_id
      and predictions.user_id = auth.uid())
  );
create policy "Users insert own prediction agents" on public.prediction_agents
  for insert with check (
    exists (select 1 from public.predictions
      where predictions.id = prediction_agents.prediction_id
      and predictions.user_id = auth.uid())
  );
create policy "Users update own prediction agents" on public.prediction_agents
  for update using (
    exists (select 1 from public.predictions
      where predictions.id = prediction_agents.prediction_id
      and predictions.user_id = auth.uid())
  );
