import axios from 'axios';
import type { Item, ItemImage, Settings, SearchParams } from '../../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const publicApi = {
  getItems: (params?: SearchParams): Promise<(Item & { images: ItemImage[] })[]> =>
    api.get('/items', { params }).then(res => res.data),
    
  getItem: (id: string): Promise<Item & { images: ItemImage[] }> =>
    api.get(`/items/${id}`).then(res => res.data),
    
  getSettings: (): Promise<Settings> =>
    api.get('/settings').then(res => res.data),
    
  getCategories: (): Promise<string[]> =>
    api.get('/categories').then(res => res.data),
};

export default api;