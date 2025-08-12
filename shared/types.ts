export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  filename: string;
  filepath: string;
  ai_analysis: string | null;
  created_at: string;
}

export interface AIAnalysis {
  title: string;
  description: string;
  category: string;
  estimated_price: number;
  condition: string;
  tags: string[];
}

export interface Settings {
  openai_api_key?: string;
  openai_model?: string;
  garage_sale_title?: string;
  garage_sale_date?: string;
  garage_sale_address?: string;
  contact_info?: string;
}

export interface CreateItemRequest {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
}

export interface SearchParams {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'created_at' | 'price' | 'title';
  sort_order?: 'asc' | 'desc';
}

export type ViewMode = 'list' | 'grid';