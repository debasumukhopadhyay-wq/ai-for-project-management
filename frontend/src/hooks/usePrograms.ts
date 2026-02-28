import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsApi } from '@/lib/api';
import { Program } from '@/types';
import toast from 'react-hot-toast';

export function usePrograms(portfolioId?: string) {
  return useQuery<{ data: Program[] }>({
    queryKey: ['programs', portfolioId],
    queryFn: () => programsApi.getAll(portfolioId) as any,
  });
}

export function useProgram(id: string) {
  return useQuery<{ data: Program }>({
    queryKey: ['program', id],
    queryFn: () => programsApi.getOne(id) as any,
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => programsApi.create(data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create program');
    },
  });
}

export function useUpdateProgram(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => programsApi.update(id, data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program', id] });
      qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update program');
    },
  });
}
