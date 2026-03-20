import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Pluggy credentials not configured');
    }

    // Authenticate
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      const errBody = await authRes.text();
      throw new Error(`Pluggy auth failed [${authRes.status}]: ${errBody}`);
    }

    const { apiKey } = await authRes.json();

    const { itemId, action } = await req.json();

    if (!itemId) {
      throw new Error('itemId is required');
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    };

    if (action === 'transactions') {
      // Fetch transactions
      const res = await fetch(`https://api.pluggy.ai/transactions?itemId=${itemId}&pageSize=100`, {
        headers,
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Pluggy transactions failed [${res.status}]: ${errBody}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Fetch accounts
      const res = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
        headers,
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Pluggy accounts failed [${res.status}]: ${errBody}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
