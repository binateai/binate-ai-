import { db } from "../db";
import { tasks, emails, InsertTask, Task } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { getClaudeResponse } from "../ai-service";

/**
 * Create a task from email content
 * @param userId User ID
 * @param emailId Email ID
 * @param emailData Email content to analyze
 */
export async function createTaskFromEmail(
  userId: number, 
  emailId: number, 
  emailData: { 
    subject: string, 
    body: string, 
    from: string,
    date: Date 
  }
): Promise<Task | null> {
  try {
    // Use AI to extract potential task information
    const taskData = await extractTaskFromEmail(emailData);
    
    if (!taskData) {
      console.log(`No task detected in email ID: ${emailId}`);
      return null;
    }
    
    // Create the task with reference to the email
    const insertData: InsertTask = {
      userId,
      title: taskData.title,
      description: taskData.description || '',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      priority: taskData.priority || 'medium',
      aiGenerated: true,
      assignedTo: 'me',
      estimatedTime: taskData.estimatedTime || 30,
      emailId: emailId,
      source: 'email'
    };
    
    // Insert task into database
    const [newTask] = await db.insert(tasks).values(insertData).returning();
    
    console.log(`Created task "${newTask.title}" from email ID: ${emailId}`);
    return newTask;
    
  } catch (error) {
    console.error('Error creating task from email:', error);
    return null;
  }
}

/**
 * Create a task from chat interaction
 * @param userId User ID
 * @param chatContent Chat content to analyze
 */
export async function createTaskFromChat(
  userId: number,
  chatContent: string,
  parsedTask?: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: 'high' | 'medium' | 'low';
    estimatedTime?: number;
  }
): Promise<Task | null> {
  try {
    // Use either the pre-parsed task data or extract it from chat content
    let taskData = parsedTask || {};
    
    if (!taskData.title) {
      const extractedData = await extractTaskFromText(chatContent);
      
      // Safely combine extracted data with existing taskData
      if (extractedData) {
        // Make sure we don't assign null or undefined values
        taskData = {
          ...taskData,
          title: extractedData.title || taskData.title,
          description: taskData.description || extractedData.description || '',
          dueDate: taskData.dueDate || extractedData.dueDate,
          priority: taskData.priority || extractedData.priority || 'medium',
          estimatedTime: taskData.estimatedTime || extractedData.estimatedTime || 30
        };
      }
      
      // If we still don't have a title, create a default one
      if (!taskData.title) {
        taskData.title = `Task from chat: ${chatContent.substring(0, 30)}${chatContent.length > 30 ? '...' : ''}`;
        taskData.description = taskData.description || chatContent.substring(0, 200);
        taskData.priority = taskData.priority || 'medium';
        taskData.estimatedTime = taskData.estimatedTime || 30;
      }
    }
    
    // Create the task
    const insertData: InsertTask = {
      userId,
      title: taskData.title,
      description: taskData.description || '',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      priority: taskData.priority || 'medium',
      aiGenerated: true,
      assignedTo: 'me',
      estimatedTime: taskData.estimatedTime || 30,
      source: 'chat'
    };
    
    // Insert task into database
    const [newTask] = await db.insert(tasks).values(insertData).returning();
    
    console.log(`Created task "${newTask.title}" from chat`);
    return newTask;
    
  } catch (error) {
    console.error('Error creating task from chat:', error);
    return null;
  }
}

/**
 * Extract task information from email content using AI
 */
async function extractTaskFromEmail(emailData: { 
  subject: string, 
  body: string, 
  from: string,
  date: Date 
}): Promise<{
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedTime?: number;
} | null> {
  try {
    const cleanBody = emailData.body.replace(/<[^>]*>/g, ' '); // Strip HTML tags
    
    // If AI is unavailable, do basic keyword analysis
    if (!process.env.ANTHROPIC_API_KEY) {
      const keywords = ['todo', 'task', 'action item', 'follow up', 'deadline', 'assignment', 'please do'];
      const cleanText = (emailData.subject + ' ' + cleanBody).toLowerCase();
      
      // Check if any keyword is found in the text
      const containsTask = keywords.some(keyword => cleanText.includes(keyword.toLowerCase()));
      
      if (containsTask) {
        return {
          title: emailData.subject,
          description: cleanBody.substring(0, 200),
          priority: 'medium',
          estimatedTime: 30
        };
      }
      return null;
    }
    
    const prompt = `
You are an AI assistant that helps extract task information from email content.
Analyze the following email and determine if it contains a task or action item.

Email Subject: ${emailData.subject}
Email From: ${emailData.from}
Email Date: ${emailData.date.toISOString()}
Email Content:
${cleanBody.substring(0, 3000)} // Truncate long emails

If this email indicates a task, action item, or something that needs follow-up:
1. Extract the main task title (1 line, concise)
2. Create a brief description
3. Identify any due date mentioned (convert to YYYY-MM-DD format)
4. Assign priority (high, medium, low)
5. Estimate time required in minutes

Return a JSON response ONLY like this:
{
  "containsTask": true or false,
  "title": "Task title here",
  "description": "Task description here",
  "dueDate": "YYYY-MM-DD" or null,
  "priority": "high", "medium", or "low",
  "estimatedTime": 30 (number of minutes)
}
`;

    // Call the AI service
    const response = await getClaudeResponse(prompt);
    if (!response) throw new Error('Failed to get AI response');
    
    try {
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.containsTask) {
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
          dueDate: parsedResponse.dueDate,
          priority: parsedResponse.priority,
          estimatedTime: parsedResponse.estimatedTime
        };
      } else {
        return null; // No task detected
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      return null;
    }
  } catch (error) {
    console.error('Error in extractTaskFromEmail:', error);
    return null;
  }
}

