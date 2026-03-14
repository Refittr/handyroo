import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Builder {
  id: string
  name: string
}

export interface HouseSchema {
  id: string
  builder_id: string
  model_name: string
  bedrooms: number
  property_type: string
  exterior_photo_url?: string | null
  floor_plan_url?: string | null
  builders?: Builder
}

export interface Room {
  id: string
  house_schema_id: string
  room_name: string
  room_type: string
  floor_level: number
  length_cm: number
  width_cm: number
  height_cm: number
  door_count: number | null
  window_count: number | null
}

export interface HouseRequest {
  id?: string
  builder_name: string
  house_type: string
  email: string
  status?: string
  created_at?: string
}

export interface ProjectRequest {
  id?: string
  project_description: string
  email: string
  status?: string
  created_at?: string
}

export interface HandyrooSession {
  id?: string
  house_schema_id: string
  room_id: string
  job_template_id: string
  user_inputs: Record<string, unknown>
  configured_defaults: Record<string, number>
  doorways: Array<{ other_side: string; bar_type: string }>
  calculated_output: Record<string, number>
  created_at?: string
}
