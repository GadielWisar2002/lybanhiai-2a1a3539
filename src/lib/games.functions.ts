import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEVELOPER_EMAIL = "debanhivillanueva@colegiomaranatha.edu.mx";

const isDeveloperClaim = (claims: unknown) =>
  ((claims as { email?: string } | null)?.email ?? "").toLowerCase() === DEVELOPER_EMAIL;

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type PackType = "school" | "science" | "art" | "graduation";

export interface Blook {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  pack: PackType;
}

export const BLOOKS: Record<string, Blook> = {
  // School Pack (Escolar)
  pencil: { id: "pencil", name: "Pencil", emoji: "✏️", rarity: "common", pack: "school" },
  notebook: { id: "notebook", name: "Notebook", emoji: "📓", rarity: "common", pack: "school" },
  book: { id: "book", name: "Book", emoji: "📖", rarity: "common", pack: "school" },
  backpack: { id: "backpack", name: "Backpack", emoji: "🎒", rarity: "common", pack: "school" },
  ruler: { id: "ruler", name: "Ruler", emoji: "📐", rarity: "rare", pack: "school" },
  apple: { id: "apple", name: "Teacher's Apple", emoji: "🍎", rarity: "rare", pack: "school" },

  // Science Pack (Ciencias)
  test_tube: { id: "test_tube", name: "Test Tube", emoji: "🧪", rarity: "common", pack: "science" },
  magnet: { id: "magnet", name: "Magnet", emoji: "🧲", rarity: "common", pack: "science" },
  atom: { id: "atom", name: "Atom", emoji: "⚛️", rarity: "rare", pack: "science" },
  microscope: { id: "microscope", name: "Microscope", emoji: "🔬", rarity: "epic", pack: "science" },
  telescope: { id: "telescope", name: "Telescope", emoji: "🔭", rarity: "epic", pack: "science" },
  dna: { id: "dna", name: "DNA", emoji: "🧬", rarity: "legendary", pack: "science" },

  // Art & Culture Pack (Arte y Cultura)
  palette: { id: "palette", name: "Painter's Palette", emoji: "🎨", rarity: "common", pack: "art" },
  globe: { id: "globe", name: "Globe", emoji: "🌍", rarity: "common", pack: "art" },
  drama_mask: { id: "drama_mask", name: "Drama Mask", emoji: "🎭", rarity: "rare", pack: "art" },
  music_notes: { id: "music_notes", name: "Music Notes", emoji: "🎶", rarity: "rare", pack: "art" },
  feather: { id: "feather", name: "Quill", emoji: "✒️", rarity: "epic", pack: "art" },
  brain: { id: "brain", name: "Wise Brain", emoji: "🧠", rarity: "legendary", pack: "art" },

  // Graduation Pack (Graduación)
  school_bus: { id: "school_bus", name: "School Bus", emoji: "🚌", rarity: "common", pack: "graduation" },
  hourglass: { id: "hourglass", name: "Hourglass", emoji: "⏳", rarity: "common", pack: "graduation" },
  medal: { id: "medal", name: "Gold Medal", emoji: "🥇", rarity: "rare", pack: "graduation" },
  trophy: { id: "trophy", name: "Championship Trophy", emoji: "🏆", rarity: "epic", pack: "graduation" },
  diploma: { id: "diploma", name: "Diploma", emoji: "📜", rarity: "epic", pack: "graduation" },
  mortarboard: { id: "mortarboard", name: "Graduation Cap", emoji: "🎓", rarity: "legendary", pack: "graduation" },
};

