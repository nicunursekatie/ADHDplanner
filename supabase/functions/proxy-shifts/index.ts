import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Load environment variables ─────────────────────────────────
const supabaseUrl = Deno.env.get("https://qhucdunadrbnfcjdnkxr.supabase.co") || "";
const supabaseKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWNkdW5hZHJibmZjamRua3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwOTU3OSwiZXhwIjoyMDYyNDg1NTc5fQ.mUhXVB7sCpoZoq4MdOyCWANz-oHdK5-GC0IpqeRozKI") || "";
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  Deno.exit(1);
}

// Create Supabase client once
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Edge function handler ───────────────────────────────────────
serve(async (req) => {
  // Common CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*', // restrict in production
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only GET supported
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Query the table
    const { data, error } = await supabase
      .from('work_schedules')  // ← replace with your actual table name
      .select('*');

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch work shifts', details: error.message }),
        { status: 500, headers }
      );
    }

    // Return the data
    return new Response(JSON.stringify({ data }), { status: 200, headers });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
});
