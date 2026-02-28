import { Injectable, Logger, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ContextBuilderService } from './context-builder.service';
import { statusReportPrompt } from './prompts/status-report.prompt';
import { riskAnalysisPrompt } from './prompts/risk-analysis.prompt';
import { executiveSummaryPrompt } from './prompts/executive-summary.prompt';
import { meetingMinutesPrompt } from './prompts/meeting-minutes.prompt';
import { nlQueryPrompt } from './prompts/nl-query.prompt';

const PLACEHOLDER_KEY = 'sk-ant-your-api-key-here';

@Injectable()
export class AiCopilotService {
  private readonly logger = new Logger(AiCopilotService.name);
  private anthropic: Anthropic;
  private model: string;
  private maxTokens: number;
  private apiKey: string;

  constructor(
    private configService: ConfigService,
    private contextBuilder: ContextBuilderService,
  ) {
    this.apiKey = this.configService.get<string>('anthropic.apiKey') || '';
    this.anthropic = new Anthropic({ apiKey: this.apiKey });
    this.model = this.configService.get<string>('anthropic.model', 'claude-sonnet-4-6');
    this.maxTokens = this.configService.get<number>('anthropic.maxTokens', 4096);
  }

  private checkApiKey() {
    if (!this.apiKey || this.apiKey === PLACEHOLDER_KEY) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY is not configured. Please add your API key to the .env file and restart the server.',
      );
    }
  }

  async generateStatusReport(projectId: string, organizationId: string): Promise<string> {
    this.checkApiKey();
    this.logger.log(`Generating status report for project: ${projectId}`);
    const context = await this.contextBuilder.buildProjectContext(projectId, organizationId);
    const prompt = statusReportPrompt(context);
    return this.callClaude(prompt, 'You are an expert Project Manager writing a professional status report.');
  }

  async analyzeRisks(projectId: string, organizationId: string): Promise<string> {
    this.checkApiKey();
    this.logger.log(`Analyzing risks for project: ${projectId}`);
    const context = await this.contextBuilder.buildProjectContext(projectId, organizationId);
    const prompt = riskAnalysisPrompt({
      project: context.project,
      risks: context.risks,
      projectType: context.project?.projectType,
    });
    return this.callClaude(prompt, 'You are an expert Risk Manager for IT and Telecom projects.');
  }

  async generateExecutiveSummary(programId: string, organizationId: string): Promise<string> {
    this.checkApiKey();
    this.logger.log(`Generating executive summary for program: ${programId}`);
    const context = await this.contextBuilder.buildProgramContext(programId, organizationId);
    const prompt = executiveSummaryPrompt(context);
    return this.callClaude(prompt, 'You are a senior Program Director writing for a board audience.');
  }

  async summarizeMeetingMinutes(data: {
    projectName: string;
    meetingDate: string;
    rawNotes: string;
    attendees?: string[];
    organizationId: string;
  }): Promise<string> {
    this.checkApiKey();
    this.logger.log(`Summarizing meeting minutes for: ${data.projectName}`);
    const prompt = meetingMinutesPrompt(data);
    return this.callClaude(prompt, 'You are a professional PMO analyst structuring meeting minutes.');
  }

  async naturalLanguageQuery(query: string, organizationId: string): Promise<string> {
    this.checkApiKey();
    this.logger.log(`Processing NL query: ${query.substring(0, 100)}`);
    const orgData = await this.contextBuilder.buildOrganizationContext(organizationId);
    const prompt = nlQueryPrompt({ query, organizationData: orgData });
    return this.callClaude(
      prompt,
      'You are an AI assistant for an enterprise Project Management platform. Answer questions based on actual project data.',
    );
  }

  async generateStakeholderEmail(context: {
    projectName: string;
    emailPurpose: string;
    keyPoints: string[];
    recipientRole: string;
    organizationId: string;
  }): Promise<string> {
    this.checkApiKey();
    const prompt = `Write a professional stakeholder email for the following context:

Project: ${context.projectName}
Purpose: ${context.emailPurpose}
Recipient: ${context.recipientRole}
Key Points to Cover:
${context.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Write a concise, professional email with:
- Clear subject line
- Professional greeting
- Well-structured body addressing each key point
- Clear call to action if needed
- Professional closing

Keep it under 300 words unless the complexity requires more.`;

    return this.callClaude(prompt, 'You are an expert Project Manager writing professional stakeholder communications.');
  }

  async detectCostAnomalies(projectId: string, organizationId: string): Promise<any> {
    this.checkApiKey();
    const context = await this.contextBuilder.buildProjectContext(projectId, organizationId);
    const budget = context.budgets.summary;
    const project = context.project;

    const prompt = `Analyze the following project financial data for cost anomalies:

Project: ${project?.name}
Planned Budget: $${budget.totalPlanned.toLocaleString()}
Actual Cost: $${budget.totalActual.toLocaleString()}
Forecast Cost: $${budget.totalForecast.toLocaleString()}
% Complete: ${project?.percentComplete}%

Budget Items:
${context.budgets.items.map(b => `- ${b.name} (${b.budgetType}): Planned $${Number(b.plannedAmount).toLocaleString()}, Actual $${Number(b.actualAmount).toLocaleString()}`).join('\n')}

Identify:
1. Any significant cost variances (>10%)
2. Budget lines burning faster than expected
3. Cost performance trend
4. Specific recommendations to bring costs under control
5. EAC risk assessment

Respond in JSON format: { anomalies: [], trend: "", recommendations: [], riskLevel: "LOW|MEDIUM|HIGH|CRITICAL" }`;

    const response = await this.callClaude(prompt, 'You are a financial analyst for IT projects.');

    try {
      return JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
    } catch {
      return { rawAnalysis: response };
    }
  }

  private async callClaude(userPrompt: string, systemPrompt: string): Promise<string> {
    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textContent = message.content.find(c => c.type === 'text');
      return textContent ? textContent.text : 'Unable to generate response';
    } catch (err: any) {
      this.logger.error(`Anthropic API error: ${err?.status} ${err?.message}`);

      if (err?.status === 401) {
        throw new ServiceUnavailableException(
          'Invalid ANTHROPIC_API_KEY. Please set a valid key in the .env file and restart the server.',
        );
      }
      if (err?.status === 429) {
        throw new ServiceUnavailableException('Anthropic API rate limit reached. Please try again in a moment.');
      }
      if (err?.status === 529 || err?.status === 503) {
        throw new ServiceUnavailableException('Anthropic API is temporarily overloaded. Please try again shortly.');
      }

      throw new ServiceUnavailableException(`AI service error: ${err?.message || 'Unknown error'}`);
    }
  }
}
