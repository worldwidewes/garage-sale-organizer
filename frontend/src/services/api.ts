import axios from 'axios';
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

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for file uploads
});

// Items
export const itemsApi = {
  getAll: (params?: SearchParams): Promise<Item[]> =>
    api.get('/items', { params }).then(res => res.data),
    
  getById: (id: string): Promise<Item & { images: ItemImage[] }> =>
    api.get(`/items/${id}`).then(res => res.data),
    
  create: (item: CreateItemRequest): Promise<Item> =>
    api.post('/items', item).then(res => res.data),
    
  update: (id: string, updates: Partial<Item>): Promise<void> =>
    api.put(`/items/${id}`, updates).then(res => res.data),
    
  delete: (id: string): Promise<void> =>
    api.delete(`/items/${id}`).then(res => res.data),
    
  uploadImage: (
    itemId: string, 
    file: File,
    onProgress?: (progress: { uploadProgress: number; status: 'uploading' | 'processing' | 'analyzing' | 'generating'; message?: string }) => void
  ): Promise<{ 
    message: string; 
    image: ItemImage; 
    ai_analysis: AIAnalysis | null 
  }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    // Simulate more granular progress updates
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (currentProgress < 45 && onProgress) {
        currentProgress += Math.random() * 5;
        onProgress({ 
          uploadProgress: Math.min(currentProgress, 45), 
          status: 'uploading',
          message: 'Uploading image...'
        });
      }
    }, 200);
    
    return api.post(`/items/${itemId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minutes for image uploads with AI processing
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 50);
          onProgress({ 
            uploadProgress, 
            status: 'uploading',
            message: `Uploading... ${uploadProgress}%`
          });
        }
      },
    }).then(res => {
      clearInterval(progressInterval);
      
      // Simulate AI processing stages
      if (onProgress) {
        const aiStages = [
          { progress: 55, status: 'processing' as const, message: 'Processing image...' },
          { progress: 65, status: 'analyzing' as const, message: 'AI analyzing image...' },
          { progress: 75, status: 'generating' as const, message: 'Generating title...' },
          { progress: 85, status: 'generating' as const, message: 'Creating description...' },
          { progress: 95, status: 'generating' as const, message: 'Estimating price...' },
        ];
        
        aiStages.forEach((stage, index) => {
          setTimeout(() => {
            onProgress(stage);
          }, index * 300);
        });
      }
      
      return res.data;
    }).catch(err => {
      clearInterval(progressInterval);
      throw err;
    });
  },
};

// Settings
export const settingsApi = {
  get: (): Promise<Settings> =>
    api.get('/settings').then(res => res.data),
    
  update: (settings: Partial<Settings>): Promise<{ message: string }> =>
    api.put('/settings', settings).then(res => res.data),
};

// Categories
export const categoriesApi = {
  getAll: (): Promise<string[]> =>
    api.get('/categories').then(res => res.data),
};

// Images
export const imagesApi = {
  delete: (id: string): Promise<void> =>
    api.delete(`/images/${id}`).then(res => res.data),
};

// Health check
export const healthApi = {
  check: (): Promise<{ status: string; timestamp: string }> =>
    api.get('/health').then(res => res.data),
};

export default api;