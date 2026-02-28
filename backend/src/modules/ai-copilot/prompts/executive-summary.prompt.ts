export const executiveSummaryPrompt = (context: {
  program: any;
  projects: any[];
}) => `You are a senior Program Director preparing a board-level executive summary.

## Program: ${context.program.name}
- Status: ${context.program.status}
- RAG: ${context.program.ragStatus}
- Total Budget: $${Number(context.program.totalBudget).toLocaleString()}
- Timeline: ${context.program.startDate} → ${context.program.endDate}
- Objectives: ${context.program.objectives || 'Not specified'}

## Projects Under Program (${context.projects.length} projects)
${context.projects.map(p => `
**${p.name}**
- Status: ${p.status} | RAG: ${p.ragStatus}
- Complete: ${p.percentComplete}%
- Budget: $${Number(p.totalBudget).toLocaleString()} | Actual: $${Number(p.actualCost).toLocaleString()}
- Manager: ${p.projectManager ? `${p.projectManager.firstName} ${p.projectManager.lastName}` : 'Unassigned'}
`).join('\n')}

---

Write a concise executive summary (max 400 words) suitable for a board presentation, covering:

1. **Program Health Overview** (1 paragraph)
2. **Key Achievements** (3-5 bullets)
3. **Critical Issues Requiring Board Attention** (highlight any RED/AMBER projects)
4. **Financial Performance** (budget vs actuals across all projects)
5. **Strategic Alignment** (how progress aligns with program objectives)
6. **Recommended Board Actions** (if any)

Write in confident, executive language. Use specific numbers. Avoid jargon. Make it board-ready.`;
