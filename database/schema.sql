-- ============================================================
-- AI PPM Platform — PostgreSQL Schema
-- Full production schema with multi-tenant support,
-- soft deletes, audit fields, and indexing
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'PORTFOLIO_MANAGER',
  'PROGRAM_MANAGER',
  'PROJECT_MANAGER',
  'PMO',
  'FINANCE',
  'RESOURCE_MANAGER',
  'CLIENT_VIEWER'
);

CREATE TYPE project_status AS ENUM (
  'DRAFT',
  'INITIATION',
  'PLANNING',
  'EXECUTION',
  'MONITORING',
  'CLOSURE',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED'
);

CREATE TYPE rag_status AS ENUM ('RED', 'AMBER', 'GREEN');

CREATE TYPE task_status AS ENUM (
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED'
);

CREATE TYPE task_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

CREATE TYPE risk_probability AS ENUM ('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW');

CREATE TYPE risk_impact AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW');

CREATE TYPE risk_status AS ENUM ('OPEN', 'MITIGATED', 'ACCEPTED', 'CLOSED', 'ESCALATED');

CREATE TYPE issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');

CREATE TYPE change_request_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'IMPLEMENTED'
);

CREATE TYPE budget_type AS ENUM ('CAPEX', 'OPEX');

CREATE TYPE milestone_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'AT_RISK');

CREATE TYPE document_category AS ENUM (
  'SOW',
  'CONTRACT',
  'TECHNICAL_SPEC',
  'PROJECT_PLAN',
  'RISK_REGISTER',
  'STATUS_REPORT',
  'MEETING_MINUTES',
  'INVOICE',
  'OTHER'
);

CREATE TYPE resource_type AS ENUM (
  'INTERNAL',
  'CONTRACTOR',
  'VENDOR'
);

