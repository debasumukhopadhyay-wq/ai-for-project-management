import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { FinancialsModule } from './modules/financials/financials.module';
import { RisksModule } from './modules/risks/risks.module';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AiCopilotModule } from './modules/ai-copilot/ai-copilot.module';

@Module({
  imports: [
    // Config (global)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    PortfoliosModule,
    ProgramsModule,
    ProjectsModule,
    TasksModule,
    MilestonesModule,
    ResourcesModule,
    FinancialsModule,
    RisksModule,
    ChangeRequestsModule,
    DocumentsModule,
    ReportsModule,
    AuditLogsModule,
    AiCopilotModule,
  ],
})
export class AppModule {}
