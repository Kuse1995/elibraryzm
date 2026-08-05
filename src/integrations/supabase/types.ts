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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ebooks: {
        Row: {
          approval_status: string
          author: string
          category: string
          cover_url: string | null
          created_at: string
          description: string
          featured: boolean
          file_url: string | null
          id: string
          price: number
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          author: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          file_url?: string | null
          id?: string
          price?: number
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          author?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          file_url?: string | null
          id?: string
          price?: number
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_access: {
        Row: {
          active: boolean
          created_at: string
          id: string
          order_id: string | null
          phone: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          order_id?: string | null
          phone?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          order_id?: string | null
          phone?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_access_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          caption: string
          created_at: string
          direction: string
          ebook_id: string | null
          error: string | null
          id: string
          image_urls: string[]
          owner_user_id: string
          platform_post_ids: Json
          published_at: string | null
          scheduled_at: string | null
          status: string
          target_account_ids: string[]
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          direction?: string
          ebook_id?: string | null
          error?: string | null
          id?: string
          image_urls?: string[]
          owner_user_id: string
          platform_post_ids?: Json
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          target_account_ids?: string[]
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          direction?: string
          ebook_id?: string | null
          error?: string | null
          id?: string
          image_urls?: string[]
          owner_user_id?: string
          platform_post_ids?: Json
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          target_account_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          download_count: number
          ebook_id: string | null
          id: string
          order_id: string
          price: number
        }
        Insert: {
          created_at?: string
          download_count?: number
          ebook_id?: string | null
          id?: string
          order_id: string
          price?: number
        }
        Update: {
          created_at?: string
          download_count?: number
          ebook_id?: string | null
          id?: string
          order_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          failure_reason: string | null
          guest_email: string | null
          id: string
          items: Json
          payment_reference: string | null
          status: string
          total: number
          updated_at: string
          user_id: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          guest_email?: string | null
          id?: string
          items?: Json
          payment_reference?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          guest_email?: string | null
          id?: string
          items?: Json
          payment_reference?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string
          phone_number: string
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          phone_number: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          phone_number?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_schedules: {
        Row: {
          active: boolean
          audience: string | null
          created_at: string
          id: string
          image_count: number
          last_run_at: string | null
          mix: Json
          mode: string
          owner_user_id: string
          posts_per_week: number
          style_hints: string | null
          target_account_ids: string[]
          template: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string | null
          created_at?: string
          id?: string
          image_count?: number
          last_run_at?: string | null
          mix?: Json
          mode?: string
          owner_user_id: string
          posts_per_week?: number
          style_hints?: string | null
          target_account_ids?: string[]
          template?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string | null
          created_at?: string
          id?: string
          image_count?: number
          last_run_at?: string | null
          mix?: Json
          mode?: string
          owner_user_id?: string
          posts_per_week?: number
          style_hints?: string | null
          target_account_ids?: string[]
          template?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          subscription_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          subscription_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          subscription_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          display_name: string | null
          external_id: string
          id: string
          is_central: boolean
          metadata: Json
          owner_user_id: string | null
          platform: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          external_id: string
          id?: string
          is_central?: boolean
          metadata?: Json
          owner_user_id?: string | null
          platform: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          external_id?: string
          id?: string
          is_central?: boolean
          metadata?: Json
          owner_user_id?: string | null
          platform?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      studio_orders: {
        Row: {
          amount_ngwee: number
          created_at: string
          customer_name: string | null
          delivered_at: string | null
          ebook_id: string | null
          id: string
          idea: string
          lenco_reference: string | null
          notes: string | null
          payment_method: string
          phone: string
          reference: string
          status: string
          tier: string
          title: string | null
          updated_at: string
        }
        Insert: {
          amount_ngwee?: number
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          ebook_id?: string | null
          id?: string
          idea?: string
          lenco_reference?: string | null
          notes?: string | null
          payment_method?: string
          phone: string
          reference: string
          status?: string
          tier: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          amount_ngwee?: number
          created_at?: string
          customer_name?: string | null
          delivered_at?: string | null
          ebook_id?: string | null
          id?: string
          idea?: string
          lenco_reference?: string | null
          notes?: string | null
          payment_method?: string
          phone?: string
          reference?: string
          status?: string
          tier?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_orders_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ebook_access: {
        Row: {
          created_at: string
          ebook_id: string
          guest_email: string | null
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          ebook_id: string
          guest_email?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          ebook_id?: string
          guest_email?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ebook_access_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ebook_access_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          phone_e164: string
          state: Json
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          phone_e164: string
          state?: Json
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          phone_e164?: string
          state?: Json
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          created_at: string
          direction: string
          id: string
          intent: string
          media_count: number
          phone_e164: string
          profile_name: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          direction: string
          id?: string
          intent?: string
          media_count?: number
          phone_e164: string
          profile_name?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          direction?: string
          id?: string
          intent?: string
          media_count?: number
          phone_e164?: string
          profile_name?: string | null
        }
        Relationships: []
      }
      whatsapp_subscribers: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          opted_in_at: string
          opted_out_at: string | null
          phone_e164: string
          source: string | null
          tags: string[]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          opted_in_at?: string
          opted_out_at?: string | null
          phone_e164: string
          source?: string | null
          tags?: string[]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          opted_in_at?: string
          opted_out_at?: string | null
          phone_e164?: string
          source?: string | null
          tags?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_author_earnings: {
        Args: { _author_id: string }
        Returns: {
          available_balance: number
          net_earnings: number
          payout_requests_total: number
          platform_fees: number
          total_sales: number
        }[]
      }
      game_access_check: {
        Args: { p_mode?: string; p_phone?: string }
        Returns: Json
      }
      has_active_author_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_can_read_order: {
        Args: { _order_id: string; _uid: string }
        Returns: boolean
      }
      user_can_read_order_item: {
        Args: { _ebook_id: string; _order_id: string; _uid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "author"
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
      app_role: ["admin", "user", "author"],
    },
  },
} as const
