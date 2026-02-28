-- ============================================================
-- AI PPM Platform — Seed Data
-- Creates sample organization, users, portfolios, programs,
-- and projects for development/demo purposes
-- ============================================================

-- Organization
INSERT INTO organizations (id, name, slug, domain, is_active) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Acme Telecom Group',
  'acme-telecom',
  'acme-telecom.com',
  true
);

-- Users (password_hash = bcrypt of 'Admin@123' / 'Password@123')
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'admin@acme-telecom.com',
  '$2b$10$.YpngGBnjXpInIEWFPF94e0DUWAp.40D9dK4O7dR3rG/39VlK/7La', -- Admin@123
  'Debasu',
  'Mukhopadhyay',
  'SUPER_ADMIN'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'pm@acme-telecom.com',
  '$2b$10$FEznckC3.icJhxzVJ30fdus.Hx46sDEskH8MiARggaHBZppKOlZnu', -- Password@123
  'Sarah',
  'Johnson',
  'PROGRAM_MANAGER'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'pjm@acme-telecom.com',
  '$2b$10$FEznckC3.icJhxzVJ30fdus.Hx46sDEskH8MiARggaHBZppKOlZnu',
  'Michael',
  'Chen',
  'PROJECT_MANAGER'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'finance@acme-telecom.com',
  '$2b$10$FEznckC3.icJhxzVJ30fdus.Hx46sDEskH8MiARggaHBZppKOlZnu',
  'Emma',
  'Williams',
  'FINANCE'
),
(
  'b0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'client@acme-telecom.com',
  '$2b$10$FEznckC3.icJhxzVJ30fdus.Hx46sDEskH8MiARggaHBZppKOlZnu',
  'David',
  'Brown',
  'CLIENT_VIEWER'
),
(
  'b0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001',
  'pmo@acme-telecom.com',
  '$2b$10$FEznckC3.icJhxzVJ30fdus.Hx46sDEskH8MiARggaHBZppKOlZnu',
  'Lisa',
  'Thompson',
  'PMO'
);

-- Portfolio
INSERT INTO portfolios (id, organization_id, name, description, owner_id, strategic_objectives, total_budget, rag_status) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '5G National Expansion 2024-2026',
  'Strategic portfolio for nationwide 5G network rollout covering 50 major cities',
  'b0000000-0000-0000-0000-000000000001',
  'Achieve 95% urban 5G coverage by Q4 2026. Improve network capacity by 300%. Enable new enterprise IoT use cases.',
  150000000.00,
  'GREEN'
);

-- Programs
INSERT INTO programs (id, organization_id, portfolio_id, name, description, program_manager_id, total_budget, rag_status, status, start_date, end_date) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Metro Cities 5G Phase 1',
  'Deploy 5G infrastructure across 10 major metropolitan areas — Phase 1',
  'b0000000-0000-0000-0000-000000000002',
  45000000.00,
  'GREEN',
  'EXECUTION',
  '2024-01-15',
  '2025-06-30'
),
(
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Fiber Backbone Modernization',
  'Upgrade core fiber backbone network across national infrastructure',
  'b0000000-0000-0000-0000-000000000002',
  32000000.00,
  'AMBER',
  'PLANNING',
  '2024-06-01',
  '2025-12-31'
);

-- Projects
INSERT INTO projects (
  id, organization_id, program_id, name, description,
  project_manager_id, status, rag_status, project_type,
  planned_start_date, planned_end_date, actual_start_date,
  total_budget, actual_cost, forecast_cost,
  percent_complete, planned_value, earned_value,
  site_count, sites_completed
) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Lagos 5G Rollout Phase 1',
  'Deploy 250 5G base stations across Lagos metropolitan area — Phase 1 covering 5 districts',
  'b0000000-0000-0000-0000-000000000003',
  'EXECUTION',
  'GREEN',
  '5G_ROLLOUT',
  '2024-02-01',
  '2024-10-31',
  '2024-02-05',
  8500000.00,
  3200000.00,
  8700000.00,
  42,
  3400000.00,
  3200000.00,
  250,
  105
),
(
  'e0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Abuja 5G Rollout Phase 1',
  'Deploy 5G infrastructure across Abuja FCT — 150 base stations',
  'b0000000-0000-0000-0000-000000000003',
  'EXECUTION',
  'AMBER',
  '5G_ROLLOUT',
  '2024-03-01',
  '2024-11-30',
  '2024-03-10',
  6200000.00,
  2100000.00,
  6800000.00,
  35,
  2170000.00,
  1900000.00,
  150,
  52
),
(
  'e0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'Core Fiber Upgrade — North Zone',
  'Replace aging fiber infrastructure across northern network zones',
  'b0000000-0000-0000-0000-000000000003',
  'PLANNING',
  'GREEN',
  'FIBER',
  '2024-07-01',
  '2025-03-31',
  NULL,
  4500000.00,
  0.00,
  4500000.00,
  5,
  225000.00,
  0.00,
  0,
  0
);

