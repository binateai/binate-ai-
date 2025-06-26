import Anthropic from '@anthropic-ai/sdk';
import { AIMessage } from '@shared/schema';
import { z } from 'zod';

// Available expense categories (hardcoded to avoid circular dependencies)
export const EXPENSE_CATEGORIES = [
  "Advertising",
  "Auto",
  "Business Meals",
  "Education",
  "Entertainment",
  "Equipment",
  "Home Office",
  "Insurance",
  "Legal",
  "Maintenance",
  "Office Supplies",
  "Professional Fees",
  "Rent",
  "Software",
  "Subscriptions",
  "Travel",
  "Utilities",
  "Other"
];

// Check for required environment variable
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Missing ANTHROPIC_API_KEY environment variable. AI functionality will be limited.');
} else {
  // Debug: Log the first few characters of the key to verify it's loaded (don't log full key for security)
  const keyPrefix = process.env.ANTHROPIC_API_KEY.substring(0, 8);
  console.log(`ANTHROPIC_API_KEY is present, starts with: ${keyPrefix}...`);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = 'claude-3-7-sonnet-20250219';

// Schema for time estimation response
export const timeEstimationResponseSchema = z.object({
  estimatedTime: z.number().min(5).max(480),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

/**
 * Estimate the time required to complete a task based on its description
 */
export async function estimateTaskTime(taskDetails: { title: string; description?: string }): Promise<z.infer<typeof timeEstimationResponseSchema>> {
  const defaultResponse = {
    estimatedTime: 30,
    confidence: 0.7,
    reasoning: "Default estimation for tasks with minimal context."
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY is not set, using default time estimation");
    return defaultResponse;
  }

  try {
    const prompt = `
      You are an AI assistant specializing in estimating how long tasks will take to complete.
      
      TASK INFORMATION:
      Title: ${taskDetails.title}
      ${taskDetails.description ? `Description: ${taskDetails.description}` : 'No detailed description provided.'}
      
      Please analyze this task and estimate:
      1. How many minutes it will likely take to complete (between 5 and 480 minutes)
      2. Your confidence level in this estimate (between 0 and 1)
      3. Brief reasoning for your estimation
      
      Consider factors like:
      - Task complexity and scope
      - Whether it requires research, creation, or review
      - If communication or coordination with others is needed
      - Similar tasks typically encountered in professional settings
      
      Respond in JSON format with the following structure:
      {
        "estimatedTime": number, // in minutes (integer between 5 and 480)
        "confidence": number, // between 0 and 1
        "reasoning": "explanation for your estimate"
      }
    `;

    console.log(`Estimating time for task: "${taskDetails.title}"`);
    
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: "You are an expert task time estimation AI. Respond only with valid JSON.",
      messages: [{ role: 'user', content: prompt }],
    });
    
    if (message.content && message.content.length > 0 && 'text' in message.content[0]) {
      const responseText = message.content[0].text.trim();
      
      try {
        // Use our helper function to extract JSON
        const parsedResponse = extractJsonFromResponse(responseText);
        const validatedResponse = timeEstimationResponseSchema.parse(parsedResponse);
        
        return {
          estimatedTime: Math.round(validatedResponse.estimatedTime), // Ensure integer
          confidence: validatedResponse.confidence,
          reasoning: validatedResponse.reasoning
        };
      } catch (parseError) {
        console.error("Error parsing time estimation JSON:", parseError);
        return defaultResponse;
      }
    }
    
    console.warn("No valid content in Claude response for time estimation");
    return defaultResponse;
  } catch (error) {
    console.error("Error estimating task time:", error);
    return defaultResponse;
  }
}

/**
 * Helper function to extract JSON from a Claude response that might be wrapped in a code block
 */
export function extractJsonFromResponse(response: string): any {
  try {
    // First, try to extract JSON from code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    
    // If no code block, try to find a JSON object or array in the response
    const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // If no JSON-like structure found, try parsing the whole response
    return JSON.parse(response.trim());
  } catch (error) {
    console.error("Error extracting JSON from Claude response:", error);
    throw new Error("Failed to extract valid JSON from the AI response");
  }
}

/**
 * Get response from Claude given a prompt
 */
export async function getClaudeResponse(prompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return 'AI functionality is not available. Please add an ANTHROPIC_API_KEY.';
  }

  try {
    console.log("Attempting to call Anthropic API with single message...");
    console.log(`Request to Anthropic API: model=${MODEL}, max_tokens=1000, prompt length=${prompt.length}`);
    
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Access content safely
    if (message.content && message.content.length > 0 && 'text' in message.content[0]) {
      return message.content[0].text;
    }
    return 'No response from AI service';
  } catch (error: any) {
    console.error('Error calling Anthropic API:', error);
    
    // Format error response
    let errorMessage = '';
    if (error.error && error.error.error && error.error.error.message) {
      // Handle specific API errors
      errorMessage = `${error.status} ${JSON.stringify(error.error)}`;
      
      // Handle credit balance issue
      if (error.error.error.message.includes('credit balance is too low')) {
        errorMessage = 'Anthropic API credit balance is too low. Please update your API key with sufficient credits.';
      }
    } else {
      // Generic error fallback
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    throw new Error(`Failed to get AI response: ${errorMessage}`);
  }
}

/**
 * Get response from Claude given messages history
 */
export async function getClaudeResponseFromHistory(
  messages: AIMessage[],
  systemPrompt?: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return 'AI functionality is not available. Please add an ANTHROPIC_API_KEY.';
  }

  try {
    console.log("Attempting to call Anthropic API...");
    
    // Convert our AIMessage format to the one expected by the Anthropic SDK
    const formattedMessages = messages.filter(msg => 
      // The Anthropic API only accepts 'user' and 'assistant' roles
      msg.role === 'user' || msg.role === 'assistant'
    ).map(message => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    }));

    // Log request details (without sensitive data)
    console.log(`Request to Anthropic API: model=${MODEL}, max_tokens=1000, message count=${formattedMessages.length}`);
    
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: formattedMessages,
      system: systemPrompt,
    });

    // Access content safely
    if (message.content && message.content.length > 0 && 'text' in message.content[0]) {
      return message.content[0].text;
    }
    return 'No response from AI service';
  } catch (error: any) {
    console.error('Error calling Anthropic API:', error);
    
    // Format error response
    let errorMessage = '';
    if (error.error && error.error.error && error.error.error.message) {
      // Handle specific API errors
      errorMessage = `${error.status} ${JSON.stringify(error.error)}`;
      
      // Handle credit balance issue
      if (error.error.error.message.includes('credit balance is too low')) {
        errorMessage = 'Anthropic API credit balance is too low. Please update your API key with sufficient credits.';
      }
    } else {
      // Generic error fallback
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    throw new Error(`Failed to get AI response: ${errorMessage}`);
  }
}

