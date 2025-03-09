export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bet_history: {
        Row: {
          action: string
          bet_id: string
          details: Json | null
          id: string
          market_cap_at_action: number | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          bet_id: string
          details?: Json | null
          id?: string
          market_cap_at_action?: number | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          bet_id?: string
          details?: Json | null
          id?: string
          market_cap_at_action?: number | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bet_history_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["bet_id"]
          },
          {
            foreignKeyName: "bet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          bet_id: string
          bettor1_id: string
          bettor2_id: string | null
          created_at: string
          creator: string
          duration: number
          end_time: string | null
          initial_market_cap: number | null
          prediction_bettor1: string
          sol_amount: number
          start_time: string | null
          status: string
          token_mint: string
        }
        Insert: {
          bet_id?: string
          bettor1_id: string
          bettor2_id?: string | null
          created_at?: string
          creator: string
          duration: number
          end_time?: string | null
          initial_market_cap?: number | null
          prediction_bettor1: string
          sol_amount: number
          start_time?: string | null
          status?: string
          token_mint: string
        }
        Update: {
          bet_id?: string
          bettor1_id?: string
          bettor2_id?: string | null
          created_at?: string
          creator?: string
          duration?: number
          end_time?: string | null
          initial_market_cap?: number | null
          prediction_bettor1?: string
          sol_amount?: number
          start_time?: string | null
          status?: string
          token_mint?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_bettor1_id_fkey"
            columns: ["bettor1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_bettor2_id_fkey"
            columns: ["bettor2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_token_mint_fkey"
            columns: ["token_mint"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["token_mint"]
          },
        ]
      }
      tokens: {
        Row: {
          created_on: string | null
          current_market_cap: number
          initial_market_cap: number | null
          last_trade_price: number
          last_updated_time: string
          token_mint: string
          token_name: string
          token_symbol: string | null
          total_supply: number
        }
        Insert: {
          created_on?: string | null
          current_market_cap: number
          initial_market_cap?: number | null
          last_trade_price: number
          last_updated_time?: string
          token_mint: string
          token_name: string
          token_symbol?: string | null
          total_supply: number
        }
        Update: {
          created_on?: string | null
          current_market_cap?: number
          initial_market_cap?: number | null
          last_trade_price?: number
          last_updated_time?: string
          token_mint?: string
          token_name?: string
          token_symbol?: string | null
          total_supply?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          id: string
          username: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id: string
          username?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          username?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_bet_status: {
        Args: {
          p_bet_id: string
          p_status: string
          p_user_id: string
          p_action: string
          p_details?: Json
          p_market_cap?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
