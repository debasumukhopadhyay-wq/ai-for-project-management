import { create } from 'zustand';

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotState {
  isOpen: boolean;
  isLoading: boolean;
  messages: CopilotMessage[];
  currentProjectId: string | null;
  currentProgramId: string | null;
  openCopilot: (context?: { projectId?: string; programId?: string }) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  addMessage: (message: Omit<CopilotMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  currentProjectId: null,
  currentProgramId: null,

  openCopilot: (context) =>
    set({
      isOpen: true,
      currentProjectId: context?.projectId || null,
      currentProgramId: context?.programId || null,
    }),

  closeCopilot: () => set({ isOpen: false }),

  toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id: Math.random().toString(36).slice(2), timestamp: new Date() },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),
}));
