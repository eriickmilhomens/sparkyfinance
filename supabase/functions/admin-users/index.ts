import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using service role (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (req.method === "GET" || action === "list") {
      // List all users
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");

      const users = authUsers?.users?.map(u => {
        const prof = profiles?.find(p => p.user_id === u.id);
        return {
          id: u.id,
          email: u.email || null,
          phone: u.phone || null,
          name: prof?.name || u.user_metadata?.full_name || "Sem nome",
          role: prof?.role || "user",
          points: prof?.points || 0,
          avatar_url: prof?.avatar_url || u.user_metadata?.avatar_url || null,
          provider: u.app_metadata?.provider || "email",
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at,
        };
      }) || [];

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "delete_user") {
        const targetId = body.userId;
        if (!targetId) {
          return new Response(JSON.stringify({ error: "userId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Don't allow deleting yourself
        if (targetId === user.id) {
          return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete from auth (cascade will delete profile)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId);
        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true, message: "User deleted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "delete_all_users") {
        // Delete all users EXCEPT the requesting admin
        const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
        const toDelete = allUsers?.users?.filter(u => u.id !== user.id) || [];

        let deleted = 0;
        for (const u of toDelete) {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
          if (!error) deleted++;
        }

        return new Response(JSON.stringify({ success: true, message: `${deleted} users deleted`, deleted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-users error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
