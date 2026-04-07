import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Registration {
  id: string
  parentName: string
  childName: string
  childAge: string
  phone: string
  email: string
  consent: boolean
  createdAt: string
  checkedIn?: boolean
  checkedInAt?: string
  status?: 'ticket' | 'waitlist'
}

// Database type helper
export interface DBRegistration {
  id: string
  parent_name: string
  child_name: string
  child_age: string
  phone: string
  email: string
  consent: boolean
  created_at: string
  checked_in: boolean
  checked_in_at?: string
  status: string
}

export function mapFromDB(db: DBRegistration): Registration {
  return {
    id: db.id,
    parentName: db.parent_name,
    childName: db.child_name,
    childAge: db.child_age,
    phone: db.phone,
    email: db.email,
    consent: db.consent,
    createdAt: db.created_at,
    checkedIn: db.checked_in,
    checkedInAt: db.checked_in_at,
    status: db.status as 'ticket' | 'waitlist'
  }
}

export function mapToDB(reg: Registration) {
  return {
    id: reg.id,
    parent_name: reg.parentName,
    child_name: reg.childName,
    child_age: reg.childAge,
    phone: reg.phone,
    email: reg.email,
    consent: reg.consent,
    created_at: reg.createdAt,
    checked_in: reg.checkedIn || false,
    checked_in_at: reg.checkedInAt,
    status: reg.status || 'ticket'
  }
}
