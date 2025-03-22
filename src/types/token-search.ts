
export interface SearchedToken {
  id?: string;
  token_mint: string;
  token_name: string;
  token_symbol: string;
  search_count: number;
  first_searched_at?: string;
  last_searched_at?: string;
}