/**
 * Generate an email reply based on a suggested reply and user preferences
 */
export async function generateEmailReply(
  suggestedReply: string,
  context: { userPreferences?: any }
): Promise<string> {
  const stylePrompt = context.userPreferences?.aiResponseStyle === 'formal' 
    ? 'formal and professional' 
    : context.userPreferences?.aiResponseStyle === 'casual'
      ? 'friendly and casual'
      : 'balanced and natural';

  const prompt = `
    You are an AI assistant helping to customize an email reply.
    
    The suggested reply is:
    """
    ${suggestedReply}
    """
    
    Please refine this reply to be ${stylePrompt} in tone. 
    Maintain the key points but adjust the language, adding a professional signature at the end.
    The reply should be well-structured with appropriate paragraphs and be ready to send.
    
    Only return the email body - no formatting tags, no subject line, just the reply content.
  `;

  try {
    const response = await getClaudeResponse(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error generating email reply:', error);
    // In case of error, return the original suggestion
    return suggestedReply;
  }
}

/**
 * Summarize an email
 */
export async function summarizeEmail(emailContent: string): Promise<string> {
  const prompt = `
    Summarize the following email in a concise manner, highlighting the key points, any action items, and important deadlines:
    
    """
    ${emailContent}
    """
    
    Provide a summary in 3-5 bullet points.
  `;

  try {
    return await getClaudeResponse(prompt);
  } catch (error) {
    console.error('Error summarizing email:', error);
    throw error;
  }
}

/**
 * Generate meeting preparation notes
 */
export async function generateMeetingPrep(eventDetails: any): Promise<{ summary: string; context: string }> {
  // Format date and time with more detailed options
  const eventDate = new Date(eventDetails.startTime);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedTime = eventDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
  
  // Format attendees with better handling
  const attendeesStr = Array.isArray(eventDetails.attendees) && eventDetails.attendees.length > 0
    ? eventDetails.attendees.filter(Boolean).join(', ')
    : typeof eventDetails.attendees === 'string' 
      ? eventDetails.attendees 
      : 'No attendees specified';
    
  // Calculate meeting duration
  let durationMinutes = 30; // Default
  if (eventDetails.startTime && eventDetails.endTime) {
    const start = new Date(eventDetails.startTime);
    const end = new Date(eventDetails.endTime);
    durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  }
  
  // Determine meeting type based on attributes
  let meetingType = "standard";
  const titleLower = (eventDetails.title || "").toLowerCase();
  const descLower = (eventDetails.description || "").toLowerCase();
  
  if (titleLower.includes("interview") || descLower.includes("interview")) {
    meetingType = "interview";
  } else if (titleLower.includes("brainstorm") || descLower.includes("brainstorm")) {
    meetingType = "brainstorming";
  } else if (titleLower.includes("decision") || descLower.includes("decision") || descLower.includes("decide")) {
    meetingType = "decision-making";
  } else if (titleLower.includes("status") || titleLower.includes("update") || descLower.includes("update")) {
    meetingType = "status-update";
  } else if (titleLower.includes("review") || descLower.includes("review")) {
    meetingType = "review";
  } else if (titleLower.includes("planning") || descLower.includes("planning") || descLower.includes("plan")) {
    meetingType = "planning";
  }
  
  const prompt = `
    You are an AI assistant specialized in meeting preparation. 
    
    Prepare meeting notes for the following meeting:
    
    Title: ${eventDetails.title}
    Date: ${formattedDate}
    Time: ${formattedTime}
    Duration: ${durationMinutes} minutes
    Location: ${eventDetails.location || "Not specified"}
    Meeting URL: ${eventDetails.meetingUrl || "Not provided"}
    Attendees: ${attendeesStr}
    Description: ${eventDetails.description || "No description provided"}
    Meeting Type: ${meetingType}
    
    Your response should include:
    
    PART 1: MEETING SUMMARY
    - A concise 2-3 sentence overview of what the meeting is about and its purpose
    
    PART 2: CONTEXT & PREPARATION
    - Key background information needed for this meeting
    - Suggested talking points based on the meeting title and description
    - Questions to prepare for or ask during the meeting
    - Any documents or information that would be helpful to review beforehand
    - For meetings with specific people, suggestions on topics they might want to discuss
    - For decision meetings, options to consider with pros/cons
    
    Format this information clearly with headings and bullet points. Use professional language.
  `;

  try {
    console.log(`Generating meeting prep for: "${eventDetails.title}"`);
    
    const response = await getClaudeResponse(prompt);
    let summary = "";
    let context = response;
    
    // Try to separate the summary from the context if possible
    if (response.includes("PART 1") && response.includes("PART 2")) {
      // Split by parts and extract the summary (Part 1)
      const parts = response.split("PART 2");
      if (parts.length >= 1) {
        const summarySection = parts[0].replace("PART 1", "").replace("MEETING SUMMARY", "").trim();
        const contextSection = "PART 2" + parts[1].trim();
        
        summary = summarySection;
        context = contextSection;
      }
    } else {
      // Simpler fallback - try to extract first paragraph as summary
      const paragraphs = response.split('\n\n');
      summary = paragraphs[0].trim();
      context = response;
    }
    
    return { summary, context };
  } catch (error) {
    console.error("Error generating meeting prep:", error);
    
    // Provide a simple fallback
    return {
      summary: `Preparation notes for: ${eventDetails.title}`,
      context: `
        Meeting Details:
        Date: ${formattedDate}
        Time: ${formattedTime}
        Duration: ${durationMinutes} minutes
        Location: ${eventDetails.location || "Not specified"}
        Attendees: ${attendeesStr}
        
        Note: Unable to generate detailed preparation notes. Please review the meeting description.
      `
    };
  }
}

/**
 * Generate invoice follow-up email
 */
export async function generateInvoiceFollowUpEmail(
  invoiceData: any,
  invoiceNumber: string,
  daysPastDue: number,
  userContext: { fullName?: string; email?: string; preferences?: any }
): Promise<string> {
  const tone = daysPastDue > 30 ? 'firm but polite' : 'friendly but professional';
  const urgency = daysPastDue > 45 ? 'high' : daysPastDue > 15 ? 'medium' : 'low';
  
  // Format amount with currency
  const amount = typeof invoiceData.totalAmount === 'number' 
    ? invoiceData.totalAmount.toFixed(2)
    : typeof invoiceData.amount === 'number'
      ? invoiceData.amount.toFixed(2)
      : 'specified amount';
  
  // Format date nicely
  const formattedDueDate = invoiceData.dueDate 
    ? new Date(invoiceData.dueDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'the due date';
  
  // Get client name
  const clientName = invoiceData.clientName || invoiceData.client || 'Valued Client';
  
  const prompt = `
    You are an AI assistant helping to draft a payment reminder email for an overdue invoice.
    
    Here's the invoice information:
    - Invoice Number: ${invoiceNumber}
    - Client: ${clientName}
    - Amount: $${amount}
    - Due Date: ${formattedDueDate}
    - Days Past Due: ${daysPastDue}
    
    Please draft a ${tone} payment reminder email with ${urgency} urgency.
    
    The email should:
    - Start with a polite greeting
    - Reference the specific invoice number and amount
    - Mention that it's ${daysPastDue} days overdue
    - Request prompt payment
    - For invoices more than 30 days overdue, mention potential late fees or next steps
    - Include clear payment instructions
    - End with a professional sign-off
    - Include the sender's name (${userContext.fullName || 'Business Owner'})
    
    Only return the email body - no subject line, no formatting tags, just the content.
  `;
  
  try {
    const response = await getClaudeResponse(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error generating invoice follow-up email:', error);
    
    // Return a simple fallback template
    return `
      Dear ${clientName},
      
      I hope this email finds you well. I'm writing to follow up on invoice #${invoiceNumber} for $${amount}, which was due on ${formattedDueDate} and is currently ${daysPastDue} days overdue.
      
      Please let me know if you have any questions about this invoice or if there's anything I can do to facilitate payment.
      
      Thank you for your prompt attention to this matter.
      
      Best regards,
      ${userContext.fullName || 'Business Owner'}
    `.trim();
  }
}

/**
 * Generate tasks from email content
 */
export async function generateTasksFromEmailContent(emailContent: string): Promise<any[]> {
  try {
    const prompt = `
      You are Binate AI, an intelligent task extraction assistant.
      Analyze the following email content and identify any potential tasks or action items.
      
      EMAIL CONTENT:
      """
      ${emailContent}
      """
      
      For each task you identify, please provide:
      1. A clear, concise title for the task
      2. Any relevant description or context
      3. A priority level (high, medium, or low)
      4. A suggested due date (if mentioned or implied)
      5. Who should be assigned to it ("me" or "binate_ai")
      
      Format your response as a valid JSON array of task objects with the following structure:
      [
        {
          "title": "Task title",
          "description": "Task description and context",
          "priority": "high|medium|low",
          "dueDate": "YYYY-MM-DD", // or null if not specified
          "assignedTo": "me|binate_ai",
          "estimatedTime": 30 // estimated minutes to complete
        }
      ]
      
      Only extract actual tasks or action items that require follow-up, not general information.
      If no tasks are found, return an empty array.
    `;
    
    const response = await getClaudeResponse(prompt);
    
    try {
      // Use our helper function to extract JSON
      const tasks = extractJsonFromResponse(response);
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('Error parsing extracted tasks JSON:', error);
      return [];
    }
  } catch (error) {
    console.error('Error extracting tasks from email:', error);
    return [];
  }
}

/**
 * Generate task suggestions 
 */
export async function generateTaskSuggestions(messages: AIMessage[]): Promise<string> {
  try {
    const systemPrompt = `
      You are Binate AI, an intelligent task management assistant.
      Your goal is to help users manage their tasks by providing clear updates and suggestions.
      Be concise, helpful, and action-oriented in your responses.
    `;
    
    const response = await getClaudeResponseFromHistory(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    return "I'm sorry, I'm having trouble processing this task right now. Please try again later.";
  }
}

/**
 * Extract lead information from email
 */
export async function extractLeadFromEmail(emailContent: string): Promise<any> {
  try {
    const prompt = `
      You are Binate AI, an intelligent lead extraction assistant.
      Analyze the following email content and determine if it contains information about a potential business lead.
      
      EMAIL CONTENT:
      """
      ${emailContent}
      """
      
      If this appears to be a potential lead, extract the following information:
      1. Name of the potential client or contact person
      2. Email address
      3. Company or organization (if mentioned)
      4. Nature of interest or inquiry
      5. Suggested priority (high, medium, or low) based on urgency and potential value
      6. Estimated value of the potential deal (if hinted at)
      7. Any notes or context that would be helpful for follow-up
      8. Suggested next contact date (in YYYY-MM-DD format)
      
      Format your response as a valid JSON object with the following structure:
      {
        "name": "Contact name",
        "email": "contact@example.com",
        "company": "Company name or null",
        "interest": "Brief description of interest",
        "priority": "high|medium|low",
        "value": 1000, // estimated value in currency units, or 0 if unknown
        "notes": "Additional context or null",
        "nextContactDate": "YYYY-MM-DD", // or null if not applicable
        "confidence": 0.8 // your confidence that this is a lead (0.0 to 1.0)
      }
      
      If this does not appear to be a lead or you cannot extract sufficient information, return: {"confidence": 0}
    `;
    
    const response = await getClaudeResponse(prompt);
    
    try {
      // Use our helper function to extract JSON
      const leadData = extractJsonFromResponse(response);
      
      // If confidence is too low, return null
      if (!leadData.confidence || leadData.confidence < 0.4) {
        return null;
      }
      
      return leadData;
    } catch (error) {
      console.error('Error parsing extracted lead JSON:', error);
      return null;
    }
  } catch (error) {
    console.error('Error extracting lead from email:', error);
    return null;
  }
}

/**
 * Suggest a priority level for a lead
 */
export async function suggestLeadPriority(leadInfo: string, emailsContent: string): Promise<string | null> {
  try {
    const prompt = `
      You are Binate AI, an intelligent lead prioritization assistant.
      Your task is to analyze the lead information and email communications to suggest an appropriate priority level.
      
      LEAD INFORMATION:
      """
      ${leadInfo}
      """
      
      EMAIL COMMUNICATIONS:
      """
      ${emailsContent}
      """
      
      Based on the above information, suggest a priority level for this lead:
      - high: Urgent interest, clear buying signals, quick responses, high potential value
      - medium: Moderate interest, some engagement, average potential value
      - low: Initial inquiry, minimal follow-up, low potential value or long sales cycle
      
      Only respond with: "high", "medium", or "low" - no other text.
    `;
    
    const response = await getClaudeResponse(prompt);
    const priority = response.trim().toLowerCase();
    
    if (priority === 'high' || priority === 'medium' || priority === 'low') {
      return priority;
    }
    
    return null;
  } catch (error) {
    console.error('Error suggesting lead priority:', error);
    return null;
  }
}

/**
 * Generate meeting summary from notes
 */
export async function generateMeetingSummaryFromNotes(meetingNotes: string): Promise<string> {
  try {
    const prompt = `
      You are Binate AI, an intelligent meeting summary assistant.
      Analyze the following meeting notes and generate a concise, well-structured summary.
      
      MEETING NOTES:
      """
      ${meetingNotes}
      """
      
      Your summary should include:
      1. Key points discussed
      2. Decisions made
      3. Action items (clearly marked as "Action Item: [task]" on separate lines)
      4. Any important deadlines or dates
      5. Follow-up items
      
      Format the summary in clear, concise language with bullet points for readability.
      Keep the summary comprehensive but concise (maximum 300 words).
    `;
    
    const response = await getClaudeResponse(prompt);
    return response;
  } catch (error) {
    console.error('Error generating meeting summary:', error);
    return "Unable to generate meeting summary at this time.";
  }
}

/**
 * Generate meeting agenda
 */
export async function generateMeetingAgenda(title: string, dateTime: string, attendees: string[]): Promise<string> {
  try {
    const prompt = `
      You are Binate AI, an intelligent meeting preparation assistant.
      Generate a structured agenda for the following meeting:
      
      MEETING DETAILS:
      Title: ${title}
      Date/Time: ${dateTime}
      Attendees: ${attendees.join(', ') || 'Not specified'}
      
      Create a professional meeting agenda with:
      1. A brief introduction/purpose statement
      2. 3-5 logical agenda items based on the meeting title
      3. Allocated time suggestions for each item
      4. Space for "Any Other Business"
      5. Next steps/follow-up section
      
      Format the agenda in a clear, professional structure.
    `;
    
    const response = await getClaudeResponse(prompt);
    return response;
  } catch (error) {
    console.error('Error generating meeting agenda:', error);
    return "Unable to generate meeting agenda at this time.";
  }
}

/**
 * Extract invoice request from email
 */
export async function extractInvoiceRequestFromEmail(emailContent: string): Promise<any> {
  try {
    const prompt = `
      You are Binate AI, an intelligent invoice extraction assistant.
      Analyze the following email content and determine if it contains a request or information for creating an invoice.
      
      EMAIL CONTENT:
      """
      ${emailContent}
      """
      
      If this appears to be an invoice request, extract the following information:
      1. Client name or organization
      2. Service or product descriptions
      3. Quantities and unit prices (if mentioned)
      4. Total amount (if mentioned)
      5. Any notes or special instructions
      
      Format your response as a valid JSON object with the following structure:
      {
        "clientName": "Client name or organization",
        "items": [
          {
            "description": "Service/product description",
            "quantity": 1,
            "unitPrice": 100.00,
            "total": 100.00
          }
        ],
        "notes": "Additional notes or instructions",
        "confidence": 0.8 // your confidence that this is an invoice request (0.0 to 1.0)
      }
      
      If this does not appear to be an invoice request or you cannot extract sufficient information, return: {"confidence": 0}
    `;
    
    const response = await getClaudeResponse(prompt);
    
    try {
      // Use our helper function to extract JSON
      const invoiceData = extractJsonFromResponse(response);
      
      // If confidence is too low, return null
      if (!invoiceData.confidence || invoiceData.confidence < 0.4) {
        return null;
      }
      
      return invoiceData;
    } catch (error) {
      console.error('Error parsing extracted invoice JSON:', error);
      return null;
    }
  } catch (error) {
    console.error('Error extracting invoice request from email:', error);
    return null;
  }
}

/**
 * Categorize an expense based on description
 */
export async function categorizeExpense(description: string, categories: string[]): Promise<string | null> {
  try {
    const prompt = `
      You are Binate AI, an intelligent expense categorization assistant.
      Categorize the following expense description into one of the provided categories.
      
      EXPENSE DESCRIPTION:
      """
      ${description}
      """
      
      AVAILABLE CATEGORIES:
      """
      ${categories.join(', ')}
      """
      
      Return only the category name that best matches the expense. If none of the categories seem appropriate, return "Other".
    `;
    
    const response = await getClaudeResponse(prompt);
    const category = response.trim();
    
    if (categories.includes(category) || category === 'Other') {
      return category;
    }
    
    return 'Other';
  } catch (error) {
    console.error('Error categorizing expense:', error);
    return null;
  }
}

/**
 * Handle a general assistant query
 */
export async function handleAssistantQuery(
  query: string,
  history: AIMessage[],
  userPreferences: any = {}
): Promise<string> {
  // Determine user style preference
  const stylePrompt = userPreferences?.aiResponseStyle === 'formal' 
    ? 'professional and formal' 
    : userPreferences?.aiResponseStyle === 'casual'
      ? 'friendly and conversational'
      : 'helpful and balanced';
  
  const systemPrompt = `
    You are Binate AI, an intelligent executive assistant for professionals.
    You help with email management, meeting scheduling, task prioritization, invoice handling, and time management.
    
    Respond in a ${stylePrompt} tone.
    Keep your responses concise and actionable.
    If you need more information to provide a better response, ask clarifying questions.
  `;

  try {
    const messages: AIMessage[] = [...history, { role: 'user', content: query }];
    const response = await getClaudeResponseFromHistory(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error('Error handling assistant query:', error);
    throw error;
  }
}