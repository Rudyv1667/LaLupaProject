// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseKey = 'TU_SUPABASE_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
