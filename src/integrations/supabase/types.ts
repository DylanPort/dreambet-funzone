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
      app_features: {
        Row: {
          config: Json | null
          created_at: string
          end_date: string
          feature_name: string
          id: string
          is_active: boolean
          start_date: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          end_date: string
          feature_name: string
          id?: string
          is_active?: boolean
          start_date?: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          end_date?: string
          feature_name?: string
          id?: string
          is_active?: boolean
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      bet_history: {
        Row: {
          action: string
          bet_id: string
          created_at: string | null
          details: Json | null
          id: string
          market_cap_at_action: number | null
          user_id: string | null
        }
        Insert: {
          action: string
          bet_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          market_cap_at_action?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string
          bet_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          market_cap_at_action?: number | null
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
          created_at: string | null
          creator: string
          current_market_cap: number | null
          duration: number
          end_time: string | null
          initial_market_cap: number | null
          on_chain_id: string | null
          outcome: string | null
          percentage_change: number | null
          points_won: number | null
          prediction_bettor1: string
          sol_amount: number
          start_time: string | null
          status: string | null
          token_mint: string
          token_name: string | null
          token_symbol: string | null
          transaction_signature: string | null
          winner: string | null
        }
        Insert: {
          bet_id?: string
          bettor1_id: string
          bettor2_id?: string | null
          created_at?: string | null
          creator: string
          current_market_cap?: number | null
          duration?: number
          end_time?: string | null
          initial_market_cap?: number | null
          on_chain_id?: string | null
          outcome?: string | null
          percentage_change?: number | null
          points_won?: number | null
          prediction_bettor1: string
          sol_amount: number
          start_time?: string | null
          status?: string | null
          token_mint: string
          token_name?: string | null
          token_symbol?: string | null
          transaction_signature?: string | null
          winner?: string | null
        }
        Update: {
          bet_id?: string
          bettor1_id?: string
          bettor2_id?: string | null
          created_at?: string | null
          creator?: string
          current_market_cap?: number | null
          duration?: number
          end_time?: string | null
          initial_market_cap?: number | null
          on_chain_id?: string | null
          outcome?: string | null
          percentage_change?: number | null
          points_won?: number | null
          prediction_bettor1?: string
          sol_amount?: number
          start_time?: string | null
          status?: string | null
          token_mint?: string
          token_name?: string | null
          token_symbol?: string | null
          transaction_signature?: string | null
          winner?: string | null
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
          max_participants: number | null
          project_description: string | null
          project_logo: string | null
          project_name: string
          project_url: string | null
          pxb_reward: number
          required_proof: string | null
          start_date: string
          status: string
          tags: string[] | null
          task_type: string
          telegram_url: string | null
          title: string
          transaction_signature: string | null
          twitter_url: string | null
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
          max_participants?: number | null
          project_description?: string | null
          project_logo?: string | null
          project_name?: string
          project_url?: string | null
          pxb_reward?: number
          required_proof?: string | null
          start_date?: string
          status?: string
          tags?: string[] | null
          task_type?: string
          telegram_url?: string | null
          title: string
          transaction_signature?: string | null
          twitter_url?: string | null
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
          max_participants?: number | null
          project_description?: string | null
          project_logo?: string | null
          project_name?: string
          project_url?: string | null
          pxb_reward?: number
          required_proof?: string | null
          start_date?: string
          status?: string
          tags?: string[] | null
          task_type?: string
          telegram_url?: string | null
          title?: string
          transaction_signature?: string | null
          twitter_url?: string | null
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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
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
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
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
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          pxb_earned: number | null
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
          pxb_earned?: number | null
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
          pxb_earned?: number | null
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
      token_portfolios: {
        Row: {
          averagepurchaseprice: number
          created_at: string
          currentvalue: number
          id: string
          lastupdated: string
          quantity: number
          tokenid: string
          tokenname: string
          tokensymbol: string
          userid: string
        }
        Insert: {
          averagepurchaseprice: number
          created_at?: string
          currentvalue: number
          id?: string
          lastupdated?: string
          quantity: number
          tokenid: string
          tokenname: string
          tokensymbol: string
          userid: string
        }
        Update: {
          averagepurchaseprice?: number
          created_at?: string
          currentvalue?: number
          id?: string
          lastupdated?: string
          quantity?: number
          tokenid?: string
          tokenname?: string
          tokensymbol?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_portfolios_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_searches: {
        Row: {
          first_searched_at: string
          id: string
          last_searched_at: string
          search_count: number
          token_mint: string
          token_name: string
          token_symbol: string
        }
        Insert: {
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          search_count?: number
          token_mint: string
          token_name: string
          token_symbol: string
        }
        Update: {
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          search_count?: number
          token_mint?: string
          token_name?: string
          token_symbol?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          created_at: string
          id: string
          price: number
          pxbamount: number
          quantity: number
          timestamp: string
          tokenid: string
          tokenname: string
          tokensymbol: string
          type: string
          userid: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          pxbamount: number
          quantity: number
          timestamp?: string
          tokenid: string
          tokenname: string
          tokensymbol: string
          type: string
          userid: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          pxbamount?: number
          quantity?: number
          timestamp?: string
          tokenid?: string
          tokenname?: string
          tokensymbol?: string
          type?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_volume_history: {
        Row: {
          created_at: string | null
          id: string
          token_mint: string
          volume_24h: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_mint: string
          volume_24h?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token_mint?: string
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_volume_history_token_mint_fkey"
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
          current_market_cap: number | null
          initial_market_cap: number | null
          last_trade_price: number | null
          last_updated_time: string | null
          token_mint: string
          token_name: string
          token_symbol: string
          total_supply: number | null
          volume_24h: number | null
        }
        Insert: {
          created_on?: string | null
          current_market_cap?: number | null
          initial_market_cap?: number | null
          last_trade_price?: number | null
          last_updated_time?: string | null
          token_mint: string
          token_name: string
          token_symbol: string
          total_supply?: number | null
          volume_24h?: number | null
        }
        Update: {
          created_on?: string | null
          current_market_cap?: number | null
          initial_market_cap?: number | null
          last_trade_price?: number | null
          last_updated_time?: string | null
          token_mint?: string
          token_name?: string
          token_symbol?: string
          total_supply?: number | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_following: boolean | null
          points: number | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
          username: string | null
          wallet_address: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_following?: boolean | null
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          username?: string | null
          wallet_address: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_following?: boolean | null
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          username?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["referral_code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement: {
        Args: {
          value?: number
        }
        Returns: number
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_conversations: {
        Args: {
          user_id: string
        }
        Returns: {
          conversation_user_id: string
          conversation_username: string
          conversation_display_name: string
          conversation_avatar_url: string
          last_message: string
          last_message_time: string
          unread_count: number
        }[]
      }
      get_total_minted_pxb: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      increment: {
        Args: {
          value?: number
        }
        Returns: number
      }
      increment_bounty_views: {
        Args: {
          bounty_id: string
        }
        Returns: undefined
      }
      process_pending_referrals: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_referral_reward: {
        Args: {
          referrer_id: string
          referred_id: string
        }
        Returns: boolean
      }
      subtract_from_house_supply: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      transfer_pxb_points: {
        Args: {
          sender_id: string
          recipient_id: string
          amount: number
        }
        Returns: boolean
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
