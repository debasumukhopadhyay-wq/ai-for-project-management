/**
 * Prisma Seed Script — AI PPM Platform
 * Seeds: Organization, Users, Portfolio, Programs, Projects, Tasks, Risks, Budgets
 *
 * Run: npx ts-node prisma/seed.ts
 * Or:  npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ─── Organization ────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-telecom' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Acme Telecom Group',
      slug: 'acme-telecom',
      domain: 'acme-telecom.com',
      isActive: true,
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ─── Users ───────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const userHash = await bcrypt.hash('Password@123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'b0000000-0000-0000-0000-000000000001' },
      update: { passwordHash: adminHash, isActive: true },
      create: {
        id: 'b0000000-0000-0000-0000-000000000001',
        organizationId: org.id,
        email: 'admin@acme-telecom.com',
        passwordHash: adminHash,
        firstName: 'Debasu',
        lastName: 'Mukhopadhyay',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'b0000000-0000-0000-0000-000000000002' },
      update: { passwordHash: userHash, isActive: true },
      create: {
        id: 'b0000000-0000-0000-0000-000000000002',
        organizationId: org.id,
        email: 'pm@acme-telecom.com',
        passwordHash: userHash,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'PROGRAM_MANAGER',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'b0000000-0000-0000-0000-000000000003' },
      update: { passwordHash: userHash, isActive: true },
      create: {
        id: 'b0000000-0000-0000-0000-000000000003',
        organizationId: org.id,
        email: 'pjm@acme-telecom.com',
        passwordHash: userHash,
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'PROJECT_MANAGER',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'b0000000-0000-0000-0000-000000000004' },
      update: { passwordHash: userHash, isActive: true },
      create: {
        id: 'b0000000-0000-0000-0000-000000000004',
        organizationId: org.id,
        email: 'finance@acme-telecom.com',
        passwordHash: userHash,
        firstName: 'Emma',
        lastName: 'Williams',
        role: 'FINANCE',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'b0000000-0000-0000-0000-000000000005' },
      update: { passwordHash: userHash, isActive: true },
      create: {
        id: 'b0000000-0000-0000-0000-000000000005',
        organizationId: org.id,
        email: 'client@acme-telecom.com',
        passwordHash: userHash,
        firstName: 'David',
        lastName: 'Brown',
        role: 'CLIENT_VIEWER',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Users: ${users.length} created`);

  // ─── Portfolio ────────────────────────────────────────────
  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'c0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'c0000000-0000-0000-0000-000000000001',
      organizationId: org.id,
      name: '5G National Expansion 2024-2026',
      description: 'Strategic portfolio for nationwide 5G network rollout covering 50 major cities',
      ownerId: users[0].id,
      strategicObjectives: 'Achieve 95% urban 5G coverage by Q4 2026. Enable new enterprise IoT use cases.',
      totalBudget: 150000000,
      ragStatus: 'GREEN',
    },
  });
  console.log(`✅ Portfolio: ${portfolio.name}`);

  // ─── Programs ─────────────────────────────────────────────
  const program1 = await prisma.program.upsert({
    where: { id: 'd0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'd0000000-0000-0000-0000-000000000001',
      organizationId: org.id,
      portfolioId: portfolio.id,
      name: 'Metro Cities 5G Phase 1',
      description: 'Deploy 5G infrastructure across 10 major metropolitan areas',
      programManagerId: users[1].id,
      totalBudget: 45000000,
      ragStatus: 'GREEN',
      status: 'EXECUTION',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-06-30'),
    },
  });

  const program2 = await prisma.program.upsert({
    where: { id: 'd0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'd0000000-0000-0000-0000-000000000002',
      organizationId: org.id,
      portfolioId: portfolio.id,
      name: 'Fiber Backbone Modernization',
      description: 'Upgrade core fiber backbone network across national infrastructure',
      programManagerId: users[1].id,
      totalBudget: 32000000,
      ragStatus: 'AMBER',
      status: 'PLANNING',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-12-31'),
    },
  });
  console.log(`✅ Programs: 2 created`);

  // ─── Projects ─────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { id: 'e0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'e0000000-0000-0000-0000-000000000001',
      organizationId: org.id,
      programId: program1.id,
      name: 'Lagos 5G Rollout Phase 1',
      description: 'Deploy 250 5G base stations across Lagos metropolitan area',
      projectManagerId: users[2].id,
      status: 'EXECUTION',
      ragStatus: 'GREEN',
      projectType: '5G_ROLLOUT',
      plannedStartDate: new Date('2024-02-01'),
      plannedEndDate: new Date('2024-10-31'),
      actualStartDate: new Date('2024-02-05'),
      totalBudget: 8500000,
      actualCost: 3200000,
      forecastCost: 8700000,
      percentComplete: 42,
      plannedValue: 3400000,
      earnedValue: 3200000,
      siteCount: 250,
      sitesCompleted: 105,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'e0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'e0000000-0000-0000-0000-000000000002',
      organizationId: org.id,
      programId: program1.id,
      name: 'Abuja 5G Rollout Phase 1',
      description: 'Deploy 5G infrastructure across Abuja FCT — 150 base stations',
      projectManagerId: users[2].id,
      status: 'EXECUTION',
      ragStatus: 'AMBER',
      projectType: '5G_ROLLOUT',
      plannedStartDate: new Date('2024-03-01'),
      plannedEndDate: new Date('2024-11-30'),
      actualStartDate: new Date('2024-03-10'),
      totalBudget: 6200000,
      actualCost: 2100000,
      forecastCost: 6800000,
      percentComplete: 35,
      plannedValue: 2170000,
      earnedValue: 1900000,
      siteCount: 150,
      sitesCompleted: 52,
    },
  });
  console.log(`✅ Projects: 2 created`);

  // ─── Milestones ───────────────────────────────────────────
  await prisma.milestone.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        organizationId: org.id,
        projectId: project1.id,
        name: 'Site Survey Complete — District 1-3',
        plannedDate: new Date('2024-03-31'),
        status: 'COMPLETED',
        isKeyMilestone: true,
        actualDate: new Date('2024-03-28'),
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        organizationId: org.id,
        projectId: project1.id,
        name: '100 Sites Live',
        plannedDate: new Date('2024-06-30'),
        status: 'IN_PROGRESS',
        isKeyMilestone: true,
      },
      {
        id: 'f0000000-0000-0000-0000-000000000003',
        organizationId: org.id,
        projectId: project1.id,
        name: '250 Sites Live — Full Deployment',
        plannedDate: new Date('2024-10-31'),
        status: 'NOT_STARTED',
        isKeyMilestone: true,
      },
    ],
  });
  console.log(`✅ Milestones created`);

  // ─── Tasks ────────────────────────────────────────────────
  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'g0000000-0000-0000-0000-000000000001',
        organizationId: org.id,
        projectId: project1.id,
        title: 'Site survey and soil testing — District 1',
        status: 'DONE',
        priority: 'HIGH',
        assigneeId: users[2].id,
        plannedStart: new Date('2024-02-05'),
        plannedEnd: new Date('2024-02-28'),
        estimatedHours: 80,
        loggedHours: 82,
        percentComplete: 100,
        wbsCode: '1.1',
        position: 1,
      },
      {
        id: 'g0000000-0000-0000-0000-000000000002',
        organizationId: org.id,
        projectId: project1.id,
        title: 'Permit acquisition — Lagos State',
        status: 'DONE',
        priority: 'CRITICAL',
        assigneeId: users[2].id,
        plannedStart: new Date('2024-02-10'),
        plannedEnd: new Date('2024-03-15'),
        estimatedHours: 40,
        loggedHours: 45,
        percentComplete: 100,
        wbsCode: '1.2',
        position: 2,
      },
      {
        id: 'g0000000-0000-0000-0000-000000000003',
        organizationId: org.id,
        projectId: project1.id,
        title: 'Tower installation — Batch 1 (50 sites)',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: users[2].id,
        plannedStart: new Date('2024-04-01'),
        plannedEnd: new Date('2024-06-30'),
        estimatedHours: 600,
        loggedHours: 420,
        percentComplete: 70,
        wbsCode: '2.1',
        position: 3,
      },
      {
        id: 'g0000000-0000-0000-0000-000000000004',
        organizationId: org.id,
        projectId: project1.id,
        title: 'Network integration and testing',
        status: 'TODO',
        priority: 'HIGH',
        assigneeId: users[2].id,
        plannedStart: new Date('2024-07-01'),
        plannedEnd: new Date('2024-09-30'),
        estimatedHours: 500,
        percentComplete: 0,
        wbsCode: '3.1',
        position: 5,
      },
    ],
  });
  console.log(`✅ Tasks created`);

  // ─── Risks ────────────────────────────────────────────────
  await prisma.risk.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'h0000000-0000-0000-0000-000000000001',
        organizationId: org.id,
        projectId: project1.id,
        title: 'Permit delays from Lagos State Ministry',
        description: 'Regulatory permits may be delayed due to high application volume',
        category: 'Regulatory',
        probability: 'HIGH',
        impact: 'HIGH',
        riskScore: 16,
        status: 'MITIGATED',
        ownerId: users[2].id,
        mitigationPlan: 'Engaged expediter with Ministry contacts. Pre-submitted all documentation.',
      },
      {
        id: 'h0000000-0000-0000-0000-000000000002',
        organizationId: org.id,
        projectId: project1.id,
        title: 'Equipment supply chain disruption',
        description: 'Global semiconductor shortage may impact radio unit delivery',
        category: 'Supply Chain',
        probability: 'MEDIUM',
        impact: 'HIGH',
        riskScore: 12,
        status: 'OPEN',
        ownerId: users[2].id,
        mitigationPlan: 'Placed advance orders for 150% of required units. Identified backup supplier.',
      },
    ],
  });
  console.log(`✅ Risks created`);

  // ─── Budgets ──────────────────────────────────────────────
  await prisma.budget.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'i0000000-0000-0000-0000-000000000001',
        organizationId: org.id,
        projectId: project1.id,
        name: 'Tower Infrastructure - CAPEX',
        budgetType: 'CAPEX',
        category: 'Infrastructure',
        plannedAmount: 4000000,
        actualAmount: 1650000,
        forecastAmount: 4200000,
      },
      {
        id: 'i0000000-0000-0000-0000-000000000002',
        organizationId: org.id,
        projectId: project1.id,
        name: 'Radio Equipment - CAPEX',
        budgetType: 'CAPEX',
        category: 'Equipment',
        plannedAmount: 3000000,
        actualAmount: 1200000,
        forecastAmount: 3100000,
      },
      {
        id: 'i0000000-0000-0000-0000-000000000003',
        organizationId: org.id,
        projectId: project1.id,
        name: 'Project Management - OPEX',
        budgetType: 'OPEX',
        category: 'People',
        plannedAmount: 800000,
        actualAmount: 260000,
        forecastAmount: 750000,
      },
    ],
  });
  console.log(`✅ Budgets created`);

  // ─── Change Request ────────────────────────────────────────
  await prisma.changeRequest.upsert({
    where: { id: 'k0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'k0000000-0000-0000-0000-000000000001',
      organizationId: org.id,
      projectId: project1.id,
      crNumber: 'CR-2024-001',
      title: 'Add 25 additional sites in District 4',
      description: 'Client requests expansion into District 4 due to new business park development.',
      impactBudget: 850000,
      status: 'UNDER_REVIEW',
      requestedById: users[2].id,
    },
  });
  console.log(`✅ Change Request created`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDefault Login Credentials:');
  console.log('  Admin (Debasu Mukhopadhyay): admin@acme-telecom.com / Admin@123');
  console.log('  PM:      pm@acme-telecom.com / Password@123');
  console.log('  PJM:     pjm@acme-telecom.com / Password@123');
  console.log('  Finance: finance@acme-telecom.com / Password@123');
  console.log('  Client:  client@acme-telecom.com / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
