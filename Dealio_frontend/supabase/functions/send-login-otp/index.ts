// Generates a 6-digit OTP, stores its SHA-256 hash, and "sends" it.
// If RESEND_API_KEY is configured, emails it; otherwise returns it for demo.
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    // 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate older codes for this user
    await supabase.from("login_otps").update({ consumed: true }).eq("user_id", user.id).eq("consumed", false);

    const { error: insErr } = await supabase.from("login_otps").insert({
      user_id: user.id,
      email: user.email,
      code_hash,
      expires_at,
    });
    if (insErr) throw insErr;

    // Try to send email via Resend if configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let delivered = false;
    if (resendKey && user.email) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Dealio <onboarding@resend.dev>",
            to: [user.email],
            subject: "Your Dealio login code",
            html: `<div style="font-family:Inter,sans-serif;padding:24px;background:#fff">
              <h2 style="color:#1B3A5C">Your login code</h2>
              <p>Use this 6-digit code to finish signing in. It expires in 5 minutes.</p>
              <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0A7E8C">${code}</p>
              <p style="color:#666;font-size:12px">If you didn't try to sign in, you can ignore this email.</p>
            </div>`,
          }),
        });
        delivered = r.ok;
      } catch (_) { delivered = false; }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        delivered,
        // Demo fallback: include the code when no email provider is configured
        demo_code: delivered ? undefined : code,
        expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
