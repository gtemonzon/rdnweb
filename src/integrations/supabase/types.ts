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
      blog_permissions: {
        Row: {
          allowed_categories: string[] | null
          can_create: boolean
          can_delete_all: boolean
          can_delete_own: boolean
          can_edit_all: boolean
          can_edit_own: boolean
          can_publish: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_categories?: string[] | null
          can_create?: boolean
          can_delete_all?: boolean
          can_delete_own?: boolean
          can_edit_all?: boolean
          can_edit_own?: boolean
          can_publish?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_categories?: string[] | null
          can_create?: boolean
          can_delete_all?: boolean
          can_delete_own?: boolean
          can_edit_all?: boolean
          can_edit_own?: boolean
          can_publish?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      donation_notification_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          reference_number: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          reference_number: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          reference_number?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      donation_receipts: {
        Row: {
          cancelled_at: string | null
          certified_at: string | null
          created_at: string
          created_by: string | null
          descripcion: string
          donation_id: string | null
          error_message: string | null
          id: string
          monto: number
          numero: string | null
          pdf_url: string | null
          receipt_type: string
          receptor_correo: string | null
          receptor_direccion: string | null
          receptor_nit: string
          receptor_nombre: string
          serie: string | null
          status: string
          updated_at: string
          uuid_sat: string | null
          xml_url: string | null
        }
        Insert: {
          cancelled_at?: string | null
          certified_at?: string | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          donation_id?: string | null
          error_message?: string | null
          id?: string
          monto: number
          numero?: string | null
          pdf_url?: string | null
          receipt_type?: string
          receptor_correo?: string | null
          receptor_direccion?: string | null
          receptor_nit: string
          receptor_nombre: string
          serie?: string | null
          status?: string
          updated_at?: string
          uuid_sat?: string | null
          xml_url?: string | null
        }
        Update: {
          cancelled_at?: string | null
          certified_at?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          donation_id?: string | null
          error_message?: string | null
          id?: string
          monto?: number
          numero?: string | null
          pdf_url?: string | null
          receipt_type?: string
          receptor_correo?: string | null
          receptor_direccion?: string | null
          receptor_nit?: string
          receptor_nombre?: string
          serie?: string | null
          status?: string
          updated_at?: string
          uuid_sat?: string | null
          xml_url?: string | null
        }
        Relationships: []
      }
      donation_settings: {
        Row: {
          accounting_email_body: string | null
          accounting_email_subject: string
          accounting_emails: string[]
          created_at: string
          donor_email_body: string | null
          donor_email_enabled: boolean
          donor_email_subject: string
          environment: string
          id: string
          min_amount: number
          min_amount_usd: number
          send_accounting_email: boolean
          send_donor_email: boolean
          sender_email_address: string | null
          sender_email_name: string
          suggested_amounts: Json
          suggested_amounts_usd: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accounting_email_body?: string | null
          accounting_email_subject?: string
          accounting_emails?: string[]
          created_at?: string
          donor_email_body?: string | null
          donor_email_enabled?: boolean
          donor_email_subject?: string
          environment?: string
          id?: string
          min_amount?: number
          min_amount_usd?: number
          send_accounting_email?: boolean
          send_donor_email?: boolean
          sender_email_address?: string | null
          sender_email_name?: string
          suggested_amounts?: Json
          suggested_amounts_usd?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accounting_email_body?: string | null
          accounting_email_subject?: string
          accounting_emails?: string[]
          created_at?: string
          donor_email_body?: string | null
          donor_email_enabled?: boolean
          donor_email_subject?: string
          environment?: string
          id?: string
          min_amount?: number
          min_amount_usd?: number
          send_accounting_email?: boolean
          send_donor_email?: boolean
          sender_email_address?: string | null
          sender_email_name?: string
          suggested_amounts?: Json
          suggested_amounts_usd?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          donation_type: string
          donor_address: string | null
          donor_email: string
          donor_id: string | null
          donor_name: string
          donor_nit: string | null
          donor_phone: string | null
          fel_date: string | null
          fel_issued: boolean
          fel_number: string | null
          fel_recorded_at: string | null
          fel_recorded_by: string | null
          fel_series: string | null
          id: string
          notes: string | null
          payment_method: string
          receipt_id: string | null
          source: string | null
          status: string
          updated_at: string | null
          wants_receipt: boolean | null
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          donation_type?: string
          donor_address?: string | null
          donor_email: string
          donor_id?: string | null
          donor_name: string
          donor_nit?: string | null
          donor_phone?: string | null
          fel_date?: string | null
          fel_issued?: boolean
          fel_number?: string | null
          fel_recorded_at?: string | null
          fel_recorded_by?: string | null
          fel_series?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          wants_receipt?: boolean | null
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          donation_type?: string
          donor_address?: string | null
          donor_email?: string
          donor_id?: string | null
          donor_name?: string
          donor_nit?: string | null
          donor_phone?: string | null
          fel_date?: string | null
          fel_issued?: boolean
          fel_number?: string | null
          fel_recorded_at?: string | null
          fel_recorded_by?: string | null
          fel_series?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          receipt_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          wants_receipt?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "donation_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address: string | null
          created_at: string | null
          donation_count: number | null
          email: string
          first_donation_at: string | null
          id: string
          last_donation_at: string | null
          name: string
          nit: string | null
          phone: string | null
          total_donated: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          donation_count?: number | null
          email: string
          first_donation_at?: string | null
          id?: string
          last_donation_at?: string | null
          name: string
          nit?: string | null
          phone?: string | null
          total_donated?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          donation_count?: number | null
          email?: string
          first_donation_at?: string | null
          id?: string
          last_donation_at?: string | null
          name?: string
          nit?: string | null
          phone?: string | null
          total_donated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          created_at: string
          email_type: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      fel_configuration: {
        Row: {
          activo: boolean
          ambiente: string
          codigo_establecimiento: number
          codigo_postal: string | null
          correo_copia: string | null
          created_at: string
          departamento: string
          direccion: string
          id: string
          municipio: string
          nit_emisor: string
          nombre_comercial: string
          nombre_emisor: string
          pais: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ambiente?: string
          codigo_establecimiento?: number
          codigo_postal?: string | null
          correo_copia?: string | null
          created_at?: string
          departamento: string
          direccion: string
          id?: string
          municipio: string
          nit_emisor: string
          nombre_comercial: string
          nombre_emisor: string
          pais?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ambiente?: string
          codigo_establecimiento?: number
          codigo_postal?: string | null
          correo_copia?: string | null
          created_at?: string
          departamento?: string
          direccion?: string
          id?: string
          municipio?: string
          nit_emisor?: string
          nombre_comercial?: string
          nombre_emisor?: string
          pais?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_vacancies: {
        Row: {
          application_deadline: string
          application_url: string | null
          contract_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          location: string
          pdf_url: string | null
          published_at: string
          temporality: string
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline: string
          application_url?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string
          pdf_url?: string | null
          published_at?: string
          temporality?: string
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string
          application_url?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string
          pdf_url?: string | null
          published_at?: string
          temporality?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_permissions: {
        Row: {
          can_create: boolean
          can_delete_all: boolean
          can_delete_own: boolean
          can_edit_all: boolean
          can_edit_own: boolean
          can_publish: boolean
          can_view: boolean
          created_at: string
          custom_settings: Json | null
          id: string
          module_name: Database["public"]["Enums"]["app_module"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete_all?: boolean
          can_delete_own?: boolean
          can_edit_all?: boolean
          can_edit_own?: boolean
          can_publish?: boolean
          can_view?: boolean
          created_at?: string
          custom_settings?: Json | null
          id?: string
          module_name: Database["public"]["Enums"]["app_module"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete_all?: boolean
          can_delete_own?: boolean
          can_edit_all?: boolean
          can_edit_own?: boolean
          can_publish?: boolean
          can_view?: boolean
          created_at?: string
          custom_settings?: Json | null
          id?: string
          module_name?: Database["public"]["Enums"]["app_module"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          section_key: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          section_key: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          section_key?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      stat_assets: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number
          stat_post_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
          stat_post_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
          stat_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stat_assets_stat_post_id_fkey"
            columns: ["stat_post_id"]
            isOneToOne: false
            referencedRelation: "stat_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string | null
          cover_image_url: string | null
          created_at: string
          cutoff_date: string | null
          id: string
          methodology_notes: string | null
          period_end: string | null
          period_start: string | null
          published: boolean
          published_at: string | null
          slug: string
          source_name: string | null
          source_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          cutoff_date?: string | null
          id?: string
          methodology_notes?: string | null
          period_end?: string | null
          period_start?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          cutoff_date?: string | null
          id?: string
          methodology_notes?: string | null
          period_end?: string | null
          period_start?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transparency_documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          file_type: string
          file_url: string
          id: string
          is_active: boolean
          numeral_id: number
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          file_type?: string
          file_url: string
          id?: string
          is_active?: boolean
          numeral_id: number
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean
          numeral_id?: number
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "transparency_documents_numeral_id_fkey"
            columns: ["numeral_id"]
            isOneToOne: false
            referencedRelation: "transparency_numerals"
            referencedColumns: ["id"]
          },
        ]
      }
      transparency_numerals: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: number
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id: number
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_category: {
        Args: { _category: string; _user_id: string }
        Returns: boolean
      }
      can_access_module_category: {
        Args: {
          _category: string
          _module: Database["public"]["Enums"]["app_module"]
          _user_id: string
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_donation_status: {
        Args: { ref_number: string }
        Returns: {
          confirmed_at: string
          status: string
        }[]
      }
      get_public_donation_settings: {
        Args: never
        Returns: {
          min_amount: number
          min_amount_usd: number
          suggested_amounts: Json
          suggested_amounts_usd: Json
        }[]
      }
      has_blog_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_module_permission: {
        Args: {
          _module: Database["public"]["Enums"]["app_module"]
          _permission: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
    }
    Enums: {
      app_module:
        | "blog"
        | "crowdfunding"
        | "reports"
        | "donations"
        | "content"
        | "partners"
        | "receipts"
        | "transparency"
        | "vacancies"
      app_role: "admin" | "editor"
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
      app_module: [
        "blog",
        "crowdfunding",
        "reports",
        "donations",
        "content",
        "partners",
        "receipts",
        "transparency",
        "vacancies",
      ],
      app_role: ["admin", "editor"],
    },
  },
} as const
