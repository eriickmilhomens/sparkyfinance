import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require a shared secret to prevent unauthorized access
    const BOOTSTRAP_SECRET = Deno.env.get("BOOTSTRAP_SECRET");
    if (!BOOTSTRAP_SECRET) {
      return new Response(JSON.stringify({ error: "Bootstrap function is disabled. Set BOOTSTRAP_SECRET to enable." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providedSecret = req.headers.get("x-bootstrap-secret");
    if (!providedSecret || providedSecret !== BOOTSTRAP_SECRET) {
      return new Response(JSON.stringify({ error: "Invalid or missing bootstrap secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === email);

    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
      await supabaseAdmin.from("profiles").update({ role: "admin" }).eq("user_id", existing.id);

      return new Response(JSON.stringify({ success: true, message: "Admin user updated", userId: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Admin Sparky" },
    });

    if (createError) throw createError;

    return new Response(JSON.stringify({ success: true, message: "Admin user created", userId: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-bootstrap error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
