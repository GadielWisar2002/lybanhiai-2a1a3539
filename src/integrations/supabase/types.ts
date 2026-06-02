export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          active_blook_id: string | null
          avatar_config: Json
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          unlocked_avatar_items: string[]
          updated_at: string
        }
        Insert: {
          active_blook_id?: string | null
          avatar_config?: Json
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          unlocked_avatar_items?: string[]
          updated_at?: string
        }
        Update: {
          active_blook_id?: string | null
          avatar_config?: Json
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          unlocked_avatar_items?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          quiz_id: string
          score: number
          total: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id: string
          score: number
          total: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          category: string
          created_at: string
          id: string
          language: string
          questions: Json
          topic: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          language?: string
          questions: Json
          topic: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          language?: string
          questions?: Json
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          career_name: string
          created_at: string
          id: string
          language: string
          match_score: number
          reasoning: string
          tags: string[]
          universities: Json
          user_id: string
        }
        Insert: {
          career_name: string
          created_at?: string
          id?: string
          language?: string
          match_score: number
          reasoning: string
          tags?: string[]
          universities?: Json
          user_id: string
        }
        Update: {
          career_name?: string
          created_at?: string
          id?: string
          language?: string
          match_score?: number
          reasoning?: string
          tags?: string[]
          universities?: Json
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          coins: number
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          total_xp: number
          unlocked_games: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          total_xp?: number
          unlocked_games?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          total_xp?: number
          unlocked_games?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blooks: {
        Row: {
          blook_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          blook_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          blook_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profile_data: {
        Row: {
          budget_currency: string | null
          budget_monthly: number | null
          country: string | null
          favorite_subjects: Json
          hobbies: string[]
          interests: string
          skills: string[]
          university_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_currency?: string | null
          budget_monthly?: number | null
          country?: string | null
          favorite_subjects?: Json
          hobbies?: string[]
          interests?: string
          skills?: string[]
          university_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_currency?: string | null
          budget_monthly?: number | null
          country?: string | null
          favorite_subjects?: Json
          hobbies?: string[]
          interests?: string
          skills?: string[]
          university_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
