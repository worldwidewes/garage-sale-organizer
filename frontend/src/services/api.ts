import axios from 'axios';
import { debugAPI, debugUpload, debugProgress, debugError } from '../utils/debug';
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
  gemini_api_key?: string;
  ai_provider?: 'openai' | 'gemini';
  openai_model?: string;
  gemini_model?: string;
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

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    debugAPI(`${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data instanceof FormData ? '[FormData]' : config.data
    });
    return config;
  },
  (error) => {
    debugError('Request failed', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    debugAPI(`Response ${response.status} from ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    debugError(`API Error ${error.response?.status} from ${error.config?.url}`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

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
    debugUpload('Starting image upload', { itemId, fileName: file.name, fileSize: file.size });
    
    const formData = new FormData();
    formData.append('image', file);
    
    return api.post(`/items/${itemId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minutes for image uploads with AI processing
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          debugProgress(`Upload progress: ${uploadProgress}%`, {
            loaded: progressEvent.loaded,
            total: progressEvent.total
          });
          onProgress({ 
            uploadProgress, 
            status: 'uploading',
            message: `Uploading image... ${uploadProgress}%`
          });
        }
      },
    }).then(res => {
      debugUpload('Upload completed, starting AI processing', res.data);
      
      // The backend already completed everything, just show completion
      if (onProgress) {
        // Brief processing indication then complete
        setTimeout(() => {
          debugProgress('AI processing complete');
          onProgress({ 
            uploadProgress: 100, 
            status: 'analyzing', 
            message: 'AI analysis complete!' 
          });
        }, 100);
      }
      
      return res.data;
    }).catch(error => {
      debugError('Upload failed', error);
      throw error;
    });
  },

  uploadImageOnly: (
    itemId: string,
    file: File,
    onProgress?: (progress: { uploadProgress: number; status: 'uploading'; message?: string }) => void
  ): Promise<{ message: string; image: ItemImage }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    debugUpload('Starting image-only upload', {
      itemId,
      fileName: file.name,
      fileSize: file.size
    });
    
    return api.post(`/items/${itemId}/images?skipAI=true`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 3 minutes
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          debugProgress(`Upload progress: ${uploadProgress}%`, {
            loaded: progressEvent.loaded,
            total: progressEvent.total
          });
          onProgress({ 
            uploadProgress, 
            status: 'uploading',
            message: `Uploading image... ${uploadProgress}%`
          });
        }
      },
    }).then(res => {
      debugUpload('Image-only upload completed', res.data);
      return res.data;
    }).catch(error => {
      debugError('Image-only upload failed', error);
      throw error;
    });
  },

  analyzeAllImages: (itemId: string): Promise<{
    message: string;
    analysis: AIAnalysis;
    updated_images: number;
  }> => {
    debugUpload('Starting batch AI analysis', { itemId });
    
    return api.post(`/items/${itemId}/analyze`, {}, {
      timeout: 300000, // 5 minutes for batch analysis
    }).then(res => {
      debugUpload('Batch AI analysis completed', res.data);
      return res.data;
    }).catch(error => {
      debugError('Batch AI analysis failed', error);
      throw error;
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

// AI Usage and Models
export const aiApi = {
  getUsage: (): Promise<{
    total_cost: number;
    total_tokens: number;
    total_requests: number;
    operations: {
      image_analysis: { count: number; cost: number; tokens: number };
      description_generation: { count: number; cost: number; tokens: number };
    };
    session_start: string;
  }> =>
    api.get('/ai/usage').then(res => res.data),
    
  getModels: (): Promise<{
    available_models: {
      openai: Array<{ id: string; name: string; capabilities: string[]; recommended?: boolean }>;
      gemini: Array<{ id: string; name: string; capabilities: string[]; recommended?: boolean }>;
    };
    current_provider: 'openai' | 'gemini';
    current_model: string;
    ai_initialized: boolean;
  }> =>
    api.get('/ai/models').then(res => res.data),

  getProvider: (): Promise<{ provider: string; model: string; initialized: boolean }> =>
    api.get('/ai/provider').then(res => res.data),

  updateProvider: (data: { provider: string; model?: string }): Promise<{ message: string }> =>
    api.put('/ai/provider', data).then(res => res.data),
};

// Health check
export const healthApi = {
  check: (): Promise<{ status: string; timestamp: string }> =>
    api.get('/health').then(res => res.data),
};

export { api };
export default api;