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
  description: string;
}

export const AVATAR_ITEMS: Record<string, AvatarItem> = {
  // --- Skin Colors ---
  "skin-light-1": { id: "skin-light-1", name: "Piel Clara 1", emoji: "🏻", category: "skin", currency: "free", cost: 0, description: "Un tono de piel claro para tu personaje." },
  "skin-light-2": { id: "skin-light-2", name: "Piel Clara 2", emoji: "🏼", category: "skin", currency: "free", cost: 0, description: "Un tono de piel natural intermedio claro." },
  "skin-medium-1": { id: "skin-medium-1", name: "Piel Trigueña 1", emoji: "🏽", category: "skin", currency: "free", cost: 0, description: "Un tono de piel oliva / trigueño." },
  "skin-medium-2": { id: "skin-medium-2", name: "Piel Trigueña 2", emoji: "🏾", category: "skin", currency: "free", cost: 0, description: "Un tono de piel moreno clásico." },
  "skin-dark-1": { id: "skin-dark-1", name: "Piel Oscura 1", emoji: "🏿", category: "skin", currency: "free", cost: 0, description: "Un tono de piel oscuro elegante." },

  // --- Hair Styles ---
  "hair-short": { id: "hair-short", name: "Corto", emoji: "👦", category: "hair_style", currency: "free", cost: 0, description: "Un corte de cabello corto y ordenado para concentrarte en tus estudios." },
  "hair-long": { id: "hair-long", name: "Largo", emoji: "👧", category: "hair_style", currency: "free", cost: 0, description: "Cabello largo y sedoso que brilla bajo el sol escolar." },
  "hair-straight": { id: "hair-straight", name: "Lacio", emoji: "👩", category: "hair_style", currency: "free", cost: 0, description: "Estilo lacio clásico, formal y muy elegante." },
  "hair-wavy": { id: "hair-wavy", name: "Ondulado", emoji: "🧑‍🦱", category: "hair_style", currency: "free", cost: 0, description: "Hermosas ondas naturales que dan un aspecto fresco y juvenil." },
  "hair-curly": { id: "hair-curly", name: "Rizado", emoji: "👩‍🦱", category: "hair_style", currency: "free", cost: 0, description: "Crespos definidos que destacan en cualquier salón de clases." },
  "hair-afro": { id: "hair-afro", name: "Afro", emoji: "🧑‍🦱", category: "hair_style", currency: "free", cost: 0, description: "Un afro espectacular, voluminoso y con mucha personalidad." },
  "hair-braids": { id: "hair-braids", name: "Trenzas", emoji: "👧", category: "hair_style", currency: "free", cost: 0, description: "Trenzas tradicionales tejidas con cuidado para un peinado firme." },
  "hair-pigtails": { id: "hair-pigtails", name: "Coletas", emoji: "🧒", category: "hair_style", currency: "free", cost: 0, description: "Divertidas coletas dobles para un aspecto alegre e hiperactivo." },
  "hair-bangs": { id: "hair-bangs", name: "Flequillo", emoji: "💇", category: "hair_style", currency: "free", cost: 0, description: "Corte moderno con flequillo al frente súper estilizado." },

  // --- Hair Colors ---
  "color-black": { id: "color-black", name: "Negro", emoji: "⚫", category: "hair_color", currency: "free", cost: 0, description: "Color negro azabache sobrio." },
  "color-brown-light": { id: "color-brown-light", name: "Castaño Claro", emoji: "🟤", category: "hair_color", currency: "free", cost: 0, description: "Castaño claro brillante." },
  "color-brown-dark": { id: "color-brown-dark", name: "Castaño Oscuro", emoji: "🟫", category: "hair_color", currency: "free", cost: 0, description: "Castaño oscuro profundo." },
  "color-blonde": { id: "color-blonde", name: "Rubio", emoji: "🟡", category: "hair_color", currency: "free", cost: 0, description: "Rubio dorado radiante y llamativo." },
  "color-red": { id: "color-red", name: "Pelirrojo", emoji: "🟠", category: "hair_color", currency: "free", cost: 0, description: "Rojo fuego apasionado y enérgico." },
  "color-gray": { id: "color-gray", name: "Gris", emoji: "⚪", category: "hair_color", currency: "free", cost: 0, description: "Gris sabio, denota intelecto y madurez académica." },
  "color-white": { id: "color-white", name: "Blanco", emoji: "💮", category: "hair_color", currency: "free", cost: 0, description: "Blanco nieve puro y misterioso." },
  "color-fantasy-pink": { id: "color-fantasy-pink", name: "Rosa Fantasía", emoji: "🌸", category: "hair_color", currency: "free", cost: 0, description: "Color de fantasía rosa vibrante para destacar." },
  "color-fantasy-blue": { id: "color-fantasy-blue", name: "Azul Fantasía", emoji: "🌐", category: "hair_color", currency: "free", cost: 0, description: "Azul eléctrico para un estilo moderno." },
  "color-fantasy-purple": { id: "color-fantasy-purple", name: "Morado Fantasía", emoji: "💜", category: "hair_color", currency: "free", cost: 0, description: "Morado espacial mágico y fascinante." },

  // --- Highlights ---
  "hl-none": { id: "hl-none", name: "Sin Mechas", emoji: "❌", category: "highlight", currency: "free", cost: 0, description: "Mantén un color de cabello uniforme sin mechas." },
  "hl-black-blue": { id: "hl-black-blue", name: "Negro con Azul", emoji: "🔵", category: "highlight", currency: "free", cost: 0, description: "Base negra complementada con finos reflejos azules." },
  "hl-brown-red": { id: "hl-brown-red", name: "Castaño con Rojo", emoji: "🔴", category: "highlight", currency: "free", cost: 0, description: "Base castaña iluminada con reflejos rojos ardientes." },
  "hl-blonde-pink": { id: "hl-blonde-pink", name: "Rubio con Rosa", emoji: "💖", category: "highlight", currency: "free", cost: 0, description: "Hermosas mechas rosa pastel sobre un fondo rubio." },
  "hl-custom-neon": { id: "hl-custom-neon", name: "Neon Brillante", emoji: "✨", category: "highlight", currency: "free", cost: 0, description: "Destellos de luz verde neón cibernéticos." },

  // --- Faces ---
  "face-happy": { id: "face-happy", name: "Feliz", emoji: "😊", category: "face", currency: "free", cost: 0, description: "Una tierna sonrisa para contagiar optimismo a tu salón." },
  "face-studying": { id: "face-studying", name: "Estudiando", emoji: "🤓", category: "face", currency: "free", cost: 0, description: "Concentración total y lentes inteligentes para los exámenes." },
  "face-excited": { id: "face-excited", name: "Entusiasmado", emoji: "🤩", category: "face", currency: "free", cost: 0, description: "Ojos de estrellas y gran alegría por un logro impecable." },
  "face-cool": { id: "face-cool", name: "Cool", emoji: "😎", category: "face", currency: "free", cost: 0, description: "Gafas de sol negras para denotar estilo y tranquilidad." },
  "face-wink": { id: "face-wink", name: "Guiño", emoji: "😉", category: "face", currency: "free", cost: 0, description: "Un guiño confiado que demuestra astucia al responder." },
  "face-curious": { id: "face-curious", name: "Curioso", emoji: "🤔", category: "face", currency: "free", cost: 0, description: "Expresión pensativa, ideal para los amantes de la investigación." },

  // --- Free Clothes ---
  "shirt-basic-tee": { id: "shirt-basic-tee", name: "Playera Básica", emoji: "👕", category: "shirt", currency: "free", cost: 0, description: "Playera escolar cómoda con el escudo oficial bordado." },
  "shirt-basic-hoodie": { id: "shirt-basic-hoodie", name: "Sudadera Básica", emoji: "🧥", category: "shirt", currency: "free", cost: 0, description: "Sudadera abrigada con gorro y bolsa frontal." },
  "pants-basic-jeans": { id: "pants-basic-jeans", name: "Pantalones Básicos", emoji: "👖", category: "pants", currency: "free", cost: 0, description: "Vaqueros azules clásicos, cómodos y duraderos." },
  "pants-basic-skirt": { id: "pants-basic-skirt", name: "Falda Básica", emoji: "👗", category: "pants", currency: "free", cost: 0, description: "Falda plisada rosa de uniforme escolar." },
  "shoes-basic-shoes": { id: "shoes-basic-shoes", name: "Zapatos Básicos", emoji: "👟", category: "shoes", currency: "free", cost: 0, description: "Tenis deportivos rojos ideales para moverte rápido." },

  // --- XP Store (Estudio) ---
  "acc-school-backpack": { id: "acc-school-backpack", name: "Mochila Escolar", emoji: "🎒", category: "accessory", currency: "xp", cost: 200, description: "Mochila roja estándar y espaciosa para llevar tus libros." },
  "acc-science-backpack": { id: "acc-science-backpack", name: "Mochila Científica", emoji: "🧪", category: "accessory", currency: "xp", cost: 400, description: "Contenedor hermético equipado con matraces y sustancias químicas." },
  "acc-college-backpack": { id: "acc-college-backpack", name: "Mochila Universitaria", emoji: "📚", category: "accessory", currency: "xp", cost: 600, description: "Una columna de pesados enciclopedias amarrados a tu espalda." },
  "shirt-lab-coat": { id: "shirt-lab-coat", name: "Bata de Laboratorio", emoji: "🥼", category: "shirt", currency: "xp", cost: 800, description: "Bata blanca impecable para experimentos químicos o de medicina." },
  "shirt-academic-jacket": { id: "shirt-academic-jacket", name: "Chaqueta Académica", emoji: "🧥", category: "shirt", currency: "xp", cost: 1000, description: "Chaqueta de letra del club de debate de honor con bordados dorados." },
  "acc-headphones": { id: "acc-headphones", name: "Audífonos Inteligentes", emoji: "🎧", category: "accessory", currency: "xp", cost: 300, description: "Auriculares inalámbricos con cancelación de ruido para concentrarte mejor." },
  "acc-nerd-glasses": { id: "acc-nerd-glasses", name: "Lentes Académicos", emoji: "👓", category: "accessory", currency: "xp", cost: 150, description: "Gafas de lectura fina que aumentan tu concentración intelectual." },
  "shoes-academic-shoes": { id: "shoes-academic-shoes", name: "Zapatos Especiales", emoji: "👞", category: "shoes", currency: "xp", cost: 250, description: "Mocasines de cuero marrón brillante elegantes y formales." },
  "acc-education-globe": { id: "acc-education-globe", name: "Globo Educativo", emoji: "🌎", category: "accessory", currency: "xp", cost: 350, description: "Un mini globo terráqueo holográfico que orbita junto a tu mano." },

  // --- Premium Sombreritos Store ---
  "acc-legendary-mortarboard": { id: "acc-legendary-mortarboard", name: "Birrete Legendario", emoji: "🎓", category: "accessory", currency: "sombreritos", cost: 15, description: "El birrete dorado oficial, símbolo máximo de dedicación académica." },
  "acc-knowledge-crown": { id: "acc-knowledge-crown", name: "Corona del Conocimiento", emoji: "👑", category: "accessory", currency: "sombreritos", cost: 20, description: "Una majestuosa corona de oro con rubíes digna de la realeza estudiantil." },
  "acc-floating-book": { id: "acc-floating-book", name: "Libro Flotante", emoji: "📖", category: "accessory", currency: "sombreritos", cost: 25, description: "Un tomo arcano de sabiduría que flota de manera mágica y destella fórmulas." },
  "aura-golden": { id: "aura-golden", name: "Aura Dorada", emoji: "✨", category: "aura", currency: "sombreritos", cost: 30, description: "Un torbellino de estrellas doradas mágicas flotando a tu alrededor." },
  "aura-math": { id: "aura-math", name: "Aura Matemática", emoji: "📐", category: "aura", currency: "sombreritos", cost: 35, description: "Ecuaciones flotantes orbitando a tu personaje denotando un genio numérico." },
  "pet-owl": { id: "pet-owl", name: "Búho Académico", emoji: "🦉", category: "pet", currency: "sombreritos", cost: 40, description: "Un búho pixelado sabio que vuela junto a tu hombro y te apoya en exámenes." },

  // --- Premium Sets ---
  "outfit-science-supremo": { id: "outfit-science-supremo", name: "Científico Supremo", emoji: "🧬", category: "outfit", currency: "sombreritos", cost: 45, description: "Exotraje de alta tecnología con núcleo de energía y circuitos cibernéticos." },
  "outfit-rector": { id: "outfit-rector", name: "Rector Supremo", emoji: "⚖️", category: "outfit", currency: "sombreritos", cost: 50, description: "Gala académica de rector con collarín dorado y gran medalla de honor." },
  "outfit-math-genius": { id: "outfit-math-genius", name: "Genio Matemático", emoji: "🔢", category: "outfit", currency: "sombreritos", cost: 45, description: "Camisa de cuadrícula fina, tirantes de cuero y fórmulas matemáticas avanzadas." },
  "outfit-investigator": { id: "outfit-investigator", name: "Investigador", emoji: "🔍", category: "outfit", currency: "sombreritos", cost: 40, description: "Gabardina beige clásica y cinturón de detective para desvelar misterios." },
  "outfit-academic-legend": { id: "outfit-academic-legend", name: "Leyenda Académica", emoji: "🦁", category: "outfit", currency: "sombreritos", cost: 50, description: "Gran capa real y blasón del león dorado para líderes de alto prestigio." },
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
