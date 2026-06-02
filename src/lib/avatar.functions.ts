import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AvatarItem {
  id: string;
  name: string;
  category: "skin" | "hair_style" | "hair_color" | "highlight" | "face" | "shirt" | "pants" | "shoes" | "accessory" | "pet" | "aura" | "outfit";
  emoji: string;
  currency: "free" | "xp" | "sombreritos";
  cost: number;
}

export const AVATAR_ITEMS: Record<string, AvatarItem> = {
  // --- Skin Colors ---
  "skin-light-1": { id: "skin-light-1", name: "Light Skin 1", emoji: "🏻", category: "skin", currency: "free", cost: 0 },
  "skin-light-2": { id: "skin-light-2", name: "Light Skin 2", emoji: "🏼", category: "skin", currency: "free", cost: 0 },
  "skin-medium-1": { id: "skin-medium-1", name: "Medium Skin 1", emoji: "🏽", category: "skin", currency: "free", cost: 0 },
  "skin-medium-2": { id: "skin-medium-2", name: "Medium Skin 2", emoji: "🏾", category: "skin", currency: "free", cost: 0 },
  "skin-dark-1": { id: "skin-dark-1", name: "Dark Skin 1", emoji: "🏿", category: "skin", currency: "free", cost: 0 },

  // --- Hair Styles ---
  "hair-short": { id: "hair-short", name: "Corto", emoji: "👦", category: "hair_style", currency: "free", cost: 0 },
  "hair-long": { id: "hair-long", name: "Largo", emoji: "👧", category: "hair_style", currency: "free", cost: 0 },
  "hair-straight": { id: "hair-straight", name: "Lacio", emoji: "👩", category: "hair_style", currency: "free", cost: 0 },
  "hair-wavy": { id: "hair-wavy", name: "Ondulado", emoji: "🧑‍🦱", category: "hair_style", currency: "free", cost: 0 },
  "hair-curly": { id: "hair-curly", name: "Rizado", emoji: "👩‍🦱", category: "hair_style", currency: "free", cost: 0 },
  "hair-afro": { id: "hair-afro", name: "Afro", emoji: "🧑‍🦱", category: "hair_style", currency: "free", cost: 0 },
  "hair-braids": { id: "hair-braids", name: "Trenzas", emoji: "👧", category: "hair_style", currency: "free", cost: 0 },
  "hair-pigtails": { id: "hair-pigtails", name: "Coletas", emoji: "🧒", category: "hair_style", currency: "free", cost: 0 },
  "hair-bangs": { id: "hair-bangs", name: "Flequillo", emoji: "💇", category: "hair_style", currency: "free", cost: 0 },

  // --- Hair Colors ---
  "color-black": { id: "color-black", name: "Negro", emoji: "⚫", category: "hair_color", currency: "free", cost: 0 },
  "color-brown-light": { id: "color-brown-light", name: "Castaño Claro", emoji: "🟤", category: "hair_color", currency: "free", cost: 0 },
  "color-brown-dark": { id: "color-brown-dark", name: "Castaño Oscuro", emoji: "🟫", category: "hair_color", currency: "free", cost: 0 },
  "color-blonde": { id: "color-blonde", name: "Rubio", emoji: "🟡", category: "hair_color", currency: "free", cost: 0 },
  "color-red": { id: "color-red", name: "Pelirrojo", emoji: "🟠", category: "hair_color", currency: "free", cost: 0 },
  "color-gray": { id: "color-gray", name: "Gris", emoji: "⚪", category: "hair_color", currency: "free", cost: 0 },
  "color-white": { id: "color-white", name: "Blanco", emoji: "💮", category: "hair_color", currency: "free", cost: 0 },
  "color-fantasy-pink": { id: "color-fantasy-pink", name: "Rosa Fantasía", emoji: "🌸", category: "hair_color", currency: "free", cost: 0 },
  "color-fantasy-blue": { id: "color-fantasy-blue", name: "Azul Fantasía", emoji: "🌐", category: "hair_color", currency: "free", cost: 0 },
  "color-fantasy-purple": { id: "color-fantasy-purple", name: "Morado Fantasía", emoji: "💜", category: "hair_color", currency: "free", cost: 0 },

  // --- Highlights ---
  "hl-none": { id: "hl-none", name: "Sin Mechas", emoji: "❌", category: "highlight", currency: "free", cost: 0 },
  "hl-black-blue": { id: "hl-black-blue", name: "Negro con Azul", emoji: "🔵", category: "highlight", currency: "free", cost: 0 },
  "hl-brown-red": { id: "hl-brown-red", name: "Castaño con Rojo", emoji: "🔴", category: "highlight", currency: "free", cost: 0 },
  "hl-blonde-pink": { id: "hl-blonde-pink", name: "Rubio con Rosa", emoji: "💖", category: "highlight", currency: "free", cost: 0 },
  "hl-custom-neon": { id: "hl-custom-neon", name: "Neon Brillante", emoji: "✨", category: "highlight", currency: "free", cost: 0 },

  // --- Faces ---
  "face-happy": { id: "face-happy", name: "Feliz", emoji: "😊", category: "face", currency: "free", cost: 0 },
  "face-studying": { id: "face-studying", name: "Estudiando", emoji: "🤓", category: "face", currency: "free", cost: 0 },
  "face-excited": { id: "face-excited", name: "Entusiasmado", emoji: "🤩", category: "face", currency: "free", cost: 0 },
  "face-cool": { id: "face-cool", name: "Cool", emoji: "😎", category: "face", currency: "free", cost: 0 },
  "face-wink": { id: "face-wink", name: "Guiño", emoji: "😉", category: "face", currency: "free", cost: 0 },
  "face-curious": { id: "face-curious", name: "Curioso", emoji: "🤔", category: "face", currency: "free", cost: 0 },

  // --- Free Clothes ---
  "shirt-basic-tee": { id: "shirt-basic-tee", name: "Playera Básica", emoji: "👕", category: "shirt", currency: "free", cost: 0 },
  "shirt-basic-hoodie": { id: "shirt-basic-hoodie", name: "Sudadera Básica", emoji: "🧥", category: "shirt", currency: "free", cost: 0 },
  "pants-basic-jeans": { id: "pants-basic-jeans", name: "Pantalones Básicos", emoji: "👖", category: "pants", currency: "free", cost: 0 },
  "pants-basic-skirt": { id: "pants-basic-skirt", name: "Falda Básica", emoji: "👗", category: "pants", currency: "free", cost: 0 },
  "shoes-basic-shoes": { id: "shoes-basic-shoes", name: "Zapatos Básicos", emoji: "👟", category: "shoes", currency: "free", cost: 0 },

  // --- XP Store (Estudio) ---
  "acc-school-backpack": { id: "acc-school-backpack", name: "Mochila Escolar", emoji: "🎒", category: "accessory", currency: "xp", cost: 200 },
  "acc-science-backpack": { id: "acc-science-backpack", name: "Mochila Científica", emoji: "🧪", category: "accessory", currency: "xp", cost: 400 },
  "acc-college-backpack": { id: "acc-college-backpack", name: "Mochila Universitaria", emoji: "📚", category: "accessory", currency: "xp", cost: 600 },
  "shirt-lab-coat": { id: "shirt-lab-coat", name: "Bata de Laboratorio", emoji: "🥼", category: "shirt", currency: "xp", cost: 800 },
  "shirt-academic-jacket": { id: "shirt-academic-jacket", name: "Chaqueta Académica", emoji: "🧥", category: "shirt", currency: "xp", cost: 1000 },
  "acc-headphones": { id: "acc-headphones", name: "Audífonos Inteligentes", emoji: "🎧", category: "accessory", currency: "xp", cost: 300 },
  "acc-nerd-glasses": { id: "acc-nerd-glasses", name: "Lentes Académicos", emoji: "👓", category: "accessory", currency: "xp", cost: 150 },
  "shoes-academic-shoes": { id: "shoes-academic-shoes", name: "Zapatos Especiales", emoji: "👞", category: "shoes", currency: "xp", cost: 250 },
  "acc-education-globe": { id: "acc-education-globe", name: "Globo Educativo", emoji: "🌎", category: "accessory", currency: "xp", cost: 350 },

  // --- Premium Sombreritos Store ---
  "acc-legendary-mortarboard": { id: "acc-legendary-mortarboard", name: "Birrete Legendario", emoji: "🎓", category: "accessory", currency: "sombreritos", cost: 15 },
  "acc-knowledge-crown": { id: "acc-knowledge-crown", name: "Corona del Conocimiento", emoji: "👑", category: "accessory", currency: "sombreritos", cost: 20 },
  "acc-floating-book": { id: "acc-floating-book", name: "Libro Flotante", emoji: "📖", category: "accessory", currency: "sombreritos", cost: 25 },
  "aura-golden": { id: "aura-golden", name: "Aura Dorada", emoji: "✨", category: "aura", currency: "sombreritos", cost: 30 },
  "aura-math": { id: "aura-math", name: "Aura Matemática", emoji: "📐", category: "aura", currency: "sombreritos", cost: 35 },
  "pet-owl": { id: "pet-owl", name: "Búho Académico", emoji: "🦉", category: "pet", currency: "sombreritos", cost: 40 },

  // --- Premium Sets ---
  "outfit-science-supremo": { id: "outfit-science-supremo", name: "Científico Supremo", emoji: "🧬", category: "outfit", currency: "sombreritos", cost: 45 },
  "outfit-rector": { id: "outfit-rector", name: "Rector Supremo", emoji: "⚖️", category: "outfit", currency: "sombreritos", cost: 50 },
  "outfit-math-genius": { id: "outfit-math-genius", name: "Genio Matemático", emoji: "🔢", category: "outfit", currency: "sombreritos", cost: 45 },
  "outfit-investigator": { id: "outfit-investigator", name: "Investigador", emoji: "🔍", category: "outfit", currency: "sombreritos", cost: 40 },
  "outfit-academic-legend": { id: "outfit-academic-legend", name: "Leyenda Académica", emoji: "🦁", category: "outfit", currency: "sombreritos", cost: 50 },
};

