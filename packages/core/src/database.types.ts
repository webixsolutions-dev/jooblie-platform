export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          is_active: boolean | null
          name: string
          sector_id: number
          slug: string
          sort_order: number
        }
        Insert: {
          id: number
          is_active?: boolean | null
          name: string
          sector_id: number
          slug: string
          sort_order: number
        }
        Update: {
          id?: number
          is_active?: boolean | null
          name?: string
          sector_id?: number
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_resume_path: string | null
          email: string
          full_name: string | null
          headline: string | null
          id: string
          location_city: string | null
          location_province: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          signup_site_id: number
          skills: string[] | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_resume_path?: string | null
          email: string
          full_name?: string | null
          headline?: string | null
          id: string
          location_city?: string | null
          location_province?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_site_id: number
          skills?: string[] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_resume_path?: string | null
          email?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          location_city?: string | null
          location_province?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_site_id?: number
          skills?: string[] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_signup_site_id_fkey"
            columns: ["signup_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      sites: {
        Row: {
          domain: string
          id: number
          is_active: boolean | null
          name: string
          sector_id: number | null
          site_type: Database["public"]["Enums"]["site_type"]
          slug: string
        }
        Insert: {
          domain: string
          id: number
          is_active?: boolean | null
          name: string
          sector_id?: number | null
          site_type: Database["public"]["Enums"]["site_type"]
          slug: string
        }
        Update: {
          domain?: string
          id?: number
          is_active?: boolean | null
          name?: string
          sector_id?: number | null
          site_type?: Database["public"]["Enums"]["site_type"]
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      immutable_arr_join: { Args: { _values: string[] }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_suspended: { Args: never; Returns: boolean }
    }
    Enums: {
      application_status:
        | "submitted"
        | "viewed"
        | "shortlisted"
        | "interviewing"
        | "offered"
        | "hired"
        | "rejected"
        | "withdrawn"
      company_member_role: "owner" | "member"
      company_status: "active" | "suspended"
      company_verification: "pending" | "verified" | "rejected"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "temporary"
        | "internship"
        | "seasonal"
      job_status: "pending_review" | "active" | "closed" | "expired" | "removed"
      salary_period: "hourly" | "weekly" | "monthly" | "yearly"
      site_type: "aggregator" | "sector" | "audience"
      user_role: "job_seeker" | "recruiter" | "admin"
      user_status: "active" | "suspended" | "deleted"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: [
        "submitted",
        "viewed",
        "shortlisted",
        "interviewing",
        "offered",
        "hired",
        "rejected",
        "withdrawn",
      ],
      company_member_role: ["owner", "member"],
      company_status: ["active", "suspended"],
      company_verification: ["pending", "verified", "rejected"],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "temporary",
        "internship",
        "seasonal",
      ],
      job_status: ["pending_review", "active", "closed", "expired", "removed"],
      salary_period: ["hourly", "weekly", "monthly", "yearly"],
      site_type: ["aggregator", "sector", "audience"],
      user_role: ["job_seeker", "recruiter", "admin"],
      user_status: ["active", "suspended", "deleted"],
    },
  },
} as const
