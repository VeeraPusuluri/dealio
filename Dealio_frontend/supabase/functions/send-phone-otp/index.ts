// Phone OTP (demo). Creates auth user on signup, stores hashed OTP, returns code.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function phoneToEmail(p: string) {
  const digits = p.replace(/\D/g, "");
  return `${digits}@phone.dealio.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { phone, name, role, mode } = await req.json();
    if (!phone) throw new Error("Missing phone");
    if (mode === "signup" && !name) throw new Error("Name required for signup");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const email = phoneToEmail(phone);

    // Find or create user
    const { data: list } = await supabase.auth.admin.listUsers();
    let user = list.users.find((u) => u.email === email);

    if (!user) {
      if (mode !== "signup") {
        return new Response(JSON.stringify({ error: "No account found for this phone. Please sign up." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const password = crypto.randomUUID() + "Aa1!";
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone, role: role || "customer" },
      });
      if (cErr) throw cErr;
      user = created.user;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from("login_otps").update({ consumed: true })
      .eq("user_id", user!.id).eq("purpose", "phone").eq("consumed", false);

    const { error: insErr } = await supabase.from("login_otps").insert({
      user_id: user!.id, email, code_hash, expires_at, purpose: "phone",
    });
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, demo_code: code, email, expires_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
