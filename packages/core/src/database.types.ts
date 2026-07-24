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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          created_at: string
          data: Json
          entity_id: string | null
          entity_type: string
          id: string
          site_id: number | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          site_id?: number | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          site_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          applied_via_site_id: number
          cover_letter: string | null
          created_at: string
          deleted_at: string | null
          id: string
          job_id: string
          resume_path: string
          status: Database["public"]["Enums"]["application_status"]
          status_updated_at: string
          updated_at: string
        }
        Insert: {
          applicant_id?: string
          applied_via_site_id: number
          cover_letter?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          job_id: string
          resume_path: string
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applied_via_site_id?: number
          cover_letter?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          job_id?: string
          resume_path?: string
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_applied_via_site_id_fkey"
            columns: ["applied_via_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      companies: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          id: string
          logo_path: string | null
          name: string
          registration_number: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
          verification_document_path: string | null
          verification_status: Database["public"]["Enums"]["company_verification"]
          verified_at: string | null
          verified_by: string | null
          website: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name: string
          registration_number: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          verification_document_path?: string | null
          verification_status?: Database["public"]["Enums"]["company_verification"]
          verified_at?: string | null
          verified_by?: string | null
          website: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          registration_number?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          verification_document_path?: string | null
          verification_status?: Database["public"]["Enums"]["company_verification"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          role: Database["public"]["Enums"]["company_member_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sites: {
        Row: {
          job_id: string
          site_id: number
        }
        Insert: {
          job_id: string
          site_id: number
        }
        Update: {
          job_id?: string
          site_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_sites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      job_views: {
        Row: {
          created_at: string
          id: string
          job_id: string
          site_id: number
          viewed_on: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          site_id: number
          viewed_on?: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          site_id?: number
          viewed_on?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_views_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category_id: number
          city: string | null
          company_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expires_at: string | null
          id: string
          is_remote: boolean
          origin_site_id: number
          province: string | null
          published_at: string | null
          removed_reason: string | null
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          salary_period: Database["public"]["Enums"]["salary_period"] | null
          search_vector: unknown
          skills: string[]
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category_id: number
          city?: string | null
          company_id: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expires_at?: string | null
          id?: string
          is_remote?: boolean
          origin_site_id: number
          province?: string | null
          published_at?: string | null
          removed_reason?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: Database["public"]["Enums"]["salary_period"] | null
          search_vector?: unknown
          skills?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: number
          city?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expires_at?: string | null
          id?: string
          is_remote?: boolean
          origin_site_id?: number
          province?: string | null
          published_at?: string | null
          removed_reason?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: Database["public"]["Enums"]["salary_period"] | null
          search_vector?: unknown
          skills?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_origin_site_id_fkey"
            columns: ["origin_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          emailed_at: string | null
          entity_id: string
          entity_type: string
          id: string
          read_at: string | null
          site_id: number | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          emailed_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          read_at?: string | null
          site_id?: number | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          emailed_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          read_at?: string | null
          site_id?: number | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      saved_jobs: {
        Row: {
          created_at: string
          job_id: string
          saved_via_site_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          saved_via_site_id: number
          user_id?: string
        }
        Update: {
          created_at?: string
          job_id?: string
          saved_via_site_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_saved_via_site_id_fkey"
            columns: ["saved_via_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      admin_set_company_status: {
        Args: {
          _company_id: string
          _status: Database["public"]["Enums"]["company_status"]
        }
        Returns: undefined
      }
      admin_set_company_verification: {
        Args: {
          _company_id: string
          _reason?: string
          _status: Database["public"]["Enums"]["company_verification"]
        }
        Returns: undefined
      }
      can_access_resume: { Args: { _path: string }; Returns: boolean }
      can_delete_verification_document: {
        Args: { _segment: string }
        Returns: boolean
      }
      can_recruiter_view_applicant: {
        Args: { _applicant_id: string }
        Returns: boolean
      }
      company_is_suspended: { Args: { _company_id: string }; Returns: boolean }
      emit_notification: {
        Args: {
          _data: Json
          _entity_id: string
          _entity_type: string
          _site_id: number
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: undefined
      }
      has_applied: { Args: { _job_id: string }; Returns: boolean }
      has_saved: { Args: { _job_id: string }; Returns: boolean }
      immutable_arr_join: { Args: { _values: string[] }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_company_member_for_job: { Args: { _job_id: string }; Returns: boolean }
      is_company_member_path: { Args: { _segment: string }; Returns: boolean }
      is_recruiter: { Args: never; Returns: boolean }
      is_resume_referenced: { Args: { _path: string }; Returns: boolean }
      is_suspended: { Args: never; Returns: boolean }
      job_accepts_applications: { Args: { _job_id: string }; Returns: boolean }
      jooblie_site_id: { Args: never; Returns: number }
      log_activity: {
        Args: {
          _action: string
          _company_id: string
          _data: Json
          _entity_id: string
          _entity_type: string
          _site_id: number
        }
        Returns: undefined
      }
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
      notification_type:
        | "application_status_changed"
        | "job_new_applicant"
        | "company_verification_request"
        | "company_verified"
        | "company_rejected"
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
      notification_type: [
        "application_status_changed",
        "job_new_applicant",
        "company_verification_request",
        "company_verified",
        "company_rejected",
      ],
      salary_period: ["hourly", "weekly", "monthly", "yearly"],
      site_type: ["aggregator", "sector", "audience"],
      user_role: ["job_seeker", "recruiter", "admin"],
      user_status: ["active", "suspended", "deleted"],
    },
  },
} as const
