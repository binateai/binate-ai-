import Anthropic from '@anthropic-ai/sdk';
import { Email, Lead, InsertLead } from '@shared/schema';
import { storage } from '../storage';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface LeadData {
  name: string;
  email: string;
  company?: string;
  value?: number;
  notes?: string;
  tags?: string[];
}

/**
 * Analyzes an email to detect if it contains a potential lead
 * @param email The email to analyze
 * @returns A boolean indicating if the email contains a lead
 */
export async function analyzeEmailForLead(email: Email): Promise<LeadData | null> {
  try {
    const prompt = `
You are an AI assistant helping to identify potential leads from emails. 
Analyze the email content below and identify if it contains a potential business lead.

Email Subject: ${email.subject}
From: ${email.from}
To: ${email.to}
Email Content: ${email.body}

A lead is someone who has expressed interest in our services or products, asked for more information, or requested a quote/proposal.
If this email is from a potential client or customer showing interest, extract the following information:
- Name of the person contacting us
- Email address
- Company name (if mentioned)
- Estimated potential value (if possible to determine)
- Any relevant notes about their needs
- Appropriate tags (e.g., "web-design", "consulting", "urgent", "follow-up-needed")

Return the data in JSON format with these fields. If this is not a lead, return null.
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      system: "You're a helpful assistant specialized in identifying business leads. Return ONLY valid JSON without any explanations or markdown formatting. If something isn't a lead, return null.",
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const content = response.content[0].text;
    
    try {
      // Parse the response as JSON
      const jsonResponse = JSON.parse(content);
      
      // Return null if the AI determined this is not a lead
      if (jsonResponse === null) {
        return null;
      }
      
      // Validate the required fields are present
      if (!jsonResponse.name || !jsonResponse.email) {
        console.log('AI response missing required lead fields:', jsonResponse);
        return null;
      }
      
      return {
        name: jsonResponse.name,
        email: jsonResponse.email,
        company: jsonResponse.company || '',
        value: jsonResponse.value ? parseInt(jsonResponse.value, 10) : undefined,
        notes: jsonResponse.notes || '',
        tags: Array.isArray(jsonResponse.tags) ? jsonResponse.tags : []
      };
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return null;
    }
  } catch (error) {
    console.error('Error analyzing email for lead:', error);
    return null;
  }
}

/**
 * Creates a new lead from a detected lead in an email
 * @param userId The user ID who owns the lead
 * @param leadData The lead data extracted from the email
 * @param sourceEmail The source email containing the lead
 * @returns The created lead
 */
export async function createLeadFromEmail(
  userId: number,
  leadData: LeadData,
  sourceEmail: Email
): Promise<Lead> {
  // Create the lead
  const lead: InsertLead = {
    userId,
    name: leadData.name,
    email: leadData.email,
    company: leadData.company || '',
    source: 'email',
    sourceId: sourceEmail.messageId,
    status: 'new',
    priority: 'medium',
    lastContactDate: new Date(sourceEmail.date),
    notes: leadData.notes || '',
    tags: leadData.tags || [],
    value: leadData.value
  };

  return await storage.createLead(lead);
}

/**
 * Processes an email to detect and create leads
 * This is the main function to call when processing a new email
 * @param email The email to process
 * @returns The created lead if one was detected, null otherwise
 */
export async function processEmailForLeads(email: Email): Promise<Lead | null> {
  // Skip emails that are sent by the user (outgoing emails)
  if (email.from.toLowerCase().includes('@binate.ai')) {
    return null;
  }
  
  // Check if we've already processed this email for leads
  const existingLeads = await storage.getLeadsByUserId(email.userId);
  const alreadyProcessed = existingLeads.some(lead => 
    lead.source === 'email' && lead.sourceId === email.messageId
  );
  
  if (alreadyProcessed) {
    return null;
  }
  
  // Analyze the email for potential leads
  const leadData = await analyzeEmailForLead(email);
  if (!leadData) {
    return null;
  }
  
  // Create the lead
  const lead = await createLeadFromEmail(email.userId, leadData, email);
  
  console.log(`Created new lead from email: ${lead.name} (${lead.email})`);
  return lead;
}