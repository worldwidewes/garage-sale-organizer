import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsApi } from '../services/api';
import type { Settings } from '../services/api';

export function useSettings() {
  return useQuery(['settings'], settingsApi.get, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (settings: Partial<Settings>) => settingsApi.update(settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['settings']);
      },
    }
  );
}