export const meetingMinutesPrompt = (context: {
  projectName: string;
  meetingDate: string;
  rawNotes: string;
  attendees?: string[];
}) => `You are a professional PMO analyst. Structure the following meeting notes into formal, actionable minutes.

## Meeting Details
- **Project:** ${context.projectName}
- **Date:** ${context.meetingDate}
- **Attendees:** ${context.attendees?.join(', ') || 'See notes'}

## Raw Meeting Notes
${context.rawNotes}

---

Structure the minutes as follows:

# Meeting Minutes — ${context.projectName}
**Date:** ${context.meetingDate}
**Attendees:** [Extract or use provided]

## 1. Agenda Items Discussed
[List items with brief summary of discussion]

## 2. Decisions Made
[List all decisions with owner if mentioned]

## 3. Action Items
| # | Action | Owner | Due Date | Priority |
|---|--------|-------|----------|----------|
[Extract all action items]

## 4. Risks / Issues Raised
[List any risks or issues mentioned]

## 5. Key Updates / Announcements
[Any status updates, announcements, or information shared]

## 6. Next Meeting
[Date/time if mentioned]

Be thorough. Extract ALL action items. Assign ownership where clear from context. Mark priority (HIGH/MEDIUM/LOW) based on urgency conveyed.`;
