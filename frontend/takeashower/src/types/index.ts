export interface User {
  id: string         // Supabase gives every user a uuid
  username: string
}
 
// union type
export type ScheduleInterval = 'daily' | 'every-other' | 'every-two'
 
export interface UserProfile {
  id: string
  username: string
  schedule_interval: ScheduleInterval
  shower_time: string   // stored as HH:MM
}
 
export interface ShowerOverride {
  id: string
  user_id: string
  date: string          // stored as YYYY-MM-DD
  is_shower_day: boolean
}