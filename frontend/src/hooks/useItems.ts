import { useQuery, useMutation, useQueryClient } from 'react-query';
import { itemsApi } from '../services/api';
import type { Item, SearchParams, CreateItemRequest } from '../services/api';

export function useItems(filters?: SearchParams) {
  return useQuery(['items', filters], () => itemsApi.getAll(filters), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useItem(id: string) {
  return useQuery(['items', id], () => itemsApi.getById(id), {
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (item: CreateItemRequest) => itemsApi.create(item),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['items']);
      },
    }
  );
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, updates }: { id: string; updates: Partial<Item> }) =>
      itemsApi.update(id, updates),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['items']);
        queryClient.invalidateQueries(['items', id]);
      },
    }
  );
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => itemsApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['items']);
      },
    }
  );
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ itemId, file, onProgress }: { 
      itemId: string; 
      file: File; 
      onProgress?: (progress: { uploadProgress: number; status: 'uploading' | 'processing' | 'analyzing' | 'generating'; message?: string }) => void 
    }) => itemsApi.uploadImage(itemId, file, onProgress),
    {
      onSuccess: (_, { itemId }) => {
        queryClient.invalidateQueries(['items']);
        queryClient.invalidateQueries(['items', itemId]);
      },
    }
  );
}

export function useUploadImageOnly() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ itemId, file, onProgress }: { 
      itemId: string; 
      file: File; 
      onProgress?: (progress: { uploadProgress: number; status: 'uploading'; message?: string }) => void 
    }) => itemsApi.uploadImageOnly(itemId, file, onProgress),
    {
      onSuccess: (_, { itemId }) => {
        queryClient.invalidateQueries(['items']);
        queryClient.invalidateQueries(['items', itemId]);
      },
    }
  );
}

export function useAnalyzeAllImages() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (itemId: string) => itemsApi.analyzeAllImages(itemId),
    {
      onSuccess: (_, itemId) => {
        queryClient.invalidateQueries(['items']);
        queryClient.invalidateQueries(['items', itemId]);
      },
    }
  );
}