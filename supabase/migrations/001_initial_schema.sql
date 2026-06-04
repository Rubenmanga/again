create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  onboarding_complete boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

create table public.onboarding (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  fitness_level text check (fitness_level in ('never', 'rusty', 'active')),
  primary_goal text check (primary_goal in ('rebuild_muscle', 'lose_fat', 'feel_better', 'energy')),
  available_time integer check (available_time in (15, 30, 45, 60)),
  equipment text[] default '{}',
  schedule_days integer[] default '{}',
  completed_at timestamp with time zone
);

create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_groups text[] not null,
  category text check (category in ('full_body','upper_body','lower_body','core','cardio','mobility')),
  equipment_required text check (equipment_required in ('none','dumbbells','resistance_bands','pull_up_bar')),
  difficulty integer check (difficulty between 1 and 5),
  sets_default integer,
  reps_default integer,
  duration_seconds integer,
  instructions text,
  coaching_cue text,
  easier_alternative_id uuid references public.exercises,
  gif_url text,
  video_url text,
  thumbnail_url text
);

create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  generated_by text check (generated_by in ('rule_engine','ai')),
  duration_minutes integer,
  intensity integer check (intensity between 1 and 5),
  exercise_ids uuid[] default '{}',
  created_at timestamp with time zone default timezone('utc', now())
);

create table public.workout_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  workout_id uuid references public.workouts on delete set null,
  started_at timestamp with time zone default timezone('utc', now()),
  completed_at timestamp with time zone,
  duration_actual_minutes integer,
  exercises_completed integer default 0,
  intensity_actual integer check (intensity_actual between 1 and 5),
  mood_before integer check (mood_before between 1 and 5),
  mood_after integer check (mood_after between 1 and 5)
);

create table public.progress_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  week_start date not null,
  sessions_count integer default 0,
  minutes_trained integer default 0,
  streak_days integer default 0,
  consistency_pct integer default 0,
  avg_intensity numeric(3,1)
);

create table public.ai_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  prompt_sent text,
  response_raw text,
  model_used text,
  used_as_workout_id uuid references public.workouts on delete set null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.onboarding enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_history enable row level security;
alter table public.progress_stats enable row level security;
alter table public.ai_generations enable row level security;

create policy "Users can read own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);
create policy "Users can read own onboarding" on public.onboarding for all using (auth.uid() = user_id);
create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id);
create policy "Users can manage own history" on public.workout_history for all using (auth.uid() = user_id);
create policy "Users can manage own stats" on public.progress_stats for all using (auth.uid() = user_id);
create policy "Users can manage own ai generations" on public.ai_generations for all using (auth.uid() = user_id);