/**
 * Extract task information from chat text using AI
 */
async function extractTaskFromText(text: string): Promise<{
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedTime?: number;
} | null> {
  try {
    // Fall back to basic extraction if AI is unavailable
    if (!process.env.ANTHROPIC_API_KEY) {
      // Simple fallback for development without API key
      const words = text.split(' ');
      const title = words.slice(0, Math.min(8, words.length)).join(' ');
      return {
        title: title || 'New Task',
        description: text.substring(0, 200),
        priority: 'medium',
        estimatedTime: 30
      };
    }

    const prompt = `
You are an AI assistant that helps extract task information from user messages.
Analyze the following text and determine if it contains a task request or action item:

${text.substring(0, 500)} // Truncate long inputs

If this message indicates a task, action item, or something that needs to be tracked:
1. Extract the main task title (1 line, concise)
2. Create a brief description
3. Identify any due date mentioned (convert to YYYY-MM-DD format)
4. Assign priority (high, medium, low)
5. Estimate time required in minutes

Return a JSON response ONLY like this:
{
  "containsTask": true or false,
  "title": "Task title here",
  "description": "Task description here",
  "dueDate": "YYYY-MM-DD" or null,
  "priority": "high", "medium", or "low",
  "estimatedTime": 30 (number of minutes)
}
`;

    // Call the AI service
    const response = await getClaudeResponse(prompt);
    if (!response) throw new Error('Failed to get AI response');
    
    try {
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.containsTask) {
        return {
          title: parsedResponse.title,
          description: parsedResponse.description,
          dueDate: parsedResponse.dueDate,
          priority: parsedResponse.priority,
          estimatedTime: parsedResponse.estimatedTime
        };
      } else {
        return null; // No task detected
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Basic fallback if parsing fails
      return {
        title: text.substring(0, 50) || 'New Task',
        description: text.substring(0, 200),
        priority: 'medium',
        estimatedTime: 30
      };
    }
  } catch (error) {
    console.error('Error in extractTaskFromText:', error);
    // Basic fallback if AI fails
    return {
      title: text.substring(0, 50) || 'New Task',
      description: text.substring(0, 200),
      priority: 'medium',
      estimatedTime: 30
    };
  }
}

// Function to detect if an email contains a task
export async function emailContainsTask(emailData: { 
  subject: string, 
  body: string, 
  from: string
}): Promise<boolean> {
  try {
    // Simple keyword-based detection as fallback
    const keywords = ['todo', 'task', 'action item', 'follow up', 'deadline', 'assignment', 'please do'];
    
    const cleanText = (emailData.subject + ' ' + emailData.body).toLowerCase();
    
    // Check if any keyword is found in the text
    return keywords.some(keyword => cleanText.includes(keyword.toLowerCase()));
  } catch (error) {
    console.error('Error in emailContainsTask:', error);
    return false;
  }
}

// Get task history for a specific email thread
export async function getTasksForEmailThread(userId: number, threadId: string): Promise<Task[]> {
  try {
    // Get all emails in the thread
    const emailsInThread = await db
      .select()
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        eq(emails.threadId, threadId)
      ));
      
    const emailIds = emailsInThread.map(email => email.id);
    
    // Query for tasks that are directly linked to these emails
    let linkedTasks: Task[] = [];
    
    if (emailIds.length > 0) {
      // We need to handle this differently since .in() isn't available on nullable columns
      linkedTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            // Handle multiple email IDs using OR conditions
            emailIds.length === 1 
              ? eq(tasks.emailId, emailIds[0])
              : or(...emailIds.map(id => eq(tasks.emailId, id)))
          )
        );
    }
      
    if (linkedTasks.length > 0) {
      return linkedTasks;
    }
    
    // Fallback: if no linked tasks are found, look for keyword matches
    const emailSubjects = emailsInThread.map(email => email.subject.toLowerCase());
    
    // Get all tasks for this user
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));
      
    // Naive approach: return tasks whose titles contain words from the email subjects
    // This is a secondary approach when direct links aren't available
    return userTasks.filter(task => {
      const taskTitle = task.title.toLowerCase();
      return emailSubjects.some(subject => 
        subject.split(' ').some(word => 
          word.length > 3 && taskTitle.includes(word)
        )
      );
    });
  } catch (error) {
    console.error('Error getting tasks for email thread:', error);
    return [];
  }
}