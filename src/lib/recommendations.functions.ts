import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RecInput = z.object({ language: z.enum(["es", "en", "fr"]).default("es") });

type University = { name: string; country: string; estimated_cost_usd: number; type: string; notes: string };
type Recommendation = {
  career_name: string;
  match_score: number;
  reasoning: string;
  tags: string[];
  universities: University[];
};

export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RecInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("user_profile_data").select("*").eq("user_id", userId).maybeSingle();
    if (!profile) throw new Error("Complete onboarding first");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const lang = data.language;
    const langLabel = lang === "es" ? "Spanish" : lang === "fr" ? "French" : "English";

    const sys = `You are a career counselor for teenagers. Respond in ${langLabel}. Recommend 5 careers strongly aligned with the user profile, with realistic universities within budget.`;
    const userMsg = JSON.stringify({
      skills: profile.skills, hobbies: profile.hobbies, interests: profile.interests,
      favorite_subjects: profile.favorite_subjects, budget_monthly_usd: profile.budget_monthly,
      country: profile.country, university_type: profile.university_type,
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        tools: [{
          type: "function",
          function: {
            name: "submit_recommendations",
            description: "Return 5 career recommendations",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      career_name: { type: "string" },
                      match_score: { type: "integer", minimum: 0, maximum: 100 },
                      reasoning: { type: "string" },
                      tags: { type: "array", items: { type: "string" } },
                      universities: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" }, country: { type: "string" },
                            estimated_cost_usd: { type: "number" }, type: { type: "string" }, notes: { type: "string" },
                          },
                          required: ["name", "country", "estimated_cost_usd", "type", "notes"],
                        },
                      },
                    },
                    required: ["career_name", "match_score", "reasoning", "tags", "universities"],
                  },
                },
              },
              required: ["recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_recommendations" } },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit. Try again soon.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add funds in workspace.");
    if (!res.ok) throw new Error(`AI error ${res.status}`);

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no recommendations");
    const parsed: { recommendations: Recommendation[] } = JSON.parse(args);

    await supabase.from("recommendations").delete().eq("user_id", userId);
    const rows = parsed.recommendations.map((r) => ({
      user_id: userId, career_name: r.career_name, match_score: r.match_score,
      reasoning: r.reasoning, tags: r.tags, universities: r.universities,
      language: lang,
    }));
    const { error } = await supabase.from("recommendations").insert(rows);
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });

export const listRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("recommendations").select("*").eq("user_id", userId).order("match_score", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
