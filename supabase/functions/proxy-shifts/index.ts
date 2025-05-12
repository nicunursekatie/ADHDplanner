// Load .env in local dev. Remove in production on Supabase Edge.
import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Load environment variables ─────────────────────────────────
// Use the variable NAMES from your .env, not the actual URL/key strings.
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_KEY") || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  Deno.exit(1);
}

// Create Supabase client once
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Edge function handler ───────────────────────────────────────
serve(async (req) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Query your work_schedules table
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*');

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch work shifts', details: error.message }),
        { status: 500, headers }
      );
    }

    return new Response(JSON.stringify({ data }), { status: 200, headers });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers }
    );
  }
});
