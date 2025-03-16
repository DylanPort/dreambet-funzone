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
      bets: {
        Row: {
          bet_id: string
          bettor1_id: string
          bettor2_id: string | null
          created_at: string | null
          creator: string
          duration: number
          on_chain_id: string | null
          points_won: number | null
          prediction_bettor1: string
          sol_amount: number
          status: string | null
          token_mint: string
          token_name: string | null
          token_symbol: string | null
          transaction_signature: string | null
        }
        Insert: {
          bet_id?: string
          bettor1_id: string
          bettor2_id?: string | null
          created_at?: string | null
          creator: string
          duration?: number
          on_chain_id?: string | null
          points_won?: number | null
          prediction_bettor1: string
          sol_amount: number
          status?: string | null
          token_mint: string
          token_name?: string | null
          token_symbol?: string | null
          transaction_signature?: string | null
        }
        Update: {
          bet_id?: string
          bettor1_id?: string
          bettor2_id?: string | null
          created_at?: string | null
          creator?: string
          duration?: number
          on_chain_id?: string | null
          points_won?: number | null
          prediction_bettor1?: string
          sol_amount?: number
          status?: string | null
          token_mint?: string
          token_name?: string | null
          token_symbol?: string | null
          transaction_signature?: string | null
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
      bounties: {
        Row: {
          bounty_address: string | null
          budget: number
          cancel_transaction: string | null
          created_at: string
          creator_id: string
          description: string
          description_cid: string | null
          end_date: string
          id: string
          required_proof: string
          start_date: string
          status: string
          tags: string[] | null
          title: string
          transaction_signature: string | null
          updated_at: string
          views: number | null
        }
        Insert: {
          bounty_address?: string | null
          budget: number
          cancel_transaction?: string | null
          created_at?: string
          creator_id: string
          description: string
          description_cid?: string | null
          end_date: string
          id?: string
          required_proof: string
          start_date?: string
          status?: string
          tags?: string[] | null
          title: string
          transaction_signature?: string | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          bounty_address?: string | null
          budget?: number
          cancel_transaction?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          description_cid?: string | null
          end_date?: string
          id?: string
          required_proof?: string
          start_date?: string
          status?: string
          tags?: string[] | null
          title?: string
          transaction_signature?: string | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bounties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          bounty_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          bounty_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          bounty_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          action: string
          amount: number
          created_at: string | null
          id: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string | null
          id?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_sign_in: boolean | null
          id: string
          public_key: string | null
          updated_at: string
          username: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_sign_in?: boolean | null
          id: string
          public_key?: string | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_sign_in?: boolean | null
          id?: string
          public_key?: string | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          accept_transaction: string | null
          bounty_id: string
          created_at: string
          description: string
          id: string
          proof_cid: string | null
          proof_link: string
          status: string
          submitter_id: string
          transaction_signature: string | null
          updated_at: string
          verify_transaction: string | null
        }
        Insert: {
          accept_transaction?: string | null
          bounty_id: string
          created_at?: string
          description: string
          id?: string
          proof_cid?: string | null
          proof_link: string
          status?: string
          submitter_id: string
          transaction_signature?: string | null
          updated_at?: string
          verify_transaction?: string | null
        }
        Update: {
          accept_transaction?: string | null
          bounty_id?: string
          created_at?: string
          description?: string
          id?: string
          proof_cid?: string | null
          proof_link?: string
          status?: string
          submitter_id?: string
          transaction_signature?: string | null
          updated_at?: string
          verify_transaction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          last_trade_price: number | null
          last_updated_time: string | null
          token_mint: string
          token_name: string
          token_symbol: string
          volume_24h: number | null
        }
        Insert: {
          last_trade_price?: number | null
          last_updated_time?: string | null
          token_mint: string
          token_name: string
          token_symbol: string
          volume_24h?: number | null
        }
        Update: {
          last_trade_price?: number | null
          last_updated_time?: string | null
          token_mint?: string
          token_name?: string
          token_symbol?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          points: number | null
          updated_at: string | null
          username: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
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
      increment_bounty_views: {
        Args: {
          bounty_id: string
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
