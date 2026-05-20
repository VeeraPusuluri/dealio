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
      commissions: {
        Row: {
          amount: number
          cp_id: string
          created_at: string
          deal_id: string | null
          id: string
          released_at: string | null
          status: string
        }
        Insert: {
          amount: number
          cp_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          released_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          cp_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          released_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          city: string | null
          cp_id: string
          created_at: string
          description: string | null
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          city?: string | null
          cp_id: string
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          city?: string | null
          cp_id?: string
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          bank_id: string | null
          booking_amount: number | null
          builder_id: string | null
          cp_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          project_id: string | null
          stage: string | null
          status: string
          total_amount: number | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          bank_id?: string | null
          booking_amount?: number | null
          builder_id?: string | null
          cp_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          project_id?: string | null
          stage?: string | null
          status?: string
          total_amount?: number | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_id?: string | null
          booking_amount?: number | null
          builder_id?: string | null
          cp_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          project_id?: string | null
          stage?: string | null
          status?: string
          total_amount?: number | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          name: string
          owner_id: string
          related_id: string | null
          related_type: string | null
          size_bytes: number | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          owner_id: string
          related_id?: string | null
          related_type?: string | null
          size_bytes?: number | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          owner_id?: string
          related_id?: string | null
          related_type?: string | null
          size_bytes?: number | null
          url?: string | null
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          created_at: string
          done: boolean
          due_at: string
          id: string
          lead_id: string | null
          notes: string | null
          owner_id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_at: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          done?: boolean
          due_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          city: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_yield: number | null
          id: string
          status: string
          ticket_size: number | null
          title: string
        }
        Insert: {
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_yield?: number | null
          id?: string
          status?: string
          ticket_size?: number | null
          title: string
        }
        Update: {
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_yield?: number | null
          id?: string
          status?: string
          ticket_size?: number | null
          title?: string
        }
        Relationships: []
      }
      land_listings: {
        Row: {
          area_acres: number | null
          city: string | null
          created_at: string
          description: string | null
          expected_price: number | null
          id: string
          owner_id: string
          status: string
          title: string
          zoning: string | null
        }
        Insert: {
          area_acres?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          expected_price?: number | null
          id?: string
          owner_id: string
          status?: string
          title: string
          zoning?: string | null
        }
        Update: {
          area_acres?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          expected_price?: number | null
          id?: string
          owner_id?: string
          status?: string
          title?: string
          zoning?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          project_id: string | null
          score: number | null
          source: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          project_id?: string | null
          score?: number | null
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          project_id?: string | null
          score?: number | null
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_cases: {
        Row: {
          amount: number | null
          bank_id: string | null
          created_at: string
          customer_id: string
          deal_id: string | null
          id: string
          interest_rate: number | null
          status: string
          tenure_months: number | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          bank_id?: string | null
          created_at?: string
          customer_id: string
          deal_id?: string | null
          id?: string
          interest_rate?: number | null
          status?: string
          tenure_months?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          bank_id?: string | null
          created_at?: string
          customer_id?: string
          deal_id?: string | null
          id?: string
          interest_rate?: number | null
          status?: string
          tenure_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_cases_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      login_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string
          id: string
          invitee_id: string | null
          location: string | null
          mode: string | null
          notes: string | null
          organizer_id: string
          project_id: string | null
          scheduled_at: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id?: string | null
          location?: string | null
          mode?: string | null
          notes?: string | null
          organizer_id: string
          project_id?: string | null
          scheduled_at: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string | null
          location?: string | null
          mode?: string | null
          notes?: string | null
          organizer_id?: string
          project_id?: string | null
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_verified: boolean
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          id: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          builder_id: string
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          price_max: number | null
          price_min: number | null
          rera_id: string | null
          status: string
          unit_types: string[] | null
          updated_at: string
        }
        Insert: {
          builder_id: string
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          price_max?: number | null
          price_min?: number | null
          rera_id?: string | null
          status?: string
          unit_types?: string[] | null
          updated_at?: string
        }
        Update: {
          builder_id?: string
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          price_max?: number | null
          price_min?: number | null
          rera_id?: string | null
          status?: string
          unit_types?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          current_value: number | null
          id: string
          owner_id: string
          project_name: string | null
          purchase_price: number | null
          purchased_at: string | null
          unit_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          owner_id: string
          project_name?: string | null
          purchase_price?: number | null
          purchased_at?: string | null
          unit_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          owner_id?: string
          project_name?: string | null
          purchase_price?: number | null
          purchased_at?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          created_at: string
          id: string
          level: number
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string
          id?: string
          level?: number
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string
          id?: string
          level?: number
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          block: string | null
          carpet_sqft: number | null
          created_at: string
          floor: number | null
          id: string
          price: number | null
          project_id: string
          status: string
          type: string | null
          unit_no: string
          updated_at: string
        }
        Insert: {
          block?: string | null
          carpet_sqft?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          price?: number | null
          project_id: string
          status?: string
          type?: string | null
          unit_no: string
          updated_at?: string
        }
        Update: {
          block?: string | null
          carpet_sqft?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          price?: number | null
          project_id?: string
          status?: string
          type?: string | null
          unit_no?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_listings: {
        Row: {
          active: boolean
          category: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          price_from: number | null
          title: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price_from?: number | null
          title: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          category?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price_from?: number | null
          title?: string
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "builder"
        | "cp"
        | "customer"
        | "bank"
        | "vendor"
        | "admin"
        | "nri"
        | "landowner"
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
      app_role: [
        "builder",
        "cp",
        "customer",
        "bank",
        "vendor",
        "admin",
        "nri",
        "landowner",
      ],
    },
  },
} as const
