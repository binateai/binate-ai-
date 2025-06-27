/**
 * Task Management Service
 * 
 * This service handles autonomous task operations including
 * task creation, prioritization, completion tracking, and reminders.
 */

import { storage } from '../storage';
import { generateTasksFromEmailContent, estimateTaskTime } from '../ai-service';
import { sendEmailNotification } from './email-sender';
import { sendTaskReminderNotification, sendTaskStatusUpdateNotification } from './slack-service';
// Gmail service imports removed as the functions aren't available

/**
 * Get tasks that are due soon for a user
 */
export async function getTasksDueSoon(userId: number, hours: number = 24): Promise<any[]> {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    try {
      // Get all tasks for the user
      const tasks = await storage.getTasksByUserId(userId);
      
      // Filter incomplete tasks due before the cutoff
      return tasks.filter(task => 
        !task.completed && task.dueDate && new Date(task.dueDate) <= cutoff
      );
    } catch (dbError) {
      console.warn(`Using fallback method for tasks due soon: ${dbError.message}`);
      
      // Just return an empty array as fallback
      return [];
    }
  } catch (error) {
    console.error(`Error getting tasks due soon for user ${userId}:`, error);
    return [];
  }
}

/**
 * Create a note for a task
 */
export async function createTaskNote(userId: number, taskId: number, note: string): Promise<any> {
  try {
    const task = await storage.getTask(taskId);
    
    if (!task || task.userId !== userId) {
      throw new Error('Task not found or unauthorized');
    }
    
    // Append to existing notes or create new
    const currentNotes = task.description || '';
    const updatedNotes = currentNotes 
      ? `${currentNotes}\n\n${new Date().toISOString()}: ${note}`
      : `${new Date().toISOString()}: ${note}`;
    
    // Update the task
    return await storage.updateTask(userId, taskId, {
      description: updatedNotes
    });
  } catch (error) {
    console.error(`Error creating task note:`, error);
    throw error;
  }
}

/**
 * Mark a task as completed
 */
export async function completeTask(userId: number, taskId: number): Promise<any> {
  try {
    const task = await storage.getTask(taskId);
    
    if (!task || task.userId !== userId) {
      throw new Error('Task not found or unauthorized');
    }
    
    // Update the task
    const updatedTask = await storage.updateTask(userId, taskId, {
      completed: true
    });
    
    try {
      // Get user preferences
      const user = await storage.getUser(userId);
      if (user) {
        const preferences = user.preferences ? 
          (typeof user.preferences === 'string' ? 
            JSON.parse(user.preferences) : user.preferences) 
          : {};
        
        // Send Slack notification if enabled
        if (preferences.slackEnabled === true && 
            preferences.slackNotifications?.taskAlerts !== false) {
          // Format task for Slack notification
          const taskForSlack = {
            id: task.id,
            title: task.title,
            completed: true,
            priority: task.priority ? task.priority : undefined,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            completedBy: "me", // Assuming the user completes it themselves
            completedAt: new Date()
          };
          
          // Send the notification
          const slackResult = await sendTaskStatusUpdateNotification(userId, taskForSlack);
          if (slackResult.success) {
            console.log(`Slack task completion notification sent for task ${taskId}`);
          } else {
            console.warn(`Failed to send Slack task completion notification: ${slackResult.errorMessage}`);
          }
        }
      }
    } catch (notificationError) {
      // Just log the error but don't fail the task completion
      console.error(`Error sending task completion notification:`, notificationError);
    }
    
    return updatedTask;
  } catch (error) {
    console.error(`Error completing task:`, error);
    throw error;
  }
}

/**
 * Process emails to automatically create tasks
 */
export async function processEmailsForTasks(userId: number): Promise<{ created: number }> {
  try {
    // Get unprocessed emails for this user
    // NOTE: This function is temporarily disabled as the email processing functions
    // are not yet implemented in the gmail service
    
    // For now, just return that no tasks were created
    console.log(`Email processing for tasks is not yet implemented`);
    return { created: 0 };
    
    /*
    // This code will be implemented when the email processing functions are available
    
    // Get unprocessed emails for this user
    const emails = await getUnprocessedEmails(userId, { 
      purpose: 'task-generation',
      limit: 10
    });
    
    if (!emails || emails.length === 0) {
      return { created: 0 };
    }
    
    console.log(`Processing ${emails.length} emails for task generation for user ${userId}`);
    
    let tasksCreated = 0;
    
    // Process each email
    for (const email of emails) {
      try {
        // Extract tasks from email content
        const emailContent = email.body || '';
        const suggestedTasks = await generateTasksFromEmailContent(emailContent);
        
        if (suggestedTasks && suggestedTasks.length > 0) {
          // Create each suggested task
          for (const taskSuggestion of suggestedTasks) {
            // Get time estimate
            let estimatedTime = taskSuggestion.estimatedTime || 30;
            try {
              const timeEstimate = await estimateTaskTime({
                title: taskSuggestion.title,
                description: taskSuggestion.description || ''
              });
              estimatedTime = timeEstimate.estimatedTime;
            } catch (err) {
              console.warn(`Error estimating time for task "${taskSuggestion.title}":`, err);
            }
            
            // Create the task
            await storage.createTask({
              userId,
              title: taskSuggestion.title,
              description: taskSuggestion.description || null,
              dueDate: taskSuggestion.dueDate ? new Date(taskSuggestion.dueDate) : null,
              priority: taskSuggestion.priority || 'medium',
              completed: false,
              aiGenerated: true,
              assignedTo: taskSuggestion.assignedTo || 'me',
              leadId: null,
              estimatedTime,
              source: `Email: ${email.subject}`
            });
            
            tasksCreated++;
          }
        }
        
        // Mark email as processed for task generation
        await markEmailAsProcessed(userId, email.id, { purpose: 'task-generation' });
        
      } catch (error) {
        console.error(`Error processing email ${email.id} for tasks:`, error);
      }
    }
    
    return { created: tasksCreated };
    */
  } catch (error) {
    console.error(`Error processing emails for tasks for user ${userId}:`, error);
    return { created: 0 };
  }
}

