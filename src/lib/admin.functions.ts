import { createServerFn } from "@tanstack/react-start";

export const fetchAdminData = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => {
    if (!input || typeof input.password !== "string" || input.password.length > 200) {
      throw new Error("Invalid input");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD || "let-me-in";
    if (data.password !== expected) {
      throw new Error("Unauthorized");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: events }, { data: sessions }] = await Promise.all([
      supabaseAdmin.from("events").select("*").order("client_timestamp", { ascending: false }).limit(5000),
      supabaseAdmin.from("sessions").select("*").limit(1000),
    ]);
    return { events: events ?? [], sessions: sessions ?? [] };
  });
