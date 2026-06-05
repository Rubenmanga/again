-- Fix: exercises table was missing RLS + read policy.
-- Without this, authenticated users get 0 rows back from the exercises query,
-- which triggers the "No pudimos generar el entrenamiento" error in generate-workout.ts.

alter table public.exercises enable row level security;

create policy "Exercises are readable by all authenticated users"
  on public.exercises
  for select
  using (auth.role() = 'authenticated');
