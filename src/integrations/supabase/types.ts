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
      caregiver_details: {
        Row: {
          age: number | null
          bio: string
          category: Database["public"]["Enums"]["caregiver_category"]
          certificate_url: string | null
          city: string
          created_at: string
          hourly_rate: number
          id: string
          is_active: boolean
          neighborhood: string
          stripe_account_id: string | null
        }
        Insert: {
          age?: number | null
          bio?: string
          category?: Database["public"]["Enums"]["caregiver_category"]
          certificate_url?: string | null
          city?: string
          created_at?: string
          hourly_rate?: number
          id: string
          is_active?: boolean
          neighborhood?: string
          stripe_account_id?: string | null
        }
        Update: {
          age?: number | null
          bio?: string
          category?: Database["public"]["Enums"]["caregiver_category"]
          certificate_url?: string | null
          city?: string
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          neighborhood?: string
          stripe_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          caregiver_id: string
          client_id: string
          created_at: string
          hours: number
          id: string
          status: Database["public"]["Enums"]["contract_status"]
          stripe_checkout_session_id: string | null
          total_amount: number
        }
        Insert: {
          caregiver_id: string
          client_id: string
          created_at?: string
          hours?: number
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          stripe_checkout_session_id?: string | null
          total_amount: number
        }
        Update: {
          caregiver_id?: string
          client_id?: string
          created_at?: string
          hours?: number
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          stripe_checkout_session_id?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          caregiver_share: number
          contract_id: string
          created_at: string
          id: string
          is_split_successful: boolean
          platform_share: number
          stripe_payment_id: string | null
          total_value: number
        }
        Insert: {
          caregiver_share: number
          contract_id: string
          created_at?: string
          id?: string
          is_split_successful?: boolean
          platform_share: number
          stripe_payment_id?: string | null
          total_value: number
        }
        Update: {
          caregiver_share?: number
          contract_id?: string
          created_at?: string
          id?: string
          is_split_successful?: boolean
          platform_share?: number
          stripe_payment_id?: string | null
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          rg: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          rg?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          rg?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          caregiver_id: string
          client_id: string | null
          client_name: string
          comment: string
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          caregiver_id: string
          client_id?: string | null
          client_name?: string
          comment?: string
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          caregiver_id?: string
          client_id?: string | null
          client_name?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_caregivers: {
        Row: {
          age: number | null
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          category: Database["public"]["Enums"]["caregiver_category"] | null
          city: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string | null
          is_active: boolean | null
          neighborhood: string | null
          reviews_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_caregiver_phone: { Args: { _caregiver_id: string }; Returns: string }
    }
    Enums: {
      app_role: "client" | "caregiver" | "admin"
      caregiver_category: "profissional" | "acompanhante"
      contract_status: "pending" | "paid" | "completed" | "cancelled"
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
    Enums: {
      app_role: ["client", "caregiver", "admin"],
      caregiver_category: ["profissional", "acompanhante"],
      contract_status: ["pending", "paid", "completed", "cancelled"],
    },
  },
} as const