export const PACK_COSTS: Record<PackType, number> = {
  school: 5,
  science: 15,
  art: 25,
  graduation: 35,
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
  .inputValidator((input: unknown) => z.object({ pack: z.enum(["school", "science", "art", "graduation"]) }).parse(input))
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

export const rewardGameXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amount: z.number().int().min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: s } = await supabase.from("streaks").select("total_xp").eq("user_id", userId).maybeSingle();
    const nextXp = (s?.total_xp ?? 0) + data.amount;

    await supabase.from("streaks").update({ total_xp: nextXp, updated_at: new Date().toISOString() }).eq("user_id", userId);
    return { totalXp: nextXp };
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
      "criaturas-conocimiento": 100,
      "rpg-academico": 200,
      "centro-investigacion": 300,
      "torre-infinita": 400,
      "escape-room": 500,
      "runner-conocimiento": 600,
      "battle-royale": 700,
      "laboratorio-inventores": 800,
      "ciudad-conocimiento": 900,
      "ligas-campeones": 1000,
      "simulador-examenes": 150,
      "quiz-clash": 1200,
      "mundo-constructor": 1500,
    };
    
    const cost = costs[data.gameId];
    if (cost === undefined) throw new Error("Invalid game ID");

    // Fetch profile role first (Developer priority rule)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const email = (context.claims as any)?.email?.toLowerCase() ?? "";
    const isDeveloper = email === "debanhivillanueva@colegiomaranatha.edu.mx" || profile?.role === "developer";

    const { data: s, error } = await supabase.from("streaks").select("total_xp, coins, unlocked_games").eq("user_id", userId).maybeSingle();
    if (error || !s) throw new Error("No streaks record found");

    const unlocked = s.unlocked_games ?? [];
    if (unlocked.includes(data.gameId)) throw new Error("Game is already unlocked");
    
    // Check cost only for non-developers
    if (!isDeveloper && s.total_xp < cost) {
      throw new Error(`Insufficient XP. You need ${cost} XP to unlock this game!`);
    }

    const newXp = isDeveloper ? s.total_xp : (s.total_xp - cost);
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

export const devAddXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amount: z.number().int() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const email = (context.claims as any)?.email?.toLowerCase() ?? "";
    const isDeveloper = email === "debanhivillanueva@colegiomaranatha.edu.mx" || profile?.role === "developer";
    if (!isDeveloper) throw new Error("Unauthorized: Developer role required.");

    const { data: s } = await supabase.from("streaks").select("total_xp").eq("user_id", userId).maybeSingle();
    const nextXp = Math.max(0, (s?.total_xp ?? 0) + data.amount);
    await supabase.from("streaks").update({ total_xp: nextXp, updated_at: new Date().toISOString() }).eq("user_id", userId);
    return { totalXp: nextXp };
  });

export const devAddCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amount: z.number().int() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const email = (context.claims as any)?.email?.toLowerCase() ?? "";
    const isDeveloper = email === "debanhivillanueva@colegiomaranatha.edu.mx" || profile?.role === "developer";
    if (!isDeveloper) throw new Error("Unauthorized: Developer role required.");

    const { data: s } = await supabase.from("streaks").select("coins").eq("user_id", userId).maybeSingle();
    const nextCoins = Math.max(0, (s?.coins ?? 0) + data.amount);
    await supabase.from("streaks").update({ coins: nextCoins, updated_at: new Date().toISOString() }).eq("user_id", userId);
    return { coins: nextCoins };
  });

export const devResetProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const email = (context.claims as any)?.email?.toLowerCase() ?? "";
    const isDeveloper = email === "debanhivillanueva@colegiomaranatha.edu.mx" || profile?.role === "developer";
    if (!isDeveloper) throw new Error("Unauthorized: Developer role required.");

    await supabase.from("streaks").update({
      coins: 0,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      unlocked_games: [],
      last_active_date: null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabase.from("user_blooks").delete().eq("user_id", userId);
    return { ok: true };
  });

export const devToggleUnlockGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ gameId: z.string(), unlocked: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const email = (context.claims as any)?.email?.toLowerCase() ?? "";
    const isDeveloper = email === "debanhivillanueva@colegiomaranatha.edu.mx" || profile?.role === "developer";
    if (!isDeveloper) throw new Error("Unauthorized: Developer role required.");

    const { data: s } = await supabase.from("streaks").select("unlocked_games").eq("user_id", userId).maybeSingle();
    let list = s?.unlocked_games ?? [];
    if (data.unlocked) {
      if (!list.includes(data.gameId)) list = [...list, data.gameId];
    } else {
      list = list.filter(id => id !== data.gameId);
    }

    await supabase.from("streaks").update({ unlocked_games: list, updated_at: new Date().toISOString() }).eq("user_id", userId);
    return { unlockedGames: list };
  });

export const devSetLevel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ level: z.number().int().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const email = (context.claims as any)?.email?.toLowerCase() ?? "";
    const isDeveloper = email === "debanhivillanueva@colegiomaranatha.edu.mx" || profile?.role === "developer";
    if (!isDeveloper) throw new Error("Unauthorized: Developer role required.");

    // Scaling level: level 1 is 0 XP, level 2 is 300 XP, level 3 is 600 XP, etc.
    const targetXp = (data.level - 1) * 300;
    await supabase.from("streaks").update({ total_xp: targetXp, updated_at: new Date().toISOString() }).eq("user_id", userId);
    return { totalXp: targetXp };
  });
