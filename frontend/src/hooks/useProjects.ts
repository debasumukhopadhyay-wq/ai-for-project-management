import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';
import toast from 'react-hot-toast';

export function useProjects(filters?: Record<string, any>) {
  return useQuery<{ data: Project[] }>({
    queryKey: ['projects', filters],
    queryFn: () => projectsApi.getAll(filters) as any,
  });
}

export function useProject(id: string) {
  return useQuery<{ data: Project }>({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getOne(id) as any,
    enabled: !!id,
  });
}

export function useProjectEVM(id: string) {
  return useQuery({
    queryKey: ['project-evm', id],
    queryFn: () => projectsApi.getEVM(id) as any,
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => projectsApi.create(data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create project');
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => projectsApi.update(id, data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update project');
    },
  });
}
