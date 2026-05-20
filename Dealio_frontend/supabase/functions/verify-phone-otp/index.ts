// Verify phone OTP and return a magic-link token_hash for the client to sign in.
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
    const { phone, code } = await req.json();
    if (!phone || !code) throw new Error("Missing phone or code");
    const digits = phone.replace(/\D/g, "");
    const email = `${digits}@phone.dealio.local`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows } = await supabase
      .from("login_otps")
      .select("*")
      .eq("email", email)
      .eq("purpose", "phone")
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const otp = rows?.[0];
    if (!otp) throw new Error("No active code. Please resend.");
    if (new Date(otp.expires_at) < new Date()) throw new Error("Code expired. Please resend.");
    if (otp.attempts >= 5) throw new Error("Too many attempts. Please resend.");

    const hash = await sha256(String(code));
    if (hash !== otp.code_hash) {
      await supabase.from("login_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      throw new Error("Incorrect code");
    }

    await supabase.from("login_otps").update({ consumed: true }).eq("id", otp.id);

    // Generate a magic link the client can verify to obtain a session
    const { data: link, error: lErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (lErr) throw lErr;

    return new Response(JSON.stringify({
      ok: true,
      email,
      token_hash: link.properties?.hashed_token,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
