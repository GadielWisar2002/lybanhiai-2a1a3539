import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type PackType = "medieval" | "space" | "cyber" | "academic" | "exclusive";

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

  // Academic Pack
  pencil: { id: "pencil", name: "Pencil", emoji: "✏️", rarity: "common", pack: "academic" },
  notebook: { id: "notebook", name: "Notebook", emoji: "📓", rarity: "common", pack: "academic" },
  book: { id: "book", name: "Book", emoji: "📖", rarity: "common", pack: "academic" },
  feather: { id: "feather", name: "Quill", emoji: "✒️", rarity: "rare", pack: "academic" },
  backpack: { id: "backpack", name: "Backpack", emoji: "🎒", rarity: "rare", pack: "academic" },
  diploma: { id: "diploma", name: "Diploma", emoji: "📜", rarity: "epic", pack: "academic" },
  microscope: { id: "microscope", name: "Microscope", emoji: "🔬", rarity: "epic", pack: "academic" },
  mortarboard: { id: "mortarboard", name: "Graduation Cap", emoji: "🎓", rarity: "legendary", pack: "academic" },

  // Exclusive Personalization Items Pack
  punk_hair: { id: "punk_hair", name: "Punk Hairstyle", emoji: "💇‍♂️", rarity: "rare", pack: "exclusive" },
  royal_robe: { id: "royal_robe", name: "Golden Robe", emoji: "🧥", rarity: "epic", pack: "exclusive" },
  cyber_sneakers: { id: "cyber_sneakers", name: "Cyber Sneakers", emoji: "👟", rarity: "rare", pack: "exclusive" },
  vr_glasses: { id: "vr_glasses", name: "VR Goggles", emoji: "🕶️", rarity: "epic", pack: "exclusive" },
  phoenix_pet: { id: "phoenix_pet", name: "Fire Phoenix", emoji: "🐦", rarity: "legendary", pack: "exclusive" },
  crystal_crown: { id: "crystal_crown", name: "Crystal Crown", emoji: "👑", rarity: "legendary", pack: "exclusive" },
};

export const PACK_COSTS: Record<PackType, number> = {
  medieval: 5,
  space: 10,
  academic: 12,
  cyber: 20,
  exclusive: 30,
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
  .inputValidator((input: unknown) => z.object({ pack: z.enum(["medieval", "space", "cyber", "academic", "exclusive"]) }).parse(input))
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

export const convertXpToCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amount: z.number().int().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const xpRequired = data.amount * 7000;

    const { data: s, error } = await supabase.from("streaks").select("total_xp, coins").eq("user_id", userId).maybeSingle();
    if (error || !s) throw new Error("No streaks record found");
    if (s.total_xp < xpRequired) throw new Error("Insufficient XP");

    const newXp = s.total_xp - xpRequired;
    const newCoins = s.coins + data.amount;

    await supabase.from("streaks").update({
      total_xp: newXp,
      coins: newCoins,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return { totalXp: newXp, coins: newCoins };
  });

export const unlockGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ gameId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    
    // Unlocking costs
    const costs: Record<string, number> = {
      "gold-quest": 500,
      "space-rush": 1000,
      "wordle": 100,
      "complete-concept": 200,
      "hangman": 300,
      "order-idea": 400,
      "connect-area": 500,
      "dictation": 600,
    };
    
    const cost = costs[data.gameId];
    if (cost === undefined) throw new Error("Invalid game ID");

    const { data: s, error } = await supabase.from("streaks").select("total_xp, coins, unlocked_games").eq("user_id", userId).maybeSingle();
    if (error || !s) throw new Error("No streaks record found");

    const unlocked = s.unlocked_games ?? [];
    if (unlocked.includes(data.gameId)) throw new Error("Game is already unlocked");
    if (s.total_xp < cost) throw new Error(`Insufficient XP. You need ${cost} XP to unlock this game!`);

    const newXp = s.total_xp - cost;
    const newUnlocked = [...unlocked, data.gameId];

    await supabase.from("streaks").update({
      total_xp: newXp,
      unlocked_games: newUnlocked,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return { totalXp: newXp, unlockedGames: newUnlocked };
  });

export const BLOOK_COSTS: Record<Rarity, number> = {
  common: 5,
  rare: 15,
  epic: 35,
  legendary: 70,
};

export const buyBlookDirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ blookId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const blook = BLOOKS[data.blookId];
    if (!blook) throw new Error("Invalid blook ID");

    const cost = BLOOK_COSTS[blook.rarity];

    // Get current coins
    const { data: s, error: fErr } = await supabase.from("streaks").select("coins").eq("user_id", userId).maybeSingle();
    if (fErr || !s) throw new Error("No streaks record found");
    if (s.coins < cost) throw new Error(`Sombreritos insuficientes. Necesitas ${cost} sombreritos.`);

    // Deduct coins
    const remainingCoins = s.coins - cost;
    await supabase.from("streaks").update({ coins: remainingCoins }).eq("user_id", userId);

    // Unlock in DB
    await supabase.from("user_blooks").upsert({
      user_id: userId,
      blook_id: blook.id,
      unlocked_at: new Date().toISOString(),
    });

    return {
      blook,
      remainingCoins,
    };
  });
