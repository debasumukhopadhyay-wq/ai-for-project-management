// ============================================================
// AI PPM Platform — TypeScript Type Definitions
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PORTFOLIO_MANAGER'
  | 'PROGRAM_MANAGER'
  | 'PROJECT_MANAGER'
  | 'PMO'
  | 'FINANCE'
  | 'RESOURCE_MANAGER'
  | 'CLIENT_VIEWER';

export type ProjectStatus =
  | 'DRAFT'
  | 'INITIATION'
  | 'PLANNING'
  | 'EXECUTION'
  | 'MONITORING'
  | 'CLOSURE'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type RagStatus = 'RED' | 'AMBER' | 'GREEN';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskProbability = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

export type RiskImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

export type RiskStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED' | 'ESCALATED';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'AT_RISK';

export type BudgetType = 'CAPEX' | 'OPEX';

export type ChangeRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED';

// ─── Core Models ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  organization?: Organization;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  isActive: boolean;
  settings: Record<string, any>;
}

export interface Portfolio {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  ownerId?: string;
  owner?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  strategicObjectives?: string;
  totalBudget: number;
  allocatedBudget: number;
  ragStatus: RagStatus;
  startDate?: string;
  endDate?: string;
  programs?: Program[];
  _count?: { programs: number };
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  organizationId: string;
  portfolioId?: string;
  portfolio?: Pick<Portfolio, 'id' | 'name'>;
  name: string;
  description?: string;
  programManagerId?: string;
  programManager?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  totalBudget: number;
  allocatedBudget: number;
  ragStatus: RagStatus;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  objectives?: string;
  benefits?: string;
  projects?: Project[];
  _count?: { projects: number };
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  programId?: string;
  program?: Pick<Program, 'id' | 'name'>;
  name: string;
  description?: string;
  projectManagerId?: string;
  projectManager?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  status: ProjectStatus;
  ragStatus: RagStatus;
  projectType?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  totalBudget: number;
  actualCost: number;
  forecastCost: number;
  percentComplete: number;
  plannedValue: number;
  earnedValue: number;
  siteCount: number;
  sitesCompleted: number;
  milestones?: Milestone[];
  members?: ProjectMember[];
  _count?: {
    tasks: number;
    risks: number;
    issues: number;
    changeRequests: number;
    documents: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  projectId: string;
  parentTaskId?: string;
  milestoneId?: string;
  milestone?: Pick<Milestone, 'id' | 'name'>;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  reporterId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedHours?: number;
  loggedHours: number;
  percentComplete: number;
  wbsCode?: string;
  tags: string[];
  position: number;
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  description?: string;
  plannedDate: string;
  actualDate?: string;
  status: MilestoneStatus;
  ownerId?: string;
  owner?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  isKeyMilestone: boolean;
  createdAt: string;
}

export interface Risk {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description?: string;
  category?: string;
  probability: RiskProbability;
  impact: RiskImpact;
  riskScore: number;
  status: RiskStatus;
  ownerId?: string;
  owner?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  mitigationPlan?: string;
  contingencyPlan?: string;
  dueDate?: string;
  aiSuggestions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  budgetType: BudgetType;
  category?: string;
  plannedAmount: number;
  actualAmount: number;
  forecastAmount: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}

export interface Resource {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  resourceType: 'INTERNAL' | 'CONTRACTOR' | 'VENDOR';
  roleTitle?: string;
  skills: string[];
  dailyRate?: number;
  currency: string;
  availabilityPercent: number;
  isActive: boolean;
  totalAllocation?: number;
  isOverAllocated?: boolean;
  availableCapacity?: number;
}

export interface ChangeRequest {
  id: string;
  organizationId: string;
  projectId: string;
  crNumber?: string;
  title: string;
  description: string;
  justification?: string;
  impactScope?: string;
  impactSchedule?: string;
  impactBudget: number;
  status: ChangeRequestStatus;
  requestedById?: string;
  requestedBy?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  approvedById?: string;
  approvedBy?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  organizationId: string;
  projectId?: string;
  programId?: string;
  name: string;
  description?: string;
  category: string;
  fileKey: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  tags: string[];
  uploadedById?: string;
  uploadedBy?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  aiSummary?: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>;
  role: UserRole;
  joinedAt: string;
}

// ─── EVM Metrics ─────────────────────────────────────────────

export interface EVMMetrics {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  bac: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
  vac: number;
  sv: number;
  cv: number;
  schedulePerformance: 'ON_TRACK' | 'SLIGHTLY_BEHIND' | 'BEHIND';
  costPerformance: 'UNDER_BUDGET' | 'SLIGHTLY_OVER' | 'OVER_BUDGET';
}

// ─── Auth Types ───────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ─── API Response wrapper ──────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  timestamp: string;
}

// ─── Dashboard Types ──────────────────────────────────────────

export interface ExecutiveDashboard {
  summary: {
    portfolios: number;
    programs: number;
    projects: number;
    totalBudget: number;
    totalActualCost: number;
    budgetUtilization: number;
    avgCompletion: number;
  };
  ragDistribution: {
    green: number;
    amber: number;
    red: number;
  };
  topRisks: Risk[];
}

// ─── Kanban Board ─────────────────────────────────────────────

export type KanbanBoard = Record<TaskStatus, Task[]>;
