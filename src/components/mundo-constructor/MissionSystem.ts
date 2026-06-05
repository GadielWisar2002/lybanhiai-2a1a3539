export interface Quest {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

export const INITIAL_QUESTS: Quest[] = [
  { id: "q1", title: "Primer Aula", desc: "Construye un Aula de Matemáticas en el campus.", progress: 0, target: 1, rewardXp: 150, rewardCoins: 20, completed: false },
  { id: "q2", title: "Campus Vivo", desc: "Consigue que 15 estudiantes vivan en tu campus.", progress: 0, target: 15, rewardXp: 250, rewardCoins: 40, completed: false },
  { id: "q3", title: "Científico Supremo", desc: "Construye el Auditorio de Ciencias gigantesco.", progress: 0, target: 1, rewardXp: 450, rewardCoins: 80, completed: false },
  { id: "q4", title: "Sabio del Código", desc: "Resuelve 5 preguntas de programación correctamente.", progress: 0, target: 5, rewardXp: 300, rewardCoins: 50, completed: false },
  { id: "q5", title: "Ingeniero Civil", desc: "Coloca al menos 30 bloques de construcción libres en el mapa.", progress: 0, target: 30, rewardXp: 200, rewardCoins: 30, completed: false }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "ac1", title: "Bienvenido Académico", desc: "Entraste por primera vez al Mundo Constructor 3D.", unlocked: true },
  { id: "ac2", title: "Gran Diseñador", desc: "Construiste 5 tipos de edificios prefabricados.", unlocked: false },
  { id: "ac3", title: "Racha Imparable", desc: "Lograste una racha de 5 respuestas correctas seguidas.", unlocked: false },
  { id: "ac4", title: "Metrópolis Educativa", desc: "Llegaste al nivel 3 de tu Ciudad Académica.", unlocked: false }
];

export class MissionSystem {
  quests: Quest[] = [];
  achievements: Achievement[] = [];

  constructor(savedQuests?: Quest[], savedAchievements?: Achievement[]) {
    this.quests = savedQuests || INITIAL_QUESTS;
    this.achievements = savedAchievements || INITIAL_ACHIEVEMENTS;
  }

  updateQuestProgress(questId: string, val: number): { completed: boolean; q: Quest } | null {
    const q = this.quests.find(x => x.id === questId);
    if (q && !q.completed) {
      q.progress = Math.min(q.target, q.progress + val);
      if (q.progress >= q.target) {
        q.completed = true;
        return { completed: true, q };
      }
      return { completed: false, q };
    }
    return null;
  }

  checkAchievements(cityLevel: number, streak: number, structuresBuiltCount: number): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    this.achievements.forEach(ac => {
      if (ac.unlocked) return;

      if (ac.id === "ac2" && structuresBuiltCount >= 5) {
        ac.unlocked = true;
        newlyUnlocked.push(ac);
      }
      if (ac.id === "ac3" && streak >= 5) {
        ac.unlocked = true;
        newlyUnlocked.push(ac);
      }
      if (ac.id === "ac4" && cityLevel >= 3) {
        ac.unlocked = true;
        newlyUnlocked.push(ac);
      }
    });

    return newlyUnlocked;
  }

  getCityLevelName(level: number): string {
    const names = [
      "Aldea Educativa",
      "Pueblo del Conocimiento",
      "Ciudad Académica",
      "Metrópolis Escolar",
      "Capital Mundial del Saber"
    ];
    return names[level - 1] || names[0];
  }
}
