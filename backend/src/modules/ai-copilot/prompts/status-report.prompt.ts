export const statusReportPrompt = (context: {
  project: any;
  tasks: any[];
  risks: any[];
  milestones: any[];
  budgets: any;
}) => `You are an expert Project Manager generating a professional weekly status report.

## Project Context
- **Project Name:** ${context.project.name}
- **Status:** ${context.project.status}
- **RAG Status:** ${context.project.ragStatus}
- **% Complete:** ${context.project.percentComplete}%
- **Planned End Date:** ${context.project.plannedEndDate}
- **Total Budget:** $${Number(context.project.totalBudget).toLocaleString()}
- **Actual Cost to Date:** $${Number(context.project.actualCost).toLocaleString()}
- **Forecast Cost:** $${Number(context.project.forecastCost).toLocaleString()}

## Task Summary
- Total Tasks: ${context.tasks.length}
- Completed: ${context.tasks.filter(t => t.status === 'DONE').length}
- In Progress: ${context.tasks.filter(t => t.status === 'IN_PROGRESS').length}
- Blocked: ${context.tasks.filter(t => t.status === 'BLOCKED').length}
- Overdue: ${context.tasks.filter(t => t.plannedEnd && new Date(t.plannedEnd) < new Date() && t.status !== 'DONE').length}

## Milestones
${context.milestones.map(m => `- ${m.name}: ${m.status} (Due: ${m.plannedDate})`).join('\n')}

## Active Risks (Top 5)
${context.risks.slice(0, 5).map(r => `- [Score: ${r.riskScore}] ${r.title} - ${r.status}`).join('\n')}

## Budget Performance
- Planned: $${context.budgets?.summary?.totalPlanned?.toLocaleString() || 0}
- Actual: $${context.budgets?.summary?.totalActual?.toLocaleString() || 0}
- Variance: ${context.budgets?.summary?.totalPlanned && context.budgets?.summary?.totalActual
  ? ((1 - context.budgets.summary.totalActual / context.budgets.summary.totalPlanned) * 100).toFixed(1) + '%'
  : 'N/A'}

---

Generate a concise, professional project status report with these sections:
1. **Executive Summary** (2-3 sentences)
2. **Achievements This Period** (bullet points)
3. **Key Issues & Risks** (bullet points with mitigation)
4. **Planned Activities Next Period** (bullet points)
5. **Budget Status** (brief narrative)
6. **Overall RAG Justification** (1-2 sentences explaining the RAG status)

Use professional project management language. Be specific and data-driven.`;
