// Generated from LockBox's Project after the seller migrations. Do not hand edit.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      cart_items: {
        Row: {
          added_at: string;
          cart_id: string;
          id: string;
          product_id: string;
          quantity: number;
        };
        Insert: {
          added_at?: string;
          cart_id: string;
          id?: string;
          product_id: string;
          quantity: number;
        };
        Update: {
          added_at?: string;
          cart_id?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          seller_label: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          seller_label?: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          seller_label?: string;
          slug?: string;
        };
        Relationships: [];
      };
      disputes: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          opened_by: string;
          order_id: string;
          reason: string;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["dispute_status"];
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          opened_by: string;
          order_id: string;
          reason: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["dispute_status"];
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          opened_by?: string;
          order_id?: string;
          reason?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["dispute_status"];
        };
        Relationships: [
          {
            foreignKeyName: "disputes_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "disputes_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      live_session_products: {
        Row: {
          product_id: string;
          session_id: string;
        };
        Insert: {
          product_id: string;
          session_id: string;
        };
        Update: {
          product_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "live_session_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "live_session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "live_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      live_sessions: {
        Row: {
          cover_url: string | null;
          created_at: string;
          description: string | null;
          ended_at: string | null;
          id: string;
          scheduled_at: string | null;
          seller_id: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["live_status"];
          title: string;
          viewer_count: number;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ended_at?: string | null;
          id?: string;
          scheduled_at?: string | null;
          seller_id: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["live_status"];
          title: string;
          viewer_count?: number;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ended_at?: string | null;
          id?: string;
          scheduled_at?: string | null;
          seller_id?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["live_status"];
          title?: string;
          viewer_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "live_sessions_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lockbox_points: {
        Row: {
          address: string;
          capacity: number;
          city: string;
          created_at: string;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          manager_id: string | null;
          name: string;
          phone: string | null;
        };
        Insert: {
          address: string;
          capacity?: number;
          city: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          manager_id?: string | null;
          name: string;
          phone?: string | null;
        };
        Update: {
          address?: string;
          capacity?: number;
          city?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          manager_id?: string | null;
          name?: string;
          phone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lockbox_points_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          reference_id: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          reference_id?: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          reference_id?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_id: string;
          product_title: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_id: string;
          product_title?: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string;
          product_title?: string;
          quantity?: number;
          subtotal?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          comment: string | null;
          created_at: string;
          id: string;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          changed_by?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          changed_by?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          buyer_id: string;
          buyer_label: string;
          cancelled_at: string | null;
          commission_amount: number;
          created_at: string;
          delivered_at: string | null;
          dispatched_at: string | null;
          id: string;
          lockbox_id: string;
          notes: string | null;
          paid_at: string | null;
          qr_code: string | null;
          qr_expires_at: string | null;
          released_at: string | null;
          seller_id: string;
          settlement_delay_hours: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          test_reference: string | null;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          buyer_label?: string;
          cancelled_at?: string | null;
          commission_amount?: number;
          created_at?: string;
          delivered_at?: string | null;
          dispatched_at?: string | null;
          id?: string;
          lockbox_id: string;
          notes?: string | null;
          paid_at?: string | null;
          qr_code?: string | null;
          qr_expires_at?: string | null;
          released_at?: string | null;
          seller_id: string;
          settlement_delay_hours?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          test_reference?: string | null;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          buyer_id?: string;
          buyer_label?: string;
          cancelled_at?: string | null;
          commission_amount?: number;
          created_at?: string;
          delivered_at?: string | null;
          dispatched_at?: string | null;
          id?: string;
          lockbox_id?: string;
          notes?: string | null;
          paid_at?: string | null;
          qr_code?: string | null;
          qr_expires_at?: string | null;
          released_at?: string | null;
          seller_id?: string;
          settlement_delay_hours?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          test_reference?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_lockbox_id_fkey";
            columns: ["lockbox_id"];
            isOneToOne: false;
            referencedRelation: "lockbox_points";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          account_info: string | null;
          amount: number;
          id: string;
          method: string;
          processed_at: string | null;
          requested_at: string;
          seller_id: string;
          status: Database["public"]["Enums"]["transaction_status"];
        };
        Insert: {
          account_info?: string | null;
          amount: number;
          id?: string;
          method: string;
          processed_at?: string | null;
          requested_at?: string;
          seller_id: string;
          status?: Database["public"]["Enums"]["transaction_status"];
        };
        Update: {
          account_info?: string | null;
          amount?: number;
          id?: string;
          method?: string;
          processed_at?: string | null;
          requested_at?: string;
          seller_id?: string;
          status?: Database["public"]["Enums"]["transaction_status"];
        };
        Relationships: [
          {
            foreignKeyName: "payouts_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          code: string;
          commission_rate: number;
          created_at: string;
          description: string | null;
          features: Json | null;
          id: string;
          is_active: boolean;
          is_test_plan: boolean;
          monthly_price: number;
          name: string;
          settlement_delay_hours: number;
        };
        Insert: {
          code: string;
          commission_rate: number;
          created_at?: string;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          is_test_plan?: boolean;
          monthly_price?: number;
          name: string;
          settlement_delay_hours?: number;
        };
        Update: {
          code?: string;
          commission_rate?: number;
          created_at?: string;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          is_test_plan?: boolean;
          monthly_price?: number;
          name?: string;
          settlement_delay_hours?: number;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          position: number;
          product_id: string;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          position?: number;
          product_id: string;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          position?: number;
          product_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_tags: {
        Row: {
          confidence: number | null;
          created_at: string;
          product_id: string;
          source: string;
          tag_id: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          product_id: string;
          source?: string;
          tag_id: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          product_id?: string;
          source?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          price: number;
          seller_id: string;
          seller_status: string;
          sku: string | null;
          stock: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          price: number;
          seller_id: string;
          seller_status?: string;
          sku?: string | null;
          stock?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          price?: number;
          seller_id?: string;
          seller_status?: string;
          sku?: string | null;
          stock?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          is_verified: boolean;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          is_verified?: boolean;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          rating: number;
          target_id: string;
        };
        Insert: {
          author_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          rating: number;
          target_id: string;
        };
        Update: {
          author_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          rating?: number;
          target_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancelled_at: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          plan_id: string;
          seller_id: string;
          started_at: string;
          status: Database["public"]["Enums"]["subscription_status"];
        };
        Insert: {
          cancelled_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan_id: string;
          seller_id: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
        };
        Update: {
          cancelled_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan_id?: string;
          seller_id?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          completed_at: string | null;
          created_at: string;
          external_id: string | null;
          id: string;
          metadata: Json | null;
          order_id: string;
          payment_method: string | null;
          status: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Insert: {
          amount: number;
          completed_at?: string | null;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id: string;
          payment_method?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Update: {
          amount?: number;
          completed_at?: string | null;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id?: string;
          payment_method?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      seller_action: {
        Args: { action: Json; request_id: string };
        Returns: undefined;
      };
      seller_state: { Args: never; Returns: Json };
    };
    Enums: {
      dispute_status: "open" | "in_review" | "resolved" | "rejected";
      live_status: "scheduled" | "live" | "ended" | "cancelled";
      notification_type:
        | "order_update"
        | "payment"
        | "delivery"
        | "dispute"
        | "system"
        | "promotion";
      order_status:
        | "pending"
        | "paid"
        | "dispatched"
        | "in_lockbox"
        | "ready"
        | "delivered"
        | "released"
        | "cancelled"
        | "refunded"
        | "disputed";
      subscription_status: "active" | "cancelled" | "expired" | "pending";
      transaction_status: "pending" | "completed" | "failed" | "reversed";
      transaction_type:
        | "escrow_retain"
        | "escrow_release"
        | "refund"
        | "payout"
        | "commission";
      user_role: "comprador" | "vendedor" | "despachador" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      dispute_status: ["open", "in_review", "resolved", "rejected"],
      live_status: ["scheduled", "live", "ended", "cancelled"],
      notification_type: [
        "order_update",
        "payment",
        "delivery",
        "dispute",
        "system",
        "promotion",
      ],
      order_status: [
        "pending",
        "paid",
        "dispatched",
        "in_lockbox",
        "ready",
        "delivered",
        "released",
        "cancelled",
        "refunded",
        "disputed",
      ],
      subscription_status: ["active", "cancelled", "expired", "pending"],
      transaction_status: ["pending", "completed", "failed", "reversed"],
      transaction_type: [
        "escrow_retain",
        "escrow_release",
        "refund",
        "payout",
        "commission",
      ],
      user_role: ["comprador", "vendedor", "despachador", "admin"],
    },
  },
} as const;
