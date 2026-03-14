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
