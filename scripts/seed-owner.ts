import { createClient } from "@supabase/supabase-js";

async function seedOwner() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  const name = process.env.SEED_OWNER_NAME || "Agency Owner";

  if (!url || !serviceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
    process.exit(1);
  }

  if (!email || !password) {
    console.error("Error: SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD environment variables are required.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Provisioning initial owner: ${email}...`);

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError) {
    console.error("Failed to create user in auth.users:", createError.message);
    process.exit(1);
  }

  const userId = userData.user.id;
  console.log(`Auth user created with ID: ${userId}`);

  const { error: staffError } = await supabase.from("staff").upsert({
    id: userId,
    name,
    email: email.toLowerCase().trim(),
    role: "owner",
    status: "active",
    created_at: new Date().toISOString(),
  });

  if (staffError) {
    console.error("Failed to create record in public.staff:", staffError.message);
    process.exit(1);
  }

  console.log("✓ Initial owner provisioned successfully!");
  console.log("You can now sign in at /control-room/login and enroll your TOTP authenticator app.");
}

seedOwner().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
