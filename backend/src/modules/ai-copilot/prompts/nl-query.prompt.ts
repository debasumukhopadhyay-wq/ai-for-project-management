export const nlQueryPrompt = (context: {
  query: string;
  organizationData: {
    portfolios?: any[];
    programs?: any[];
    projects?: any[];
    risks?: any[];
  };
}) => `You are an AI assistant for an enterprise Project Management platform. Answer the user's question based on the provided organizational data.

## User Question
"${context.query}"

## Available Data

### Portfolios (${context.organizationData.portfolios?.length || 0})
${JSON.stringify(context.organizationData.portfolios?.map(p => ({
  name: p.name,
  ragStatus: p.ragStatus,
  programCount: p.programs?.length,
})) || [], null, 2)}

### Programs (${context.organizationData.programs?.length || 0})
${JSON.stringify(context.organizationData.programs?.map(p => ({
  name: p.name,
  status: p.status,
  ragStatus: p.ragStatus,
  projectCount: p.projects?.length,
})) || [], null, 2)}

### Projects (${context.organizationData.projects?.length || 0})
${JSON.stringify(context.organizationData.projects?.map(p => ({
  name: p.name,
  status: p.status,
  ragStatus: p.ragStatus,
  percentComplete: p.percentComplete,
  totalBudget: p.totalBudget,
  actualCost: p.actualCost,
})) || [], null, 2)}

### Open Risks (${context.organizationData.risks?.length || 0})
${JSON.stringify(context.organizationData.risks?.slice(0, 20).map(r => ({
  project: r.project?.name,
  title: r.title,
  score: r.riskScore,
  status: r.status,
})) || [], null, 2)}

---

Provide a clear, concise answer to the user's question based on this data.
- Be specific and reference actual project/program names and numbers from the data
- If the data doesn't contain enough information to answer, say so clearly
- Suggest what additional information would help
- Format the response clearly with headers if the answer is complex

Response:`;
