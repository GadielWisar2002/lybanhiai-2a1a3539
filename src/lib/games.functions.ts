import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type PackType = "medieval" | "space" | "cyber";

export interface Blook {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  pack: PackType;
}

export const BLOOKS: Record<string, Blook> = {
  // Medieval Pack
  knight: { id: "knight", name: "Knight", emoji: "⚔️", rarity: "common", pack: "medieval" },
  mage: { id: "mage", name: "Mage", emoji: "🧙‍♂️", rarity: "rare", pack: "medieval" },
  dragon: { id: "dragon", name: "Dragon", emoji: "🐉", rarity: "epic", pack: "medieval" },
  king: { id: "king", name: "King", emoji: "👑", rarity: "legendary", pack: "medieval" },

  // Space Pack
  astronaut: { id: "astronaut", name: "Astronaut", emoji: "👨‍🚀", rarity: "common", pack: "space" },
  alien: { id: "alien", name: "Alien", emoji: "👽", rarity: "rare", pack: "space" },
  rocket: { id: "rocket", name: "Rocket", emoji: "🚀", rarity: "epic", pack: "space" },
  ufo: { id: "ufo", name: "UFO", emoji: "🛸", rarity: "legendary", pack: "space" },

  // Cyber Pack
  robot: { id: "robot", name: "Robot", emoji: "🤖", rarity: "common", pack: "cyber" },
  hacker: { id: "hacker", name: "Hacker", emoji: "💻", rarity: "rare", pack: "cyber" },
  cyborg: { id: "cyborg", name: "Cyborg", emoji: "🦾", rarity: "epic", pack: "cyber" },
  ai: { id: "ai", name: "Super AI", emoji: "🧠", rarity: "legendary", pack: "cyber" },
};

export const PACK_COSTS: Record<PackType, number> = {
  medieval: 5,
  space: 10,
  cyber: 20,
};

export const listUnlockedBlooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: userBlooks } = await supabase.from("user_blooks").select("blook_id").eq("user_id", userId);
    const { data: profile } = await supabase.from("profiles").select("active_blook_id").eq("id", userId).maybeSingle();
    
    return {
      unlockedIds: (userBlooks ?? []).map(ub => ub.blook_id),
      activeBlookId: profile?.active_blook_id ?? null,
    };
  });

export const buyBlookPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ pack: z.enum(["medieval", "space", "cyber"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cost = PACK_COSTS[data.pack];

    // Get current coins
    const { data: s, error: fErr } = await supabase.from("streaks").select("coins").eq("user_id", userId).maybeSingle();
    if (fErr || !s) throw new Error("No streaks record found");
    if (s.coins < cost) throw new Error("Insufficient coins. Answer more quizzes!");

    // Deduct coins
    const remainingCoins = s.coins - cost;
    await supabase.from("streaks").update({ coins: remainingCoins }).eq("user_id", userId);

    // Roll random blook based on pack
    const packBlooks = Object.values(BLOOKS).filter(b => b.pack === data.pack);
    const roll = Math.random() * 100;
    let selectedRarity: Rarity = "common";
    if (roll < 5) selectedRarity = "legendary";
    else if (roll < 20) selectedRarity = "epic";
    else if (roll < 50) selectedRarity = "rare";

    let rolledBlooks = packBlooks.filter(b => b.rarity === selectedRarity);
    if (rolledBlooks.length === 0) rolledBlooks = packBlooks.filter(b => b.rarity === "common");
    
    const chosenBlook = rolledBlooks[Math.floor(Math.random() * rolledBlooks.length)];

    // Unlock in DB
    await supabase.from("user_blooks").upsert({
      user_id: userId,
      blook_id: chosenBlook.id,
      unlocked_at: new Date().toISOString(),
    });

    return {
      blook: chosenBlook,
      remainingCoins,
    };
  });

export const equipBlook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ blookId: z.string().nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({ active_blook_id: data.blookId, updated_at: new Date().toISOString() }).eq("id", userId);
    return { ok: true };
  });

export const rewardGameCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ coins: z.number().int().min(1).max(50) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: s } = await supabase.from("streaks").select("coins").eq("user_id", userId).maybeSingle();
    const currentCoins = s?.coins ?? 0;
    const nextCoins = currentCoins + data.coins;
    
    await supabase.from("streaks").update({ coins: nextCoins }).eq("user_id", userId);
    return { coins: nextCoins };
  });