export const getPrestigeTitle = (xp: number): string => {
  if (xp >= 30000) return "Rector Supremo";
  if (xp >= 15000) return "Leyenda Académica";
  if (xp >= 7000) return "Erudito";
  if (xp >= 3500) return "Académico";
  if (xp >= 1500) return "Alumno Destacado";
  if (xp >= 500) return "Estudiante";
  return "Aprendiz";
};

export const getPrestigeBadge = (title: string): string => {
  switch (title) {
    case "Rector Supremo": return "👑";
    case "Leyenda Académica": return "🦁";
    case "Erudito": return "📜";
    case "Académico": return "📚";
    case "Alumno Destacado": return "⭐";
    case "Estudiante": return "📝";
    default: return "🌱";
  }
};

export const saveAvatarConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    config: z.object({
      skinColor: z.string(),
      hairStyle: z.string(),
      hairColor: z.string(),
      hairHighlight: z.string(),
      face: z.string(),
      shirt: z.string(),
      pants: z.string(),
      shoes: z.string(),
      accessory: z.string(),
      pet: z.string(),
      aura: z.string(),
      outfit: z.string(),
    })
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({
      avatar_config: data.config,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    return { ok: true };
  });

export const unlockAvatarItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    itemId: z.string(),
    currency: z.enum(["xp", "sombreritos"]),
    cost: z.number().int().min(0),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    
    // Fetch user streaks/profile
    const [streakRes, profileRes] = await Promise.all([
      supabase.from("streaks").select("total_xp, coins").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("unlocked_avatar_items").eq("id", userId).maybeSingle(),
    ]);

    if (!streakRes.data || !profileRes.data) throw new Error("User record not found");

    const s = streakRes.data;
    const p = profileRes.data;
    const unlocked = p.unlocked_avatar_items ?? [];

    if (unlocked.includes(data.itemId)) throw new Error("Item already unlocked");

    let newXp = s.total_xp;
    let newCoins = s.coins;

    if (data.currency === "xp") {
      if (s.total_xp < data.cost) throw new Error("Insufficient XP");
      newXp = s.total_xp - data.cost;
    } else {
      if (s.coins < data.cost) throw new Error("Insufficient Sombreritos");
      newCoins = s.coins - data.cost;
    }

    const newUnlocked = [...unlocked, data.itemId];

    // Transaction updates
    await Promise.all([
      supabase.from("streaks").update({
        total_xp: newXp,
        coins: newCoins,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId),
      supabase.from("profiles").update({
        unlocked_avatar_items: newUnlocked,
        updated_at: new Date().toISOString(),
      }).eq("id", userId),
    ]);

    return { totalXp: newXp, coins: newCoins, unlockedItems: newUnlocked };
  });
