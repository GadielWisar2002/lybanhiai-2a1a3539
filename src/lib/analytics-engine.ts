export interface PerformanceRecord {
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  subject: string;
  topic: string;
  timestamp: string;
}

export interface SubjectStats {
  subject: string;
  totalAnswered: number;
  correctAnswers: number;
  accuracy: number; // percentage (0 - 100)
  avgResponseTimeMs: number;
}

export interface AnalyticsSummary {
  totalAnswered: number;
  overallAccuracy: number;
  subjectStats: Record<string, SubjectStats>;
  weakTopics: string[]; // Topics with < 60% accuracy
  masteredTopics: string[]; // Topics with >= 85% accuracy and at least 5 questions
}

export const analyticsEngine = {
  getLocalStorageKey(userId: string = "guest"): string {
    return `lybanhi_analytics_${userId}`;
  },

  trackAnswer(
    subject: string,
    topic: string,
    isCorrect: boolean,
    responseTimeMs: number,
    questionId: string,
    userId: string = "guest"
  ): void {
    if (typeof window === "undefined") return;

    const key = this.getLocalStorageKey(userId);
    const stored = localStorage.getItem(key);
    const records: PerformanceRecord[] = stored ? JSON.parse(stored) : [];

    const newRecord: PerformanceRecord = {
      questionId,
      isCorrect,
      responseTimeMs,
      subject,
      topic,
      timestamp: new Date().toISOString(),
    };

    records.push(newRecord);
    localStorage.setItem(key, JSON.stringify(records));
  },

  getAnalytics(userId: string = "guest"): AnalyticsSummary {
    if (typeof window === "undefined") {
      return { totalAnswered: 0, overallAccuracy: 0, subjectStats: {}, weakTopics: [], masteredTopics: [] };
    }

    const key = this.getLocalStorageKey(userId);
    const stored = localStorage.getItem(key);
    const records: PerformanceRecord[] = stored ? JSON.parse(stored) : [];

    const totalAnswered = records.length;
    if (totalAnswered === 0) {
      return { totalAnswered: 0, overallAccuracy: 0, subjectStats: {}, weakTopics: [], masteredTopics: [] };
    }

    const correctAnswersCount = records.filter(r => r.isCorrect).length;
    const overallAccuracy = Math.round((correctAnswersCount / totalAnswered) * 100);

    // Group by subject
    const subjectGroups: Record<string, PerformanceRecord[]> = {};
    // Group by topic
    const topicGroups: Record<string, PerformanceRecord[]> = {};

    records.forEach((r) => {
      if (!subjectGroups[r.subject]) subjectGroups[r.subject] = [];
      subjectGroups[r.subject].push(r);

      if (!topicGroups[r.topic]) topicGroups[r.topic] = [];
      topicGroups[r.topic].push(r);
    });

    const subjectStats: Record<string, SubjectStats> = {};
    Object.keys(subjectGroups).forEach((sub) => {
      const group = subjectGroups[sub];
      const correct = group.filter(r => r.isCorrect).length;
      const totalTime = group.reduce((sum, r) => sum + r.responseTimeMs, 0);

      subjectStats[sub] = {
        subject: sub,
        totalAnswered: group.length,
        correctAnswers: correct,
        accuracy: Math.round((correct / group.length) * 100),
        avgResponseTimeMs: Math.round(totalTime / group.length),
      };
    });

    const weakTopics: string[] = [];
    const masteredTopics: string[] = [];

    Object.keys(topicGroups).forEach((topic) => {
      const group = topicGroups[topic];
      const correct = group.filter(r => r.isCorrect).length;
      const accuracy = (correct / group.length) * 100;

      if (accuracy < 60) {
        weakTopics.push(topic);
      } else if (accuracy >= 85 && group.length >= 3) {
        masteredTopics.push(topic);
      }
    });

    return {
      totalAnswered,
      overallAccuracy,
      subjectStats,
      weakTopics,
      masteredTopics,
    };
  },

  getRecommendations(userId: string = "guest"): {
    recommendedSubjects: string[];
    recommendedGames: { id: string; name: string; reason: string }[];
  } {
    const stats = this.getAnalytics(userId);
    const recommendedSubjects: string[] = [];

    // Prioritize weak topics
    if (stats.weakTopics.length > 0) {
      // Find subjects corresponding to weak topics
      const key = this.getLocalStorageKey(userId);
      const stored = localStorage.getItem(key);
      const records: PerformanceRecord[] = stored ? JSON.parse(stored) : [];
      
      stats.weakTopics.forEach((topic) => {
        const match = records.find(r => r.topic === topic);
        if (match && !recommendedSubjects.includes(match.subject)) {
          recommendedSubjects.push(match.subject);
        }
      });
    }

    // Default recommendations if no weak subjects exist
    if (recommendedSubjects.length === 0) {
      recommendedSubjects.push("math", "science", "english");
    }

    const recommendedGames = [
      {
        id: "simulador-examenes",
        name: "Simulador de Exámenes",
        reason: "Excelente para medir tu nivel general en condiciones reales de examen.",
      },
      {
        id: "criaturas-conocimiento",
        name: "Criaturas del Conocimiento",
        reason: "Perfecto para entrenar tus materias débiles capturando y combatiendo criaturas.",
      },
      {
        id: "torre-infinita",
        name: "Torre Infinita del Saber",
        reason: "Ideal para superar retos consecutivos y mejorar tu agilidad mental.",
      },
    ];

    return {
      recommendedSubjects,
      recommendedGames,
    };
  },
};