/**
 * Send reminders for upcoming tasks
 */
export async function sendTaskReminders(userId: number): Promise<{ sent: number, slackSent: boolean }> {
  try {
    // Get tasks due in the next 24 hours
    const upcomingTasks = await getTasksDueSoon(userId, 24);
    
    if (upcomingTasks.length === 0) {
      return { sent: 0, slackSent: false };
    }
    
    // Get user info
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return { sent: 0, slackSent: false };
    }
    
    // Get user preferences
    const preferences = user.preferences ? 
      (typeof user.preferences === 'string' ? 
        JSON.parse(user.preferences) : user.preferences) 
      : {};
    
    // Skip if reminders are disabled or email notifications are disabled
    if (preferences.taskReminders === false || preferences.emailNotifications === false) {
      console.log(`Task reminders or email notifications disabled for user ${userId}, skipping email reminders`);
      return { sent: 0, slackSent: false };
    }
    
    // Check when the last reminder was sent - don't send more than once every 8 hours
    const lastReminderTime = await storage.getLastTaskReminderDate(userId);
    if (lastReminderTime) {
      const lastTime = new Date(lastReminderTime);
      const now = new Date();
      // Only send a reminder if it's been at least 8 hours since the last one
      if (now.getTime() - lastTime.getTime() < 8 * 60 * 60 * 1000) {
        console.log(`Skipping task reminder for user ${userId} - last reminder sent ${Math.round((now.getTime() - lastTime.getTime()) / (60 * 60 * 1000))} hours ago`);
        return { sent: 0, slackSent: false };
      }
    }
    
    // Prepare email content
    const highPriorityTasks = upcomingTasks.filter(t => t.priority === 'high');
    const otherTasks = upcomingTasks.filter(t => t.priority !== 'high');
    
    let emailContent = `
      <h2>Task Reminders</h2>
      <p>Here are your upcoming tasks that are due soon:</p>
    `;
    
    if (highPriorityTasks.length > 0) {
      emailContent += `
        <h3>High Priority</h3>
        <ul>
      `;
      
      for (const task of highPriorityTasks) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        emailContent += `
          <li>
            <strong>${task.title}</strong> - Due: ${dueDate}
            ${task.description ? `<br/><small>${task.description}</small>` : ''}
          </li>
        `;
      }
      
      emailContent += `</ul>`;
    }
    
    if (otherTasks.length > 0) {
      emailContent += `
        <h3>Other Tasks</h3>
        <ul>
      `;
      
      for (const task of otherTasks) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const priority = task.priority === 'medium' ? 'Medium' : 'Low';
        
        emailContent += `
          <li>
            <strong>${task.title}</strong> (${priority}) - Due: ${dueDate}
          </li>
        `;
      }
      
      emailContent += `</ul>`;
    }
    
    // Send the email
    await sendEmailNotification(
      user,
      'Task Reminders: Upcoming Due Dates',
      emailContent,
      { isHtml: true }
    );
    
    // Update the last reminder sent date to prevent sending too frequently
    await storage.updateTaskReminderDate(userId);
    console.log(`Email task reminder sent for user ${userId} and reminder date updated`);
    
    let slackSent = false;
    
    // Slack notifications are now handled by the notification-scheduler service
    // This prevents duplicate notifications and follows the structured schedule
    
    return { sent: upcomingTasks.length, slackSent };
  } catch (error) {
    console.error(`Error sending task reminders for user ${userId}:`, error);
    return { sent: 0, slackSent: false };
  }
}

/**
 * Process all task-related operations for a user
 */
export async function processTasksForUser(userId: number): Promise<any> {
  try {
    const results = {
      created: 0,
      remindersSent: 0,
      slackNotificationsSent: false
    };
    
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return results;
    }
    
    // Process emails for task generation
    const emailTasks = await processEmailsForTasks(userId);
    results.created += emailTasks.created;
    
    // Send reminders for upcoming tasks
    const reminders = await sendTaskReminders(userId);
    results.remindersSent += reminders.sent;
    results.slackNotificationsSent = reminders.slackSent;
    
    return results;
  } catch (error) {
    console.error(`Error processing tasks for user ${userId}:`, error);
    return {
      created: 0,
      remindersSent: 0,
      error: error.message
    };
  }
}

/**
 * Process tasks for all users
 */
export async function processTasksForAllUsers(): Promise<any> {
  try {
    const users = await storage.getAllUsers();
    const results = {
      usersProcessed: 0,
      tasksCreated: 0,
      remindersSent: 0
    };
    
    for (const user of users) {
      try {
        // Get user preferences
        const preferences = user.preferences ? 
          (typeof user.preferences === 'string' ? 
            JSON.parse(user.preferences) : user.preferences) 
          : {};
        
        // Skip users who have disabled task automation
        if (preferences.autoManageTasks === false || preferences.pauseAI === true) {
          continue;
        }
        
        const userResults = await processTasksForUser(user.id);
        results.usersProcessed++;
        results.tasksCreated += userResults.created || 0;
        results.remindersSent += userResults.remindersSent || 0;
      } catch (error) {
        console.error(`Error processing tasks for user ${user.id}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error processing tasks for all users:', error);
    return {
      usersProcessed: 0,
      tasksCreated: 0,
      remindersSent: 0,
      error: error.message
    };
  }
}