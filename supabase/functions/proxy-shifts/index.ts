import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') as string;

serve(async (req) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*', // Or restrict to your domain
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  });

  // Preflight (CORS) support
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers, status: 405 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase
      .from('work_schedules')  // ← Use your actual table name
      .select('*')

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch work shifts', details: error.message }),
        { headers, status: 500 }
      );
    }

    return new Response(JSON.stringify({ data }), { headers, status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers, status: 500 }
    );
  }
});