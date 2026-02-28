import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfoliosApi } from '@/lib/api';
import { Portfolio } from '@/types';
import toast from 'react-hot-toast';

export function usePortfolios() {
  return useQuery<{ data: Portfolio[] }>({
    queryKey: ['portfolios'],
    queryFn: () => portfoliosApi.getAll() as any,
  });
}

export function usePortfolio(id: string) {
  return useQuery<{ data: Portfolio }>({
    queryKey: ['portfolio', id],
    queryFn: () => portfoliosApi.getOne(id) as any,
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => portfoliosApi.create(data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success('Portfolio created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create portfolio');
    },
  });
}

export function useUpdatePortfolio(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => portfoliosApi.update(id, data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', id] });
      qc.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success('Portfolio updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update portfolio');
    },
  });
}
