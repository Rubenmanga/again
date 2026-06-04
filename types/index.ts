// ─── Domain Types ─────────────────────────────────────────────────────────────
// These mirror the public schema defined in supabase/migrations/001_initial_schema.sql

export interface User {
  id: string
  email: string
  display_name: string | null
  onboarding_complete: boolean
  created_at: string
}

export interface Onboarding {
  id: string
  user_id: string
  fitness_level: 'never' | 'rusty' | 'active' | null
  primary_goal: 'rebuild_muscle' | 'lose_fat' | 'feel_better' | 'energy' | null
  available_time: 15 | 30 | 45 | 60 | null
  equipment: string[]
  schedule_days: number[]
  completed_at: string | null
}

export interface Exercise {
  id: string
  name: string
  muscle_groups: string[]
  category: 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'mobility' | null
  equipment_required: 'none' | 'dumbbells' | 'resistance_bands' | 'pull_up_bar' | null
  difficulty: 1 | 2 | 3 | 4 | 5 | null
  sets_default: number | null
  reps_default: number | null
  duration_seconds: number | null
  instructions: string | null
  coaching_cue: string | null
  easier_alternative_id: string | null
  gif_url: string | null
  video_url: string | null
  thumbnail_url: string | null
}

export interface Workout {
  id: string
  user_id: string
  title: string
  generated_by: 'rule_engine' | 'ai' | null
  duration_minutes: number | null
  intensity: 1 | 2 | 3 | 4 | 5 | null
  exercise_ids: string[]
  created_at: string
}

export interface WorkoutHistory {
  id: string
  user_id: string
  workout_id: string | null
  started_at: string
  completed_at: string | null
  duration_actual_minutes: number | null
  exercises_completed: number
  intensity_actual: 1 | 2 | 3 | 4 | 5 | null
  mood_before: 1 | 2 | 3 | 4 | 5 | null
  mood_after: 1 | 2 | 3 | 4 | 5 | null
}

export interface ProgressStats {
  id: string
  user_id: string
  week_start: string
  sessions_count: number
  minutes_trained: number
  streak_days: number
  consistency_pct: number
  avg_intensity: number | null
}

export interface AIGeneration {
  id: string
  user_id: string
  prompt_sent: string | null
  response_raw: string | null
  model_used: string | null
  used_as_workout_id: string | null
  created_at: string
}
