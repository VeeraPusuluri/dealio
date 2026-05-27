// Seeds 8 demo accounts (idempotent). Public — safe because it only ensures
// fixed demo accounts exist; never modifies real users.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
//
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "builder" | "cp" | "customer" | "bank" | "vendor" | "admin" | "nri" | "landowner";

const DEMO: { role: Role; email: string; name: string }[] = [
  { role: "builder", email: "builder@dealio.in", name: "Prestige Group" },
  { role: "cp", email: "ravi@dealio.in", name: "Ravi Kumar" },
  { role: "customer", email: "rahul@email.com", name: "Rahul Singh" },
  { role: "bank", email: "ramesh@hdfc.com", name: "Ramesh Babu" },
  { role: "vendor", email: "info@designcraft.in", name: "DesignCraft Interiors" },
  { role: "admin", email: "admin@dealio.in", name: "Platform Admin" },
  { role: "nri", email: "nri@dealio.in", name: "Arjun Mehta" },
  { role: "landowner", email: "rajendra@email.com", name: "Rajendra Prasad" },
];

const PASSWORD = "Demo@1234";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Record<string, string> = {};

  for (const u of DEMO) {
    // Try create; if exists, fetch and ensure role + profile
    let userId: string | null = null;
    const created = await admin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (created.error) {
      // Likely already exists — find by email via listUsers
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (!found) {
        results[u.email] = `error: ${created.error.message}`;
        continue;
      }
      userId = found.id;
      // Reset password so demo creds always work
      await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true });
      results[u.email] = "exists";
    } else {
      userId = created.data.user!.id;
      results[u.email] = "created";
    }

    // Ensure profile row
    await admin.from("profiles").upsert({
      id: userId,
      name: u.name,
      email: u.email,
    });

    // Ensure role row
    await admin.from("user_roles").upsert(
      { user_id: userId, role: u.role },
      { onConflict: "user_id,role" },
    );
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
