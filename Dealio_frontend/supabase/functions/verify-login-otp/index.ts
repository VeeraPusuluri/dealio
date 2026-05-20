import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { code } = await req.json();
    if (!code || !/^\d{6}$/.test(String(code))) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    const { data: rows, error: selErr } = await supabase
      .from("login_otps")
      .select("*")
      .eq("user_id", user.id)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (selErr) throw selErr;
    const row = rows?.[0];
    if (!row) return new Response(JSON.stringify({ error: "No active code. Request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabase.from("login_otps").update({ consumed: true }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Code expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (row.attempts >= 5) {
      await supabase.from("login_otps").update({ consumed: true }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Too many attempts. Request a new code." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const hash = await sha256(String(code));
    if (hash !== row.code_hash) {
      await supabase.from("login_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("login_otps").update({ consumed: true }).eq("id", row.id);
    // Mark the user's profile as verified after a successful OTP check
    await supabase.from("profiles").update({ email_verified: true }).eq("id", user.id);
    return new Response(JSON.stringify({ ok: true, email_verified: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