-- Milestones for Lagos project
INSERT INTO milestones (id, organization_id, project_id, name, planned_date, status, is_key_milestone) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Site Survey Complete — District 1-3', '2024-03-31', 'COMPLETED', true),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Equipment Delivery — Batch 1', '2024-04-15', 'COMPLETED', false),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '100 Sites Live', '2024-06-30', 'IN_PROGRESS', true),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '250 Sites Live — Full Deployment', '2024-10-31', 'NOT_STARTED', true);

-- Tasks for Lagos project
INSERT INTO tasks (id, organization_id, project_id, title, status, priority, assignee_id, planned_start, planned_end, estimated_hours, percent_complete, wbs_code, position) VALUES
('g0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Site survey and soil testing — District 1', 'DONE', 'HIGH', 'b0000000-0000-0000-0000-000000000003', '2024-02-05', '2024-02-28', 80, 100, '1.1', 1),
('g0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Permit acquisition — Lagos State', 'DONE', 'CRITICAL', 'b0000000-0000-0000-0000-000000000003', '2024-02-10', '2024-03-15', 40, 100, '1.2', 2),
('g0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Tower installation — Batch 1 (50 sites)', 'IN_PROGRESS', 'HIGH', 'b0000000-0000-0000-0000-000000000003', '2024-04-01', '2024-06-30', 600, 70, '2.1', 3),
('g0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Radio equipment installation — District 1', 'IN_PROGRESS', 'HIGH', 'b0000000-0000-0000-0000-000000000003', '2024-05-01', '2024-07-15', 400, 45, '2.2', 4),
('g0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Network integration and testing', 'TODO', 'HIGH', 'b0000000-0000-0000-0000-000000000003', '2024-07-01', '2024-09-30', 500, 0, '3.1', 5),
('g0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'UAT and go-live preparation', 'TODO', 'MEDIUM', 'b0000000-0000-0000-0000-000000000003', '2024-09-15', '2024-10-31', 200, 0, '4.1', 6);

-- Risks for Lagos project
INSERT INTO risks (id, organization_id, project_id, title, description, category, probability, impact, status, owner_id, mitigation_plan) VALUES
(
  'h0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Permit delays from Lagos State Ministry',
  'Regulatory permits from Lagos State Ministry of Works may be delayed due to high volume of applications',
  'Regulatory',
  'HIGH',
  'HIGH',
  'MITIGATED',
  'b0000000-0000-0000-0000-000000000003',
  'Engaged expediter with Ministry contacts. Pre-submitted all documentation 6 weeks early.'
),
(
  'h0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'Equipment supply chain disruption',
  'Global semiconductor shortage may impact delivery of radio units from Huawei and Nokia',
  'Supply Chain',
  'MEDIUM',
  'HIGH',
  'OPEN',
  'b0000000-0000-0000-0000-000000000003',
  'Placed advance orders for 150% of required units. Identified alternative supplier (ZTE) as backup.'
),
(
  'h0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'Community opposition to tower installation',
  'Local communities in Districts 3-5 have raised concerns about electromagnetic radiation',
  'Stakeholder',
  'MEDIUM',
  'MEDIUM',
  'OPEN',
  'b0000000-0000-0000-0000-000000000003',
  'Community engagement meetings scheduled. Preparing health impact assessment report.'
);

-- Budgets for Lagos project
INSERT INTO budgets (id, organization_id, project_id, name, budget_type, category, planned_amount, actual_amount, forecast_amount) VALUES
('i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Tower Infrastructure - CAPEX', 'CAPEX', 'Infrastructure', 4000000, 1650000, 4200000),
('i0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Radio Equipment - CAPEX', 'CAPEX', 'Equipment', 3000000, 1200000, 3100000),
('i0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Project Management - OPEX', 'OPEX', 'People', 800000, 260000, 750000),
('i0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Permits and Regulatory - OPEX', 'OPEX', 'Regulatory', 400000, 90000, 350000),
('i0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Contingency Reserve', 'OPEX', 'Contingency', 300000, 0, 300000);

-- Resources
INSERT INTO resources (id, organization_id, name, email, resource_type, role_title, skills, daily_rate, availability_percent) VALUES
('j0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ahmed Yusuf', 'ahmed@vendor-network.com', 'CONTRACTOR', 'RF Engineer', ARRAY['5G NR', 'RF Planning', 'Drive Testing'], 500, 100),
('j0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Chisom Okonkwo', 'chisom@acme-telecom.com', 'INTERNAL', 'Civil Engineer', ARRAY['Site Survey', 'Structural Assessment', 'AutoCAD'], 400, 80),
('j0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'TowerCo Ltd', 'projects@towerco.ng', 'VENDOR', 'Tower Contractor', ARRAY['Tower Erection', 'Civil Works'], 1200, 100);

-- Change Request
INSERT INTO change_requests (id, organization_id, project_id, cr_number, title, description, impact_budget, status, requested_by) VALUES
(
  'k0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'CR-2024-001',
  'Add 25 additional sites in District 4',
  'Client has requested expansion of coverage into District 4 due to new business park development. Requires 25 additional 5G base stations.',
  850000.00,
  'UNDER_REVIEW',
  'b0000000-0000-0000-0000-000000000003'
);
