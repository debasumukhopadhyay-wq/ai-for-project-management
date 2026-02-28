import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AiCopilotService } from './ai-copilot.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ai-copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiCopilotController {
  constructor(private aiService: AiCopilotService) {}

  @Post('query')
  @ApiOperation({ summary: 'Natural language query across all project data' })
  @ApiBody({ schema: { type: 'object', properties: { query: { type: 'string' } } } })
  naturalLanguageQuery(@Body('query') query: string, @CurrentUser('organizationId') orgId: string) {
    return this.aiService.naturalLanguageQuery(query, orgId).then(response => ({ response }));
  }

  @Post('status-report/:projectId')
  @ApiOperation({ summary: 'Generate AI project status report' })
  generateStatusReport(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.aiService.generateStatusReport(projectId, orgId).then(report => ({ report }));
  }

  @Post('risk-analysis/:projectId')
  @ApiOperation({ summary: 'AI risk analysis and recommendations' })
  analyzeRisks(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.aiService.analyzeRisks(projectId, orgId).then(analysis => ({ analysis }));
  }

  @Post('executive-summary/:programId')
  @ApiOperation({ summary: 'Generate executive program summary' })
  generateExecutiveSummary(@Param('programId') programId: string, @CurrentUser('organizationId') orgId: string) {
    return this.aiService.generateExecutiveSummary(programId, orgId).then(summary => ({ summary }));
  }

  @Post('meeting-minutes')
  @ApiOperation({ summary: 'Summarize and structure meeting notes' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        meetingDate: { type: 'string' },
        rawNotes: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  summarizeMeetingMinutes(@Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.aiService
      .summarizeMeetingMinutes({ ...body, organizationId: orgId })
      .then(minutes => ({ minutes }));
  }

  @Post('stakeholder-email')
  @ApiOperation({ summary: 'Draft a professional stakeholder email' })
  generateStakeholderEmail(@Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.aiService
      .generateStakeholderEmail({ ...body, organizationId: orgId })
      .then(email => ({ email }));
  }

  @Post('cost-anomalies/:projectId')
  @ApiOperation({ summary: 'Detect cost anomalies and financial risks' })
  detectCostAnomalies(@Param('projectId') projectId: string, @CurrentUser('organizationId') orgId: string) {
    return this.aiService.detectCostAnomalies(projectId, orgId);
  }
}
