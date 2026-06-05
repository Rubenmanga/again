-- 1. energy_mode en workouts
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS energy_mode text
  CHECK (energy_mode IN ('normal', 'low', 'minimal', 'bare'));

-- 2. energy_mode en workout_history (para analytics futuros)
ALTER TABLE public.workout_history
  ADD COLUMN IF NOT EXISTS energy_mode text
  CHECK (energy_mode IN ('normal', 'low', 'minimal', 'bare'));

-- 3. Tabla workout_sessions (resume support)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  workout_id uuid REFERENCES public.workouts ON DELETE CASCADE NOT NULL,
  current_exercise_index integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now()),
  UNIQUE(user_id, workout_id)
);
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions"
  ON public.workout_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 4. Tabla exercise_preferences
CREATE TABLE IF NOT EXISTS public.exercise_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES public.exercises ON DELETE CASCADE NOT NULL,
  preference_type text NOT NULL CHECK (preference_type IN ('disliked')),
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now()),
  UNIQUE(user_id, exercise_id)
);
ALTER TABLE public.exercise_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences"
  ON public.exercise_preferences FOR ALL
  USING (auth.uid() = user_id);