-- ============================================================
-- TABLE: organizations (Multi-tenant root)
-- ============================================================
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  domain        VARCHAR(255),
  logo_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  role            user_role NOT NULL DEFAULT 'PROJECT_MANAGER',
  avatar_url      TEXT,
  phone           VARCHAR(50),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  refresh_token   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email_org ON users(email, organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: portfolios
-- ============================================================
CREATE TABLE portfolios (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  description         TEXT,
  owner_id            UUID REFERENCES users(id),
  strategic_objectives TEXT,
  total_budget        DECIMAL(18,2) DEFAULT 0,
  allocated_budget    DECIMAL(18,2) DEFAULT 0,
  rag_status          rag_status DEFAULT 'GREEN',
  start_date          DATE,
  end_date            DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  metadata            JSONB DEFAULT '{}',
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_portfolios_org ON portfolios(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_portfolios_owner ON portfolios(owner_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: programs
-- ============================================================
CREATE TABLE programs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  portfolio_id        UUID REFERENCES portfolios(id),
  name                VARCHAR(255) NOT NULL,
  description         TEXT,
  program_manager_id  UUID REFERENCES users(id),
  total_budget        DECIMAL(18,2) DEFAULT 0,
  allocated_budget    DECIMAL(18,2) DEFAULT 0,
  rag_status          rag_status DEFAULT 'GREEN',
  start_date          DATE,
  end_date            DATE,
  status              project_status DEFAULT 'PLANNING',
  objectives          TEXT,
  benefits            TEXT,
  metadata            JSONB DEFAULT '{}',
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_programs_org ON programs(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_portfolio ON programs(portfolio_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_programs_manager ON programs(program_manager_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: projects
-- ============================================================
CREATE TABLE projects (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id            UUID REFERENCES programs(id),
  name                  VARCHAR(255) NOT NULL,
  description           TEXT,
  project_manager_id    UUID REFERENCES users(id),
  status                project_status DEFAULT 'INITIATION',
  rag_status            rag_status DEFAULT 'GREEN',
  project_type          VARCHAR(100),  -- e.g., '5G_ROLLOUT', 'FIBER', 'DATA_CENTER'
  -- Dates
  planned_start_date    DATE,
  planned_end_date      DATE,
  actual_start_date     DATE,
  actual_end_date       DATE,
  baseline_end_date     DATE,
  -- Budget
  total_budget          DECIMAL(18,2) DEFAULT 0,
  actual_cost           DECIMAL(18,2) DEFAULT 0,
  forecast_cost         DECIMAL(18,2) DEFAULT 0,
  -- Progress
  percent_complete      INTEGER DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  -- EVM fields
  planned_value         DECIMAL(18,2) DEFAULT 0,
  earned_value          DECIMAL(18,2) DEFAULT 0,
  -- Telecom specific
  site_count            INTEGER DEFAULT 0,
  sites_completed       INTEGER DEFAULT 0,
  -- Meta
  lessons_learned       TEXT,
  closure_notes         TEXT,
  metadata              JSONB DEFAULT '{}',
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_projects_org ON projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_program ON projects(program_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_manager ON projects(project_manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: milestones
-- ============================================================
CREATE TABLE milestones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  planned_date    DATE NOT NULL,
  actual_date     DATE,
  status          milestone_status DEFAULT 'NOT_STARTED',
  owner_id        UUID REFERENCES users(id),
  is_key_milestone BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_milestones_project ON milestones(project_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: tasks
-- ============================================================
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id  UUID REFERENCES tasks(id),  -- For WBS hierarchy
  milestone_id    UUID REFERENCES milestones(id),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  status          task_status DEFAULT 'TODO',
  priority        task_priority DEFAULT 'MEDIUM',
  assignee_id     UUID REFERENCES users(id),
  reporter_id     UUID REFERENCES users(id),
  planned_start   DATE,
  planned_end     DATE,
  actual_start    DATE,
  actual_end      DATE,
  estimated_hours DECIMAL(8,2),
  logged_hours    DECIMAL(8,2) DEFAULT 0,
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  wbs_code        VARCHAR(50),  -- e.g., "1.2.3"
  tags            TEXT[],
  position        INTEGER DEFAULT 0,  -- Kanban ordering
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(project_id, status) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: resources
-- ============================================================
CREATE TABLE resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),  -- NULL for external resources
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  resource_type   resource_type DEFAULT 'INTERNAL',
  role_title      VARCHAR(255),
  skills          TEXT[],
  daily_rate      DECIMAL(10,2),
  currency        VARCHAR(10) DEFAULT 'USD',
  availability_percent INTEGER DEFAULT 100 CHECK (availability_percent BETWEEN 0 AND 100),
  is_active       BOOLEAN DEFAULT true,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_resources_org ON resources(organization_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: resource_assignments
-- ============================================================
CREATE TABLE resource_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_id     UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  allocation_percent INTEGER DEFAULT 100 CHECK (allocation_percent BETWEEN 0 AND 100),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  planned_hours   DECIMAL(8,2),
  actual_hours    DECIMAL(8,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_resource ON resource_assignments(resource_id);
CREATE INDEX idx_assignments_project ON resource_assignments(project_id);

-- ============================================================
-- TABLE: budgets (CAPEX/OPEX budget lines)
-- ============================================================
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  budget_type     budget_type NOT NULL DEFAULT 'OPEX',
  category        VARCHAR(100),
  planned_amount  DECIMAL(18,2) NOT NULL DEFAULT 0,
  actual_amount   DECIMAL(18,2) DEFAULT 0,
  forecast_amount DECIMAL(18,2) DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'USD',
  period_start    DATE,
  period_end      DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_budgets_project ON budgets(project_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: risks
-- ============================================================
CREATE TABLE risks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  probability     risk_probability NOT NULL DEFAULT 'MEDIUM',
  impact          risk_impact NOT NULL DEFAULT 'MEDIUM',
  risk_score      INTEGER GENERATED ALWAYS AS (
    CASE probability
      WHEN 'VERY_HIGH' THEN 5 WHEN 'HIGH' THEN 4 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 2 ELSE 1
    END *
    CASE impact
      WHEN 'CRITICAL' THEN 5 WHEN 'HIGH' THEN 4 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 2 ELSE 1
    END
  ) STORED,
  status          risk_status DEFAULT 'OPEN',
  owner_id        UUID REFERENCES users(id),
  mitigation_plan TEXT,
  contingency_plan TEXT,
  due_date        DATE,
  ai_suggestions  JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_risks_project ON risks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_risks_status ON risks(project_id, status) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: issues
-- ============================================================
CREATE TABLE issues (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  risk_id         UUID REFERENCES risks(id),  -- Issue that materialized from a risk
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  impact          risk_impact DEFAULT 'MEDIUM',
  status          issue_status DEFAULT 'OPEN',
  owner_id        UUID REFERENCES users(id),
  resolution      TEXT,
  due_date        DATE,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_issues_project ON issues(project_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: change_requests
-- ============================================================
CREATE TABLE change_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cr_number       VARCHAR(50),  -- Auto-generated CR-001
  title           VARCHAR(500) NOT NULL,
  description     TEXT NOT NULL,
  justification   TEXT,
  impact_scope    TEXT,
  impact_schedule TEXT,
  impact_budget   DECIMAL(18,2) DEFAULT 0,
  status          change_request_status DEFAULT 'DRAFT',
  requested_by    UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_cr_project ON change_requests(project_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: documents
-- ============================================================
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id),
  program_id      UUID REFERENCES programs(id),
  name            VARCHAR(500) NOT NULL,
  description     TEXT,
  category        document_category DEFAULT 'OTHER',
  file_key        TEXT NOT NULL,  -- MinIO object key
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       VARCHAR(255),
  version         INTEGER DEFAULT 1,
  parent_id       UUID REFERENCES documents(id),  -- Previous version
  tags            TEXT[],
  uploaded_by     UUID REFERENCES users(id),
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_documents_project ON documents(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_program ON documents(program_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_org ON documents(organization_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,  -- e.g., 'CREATE', 'UPDATE', 'DELETE'
  entity_type     VARCHAR(100) NOT NULL,  -- e.g., 'project', 'risk'
  entity_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- TABLE: project_dependencies
-- ============================================================
CREATE TABLE project_dependencies (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  dependency_type   VARCHAR(50) DEFAULT 'FINISH_TO_START',
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: task_dependencies
-- ============================================================
CREATE TABLE task_dependencies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_task_id  UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_task_id  UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'FINISH_TO_START'
);

-- ============================================================
-- TABLE: project_members (team members on a project)
-- ============================================================
CREATE TABLE project_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- ============================================================
-- FUNCTION: Update updated_at timestamp automatically
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'users', 'portfolios', 'programs', 'projects',
    'milestones', 'tasks', 'resources', 'resource_assignments',
    'budgets', 'risks', 'issues', 'change_requests', 'documents'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t
    );
  END LOOP;
END;
$$;
