import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OnboardingSchema = z.object({
  hobbies: z.array(z.string().max(50)).max(20).default([]),
  skills: z.array(z.string().max(50)).max(20).default([]),
  interests: z.string().max(2000).default(""),
  favorite_subjects: z.array(z.object({ key: z.string().max(50), rating: z.number().int().min(0).max(5) })).max(20),
  budget_monthly: z.number().min(0).max(100000).nullable().optional(),
  country: z.string().max(80).optional(),
  university_type: z.enum(["public", "private", "online", "any"]).optional(),
});

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OnboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("user_profile_data").upsert({
      user_id: userId,
      hobbies: data.hobbies,
      skills: data.skills,
      interests: data.interests,
      favorite_subjects: data.favorite_subjects,
      budget_monthly: data.budget_monthly ?? null,
      country: data.country ?? null,
      university_type: data.university_type ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_profile_data").select("*").eq("user_id", userId).maybeSingle();
    return data;
  });
