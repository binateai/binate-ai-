/**
 * Scheduled Notifications Service
 * Manages scheduled digests and real-time notifications via email
 * 
 * Note: Slack integration temporarily disabled, focusing on email delivery
 */
import { storage } from '../storage';
// import * as slackController from './slack/controller'; // Temporarily disabled
import { sendEmailNotification } from './email-sender';
import { Task, Event, Lead, Invoice } from '../../shared/schema';

// Define scheduled digest times 
const DIGEST_TIMES = [
  { hour: 7, minute: 0 },  // 7am 
  { hour: 12, minute: 0 }, // 12pm
  { hour: 17, minute: 0 }  // 5pm
];

// Tracking to prevent duplicate notifications
const sentNotifications = new Map<string, Date>();

/**
 * Check if it's time to send a scheduled digest
 */
export function isScheduledDigestTime(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Check if current time matches any of the scheduled times (within 5 min window)
  return DIGEST_TIMES.some(time => 
    currentHour === time.hour && 
    currentMinute >= time.minute && 
    currentMinute < time.minute + 5
  );
}

/**
 * Send scheduled digest to all clients for a user at 7am, 12pm, and 5pm
 * Now using email instead of Slack
 */
export async function sendScheduledDigest(userId: number): Promise<boolean> {
  try {
    const now = new Date();
    const digestKey = `digest-${userId}-${now.toDateString()}-${now.getHours()}`;
    
    // Check if we've already sent this digest in the last hour
    const lastSent = sentNotifications.get(digestKey);
    if (lastSent && (now.getTime() - lastSent.getTime()) < 60 * 60 * 1000) {
      console.log(`Skipping duplicate digest for user ${userId}`);
      return false;
    }
    
    // Get user data for email
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for digest delivery`);
      return false;
    }

    // For multi-tenant safety, client data is scoped per user automatically
    
    // Get tasks, meetings, leads for digest
    const tasksResult = await storage.getTasksByUserId(userId);
    const tasks = tasksResult || [];
    const dueTodayTasks = tasks.filter((task: Task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === now.toDateString();
    });
    const overdueTasks = tasks.filter((task: Task) => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && dueDate.toDateString() !== now.toDateString();
    });
    const completedTasks = tasks.filter((task: Task) => task.completed);
    
    // Get meetings
    const eventsResult = await storage.getEventsByUserId(userId);
    const events = eventsResult || [];
    const todayMeetings = events.filter((event: Event) => {
      const startTime = new Date(event.startTime);
      return startTime.toDateString() === now.toDateString();
    });
    
    // Get leads
    const leadsResult = await storage.getLeadsByUserId(userId);
    const leads = leadsResult || [];
    const newLeads = leads.filter((lead: Lead) => {
      if (!lead.createdAt) return false;
      const createdAt = new Date(lead.createdAt);
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return createdAt > oneDayAgo;
    });
    
    // Generate digest time description (morning, midday, evening)
    const currentHour = now.getHours();
    let timeOfDay = "daily";
    if (currentHour >= 5 && currentHour < 12) {
      timeOfDay = "morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = "midday";
    } else {
      timeOfDay = "evening";
    }
    
    // Determine if there's anything important to report
    const hasImportantTasks = dueTodayTasks.length > 0 || overdueTasks.length > 0;
    const hasImportantMeetings = todayMeetings.length > 0;
    const hasImportantLeads = newLeads.length > 0;
    
    if (!hasImportantTasks && !hasImportantMeetings && !hasImportantLeads) {
      console.log(`Skipping digest for user ${userId} - no important items to report`);
      // Still mark as sent to prevent checking again in this window
      sentNotifications.set(digestKey, now);
      return true;
    }
    
    // Prepare a summary of the digest content
    const digestSummary = `
      <h2>Your ${timeOfDay} digest</h2>
      
      <p>Here's a summary of your current items:</p>
      
      <ul>
        ${tasks.length > 0 ? `<li><strong>Tasks:</strong> ${completedTasks.length} completed, ${dueTodayTasks.length} due today, ${overdueTasks.length} overdue</li>` : ''}
        ${events.length > 0 ? `<li><strong>Meetings:</strong> ${todayMeetings.length} today</li>` : ''}
        ${leads.length > 0 ? `<li><strong>Leads:</strong> ${newLeads.length} new leads</li>` : ''}
      </ul>
      
      ${dueTodayTasks.length > 0 ? `<h3>Tasks due today:</h3>` : ''}
    `.trim();
    
    // Define email subject based on time of day and content
    const emailSubject = `Your ${timeOfDay} digest - ${now.toLocaleDateString()}`;
    
    // Send email digest
    const emailResult = await sendEmailNotification(
      user,
      emailSubject,
      digestSummary,
      {
        isHtml: true,
        includeTasks: dueTodayTasks.length > 0 ? dueTodayTasks : undefined,
        includeMeetings: todayMeetings.length > 0 ? todayMeetings : undefined
      }
    );
    
    // Log success or failure for monitoring
    if (emailResult) {
      console.log(`Successfully sent ${timeOfDay} digest email to user ${userId} (${user.email})`);
      // Track that we sent this digest
      sentNotifications.set(digestKey, now);
      return true;
    } else {
      console.error(`Failed to send ${timeOfDay} digest email to user ${userId} (${user.email})`);
      return false;
    }
  } catch (error) {
    console.error('Error sending scheduled digest:', error);
    return false;
  }
}

/**
 * Send real-time task notification if it meets urgency criteria
 * Now using email instead of Slack
 */
export async function sendUrgentTaskNotification(
  userId: number, 
  clientId: number | null, 
  task: Task
): Promise<boolean> {
  try {
    if (!task.dueDate) return false;
    
    // Get user data for email
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for task notification delivery`);
      return false;
    }
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const millisecondsUntilDue = dueDate.getTime() - now.getTime();
    const hoursUntilDue = millisecondsUntilDue / (1000 * 60 * 60);
    
    // Only send real-time notifications for tasks that are:
    // 1. Due within 30 minutes, OR
    // 2. High priority
    const minutesUntilDue = hoursUntilDue * 60;
    const isUrgentByTime = minutesUntilDue <= 30 && minutesUntilDue >= 0;
    const isUrgentByPriority = task.priority === 'high';
    
    if (!isUrgentByTime && !isUrgentByPriority) {
      return false;
    }
    
    // Check if we've sent this notification recently
    const notificationKey = `task-${task.id}-urgent`;
    const lastSent = sentNotifications.get(notificationKey);
    if (lastSent && (now.getTime() - lastSent.getTime()) < 30 * 60 * 1000) {
      // Don't send duplicate within 30 minutes
      return false;
    }
    
    // Craft a subject based on urgency
    let subject = "";
    if (isUrgentByTime && minutesUntilDue <= 15) {
      subject = `URGENT: Task due in ${Math.round(minutesUntilDue)} minutes - ${task.title}`;
    } else if (isUrgentByTime) {
      subject = `Reminder: Task due soon - ${task.title}`;
    } else {
      subject = `High priority task - ${task.title}`;
    }
    
    // Create content message with task details
    const content = `
      <h2>${task.title}</h2>
      
      <p><strong>Due:</strong> ${dueDate.toLocaleString()}</p>
      ${task.priority ? `<p><strong>Priority:</strong> ${task.priority}</p>` : ''}
      ${task.description ? `<p><strong>Description:</strong><br>${task.description}</p>` : ''}
      
      <p>This is an automated reminder for your urgent task.</p>
    `.trim();
    
    // Send email notification
    const emailResult = await sendEmailNotification(
      user,
      subject,
      content,
      { isHtml: true }
    );
    
    if (emailResult) {
      // Track that we sent this notification
      sentNotifications.set(notificationKey, now);
      console.log(`Sent urgent task notification email for task ${task.id} to user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending urgent task notification:', error);
    return false;
  }
}

/**
 * Send real-time meeting notification if it meets urgency criteria
 * Now using email instead of Slack
 */
export async function sendImminentMeetingNotification(
  userId: number, 
  clientId: number | null, 
  meeting: Event
): Promise<boolean> {
  try {
    // Get user data for email
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for meeting notification delivery`);
      return false;
    }
    
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const millisecondsUntilStart = startTime.getTime() - now.getTime();
    const minutesUntilStart = millisecondsUntilStart / (1000 * 60);
    
    // Only send real-time notifications for meetings starting in 15 minutes
    if (minutesUntilStart > 15 || minutesUntilStart < 0) {
      return false;
    }
    
    // Check if we've sent this notification recently
    const notificationKey = `meeting-${meeting.id}-imminent`;
    const lastSent = sentNotifications.get(notificationKey);
    if (lastSent && (now.getTime() - lastSent.getTime()) < 5 * 60 * 1000) {
      // Don't send duplicate within 5 minutes
      return false;
    }
    
    // Format the email subject based on proximity
    const roundedMinutes = Math.round(minutesUntilStart);
    const subject = `Meeting starting in ${roundedMinutes} minutes: ${meeting.title}`;
    
    // Format the email content
    const content = `
      <h2>${meeting.title}</h2>
      
      <p><strong>Start time:</strong> ${startTime.toLocaleString()}</p>
      <p><strong>End time:</strong> ${new Date(meeting.endTime).toLocaleString()}</p>
      ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
      ${meeting.description ? `<p><strong>Description:</strong><br>${meeting.description}</p>` : ''}
      
      ${meeting.meetingUrl ? `<p><a href="${meeting.meetingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2a6399; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Meeting</a></p>` : ''}
      
      <p>This is an automated reminder for your upcoming meeting.</p>
    `.trim();
    
    // Send email notification
    const emailResult = await sendEmailNotification(
      user,
      subject,
      content,
      { isHtml: true }
    );
    
    if (emailResult) {
      // Track that we sent this notification
      sentNotifications.set(notificationKey, now);
      console.log(`Sent meeting reminder email for meeting ${meeting.id} to user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending imminent meeting notification:', error);
    return false;
  }
}

/**
 * Send real-time lead notification if it's high priority
 * Now using email instead of Slack
 */
export async function sendHighPriorityLeadNotification(
  userId: number, 
  clientId: number | null, 
  lead: Lead
): Promise<boolean> {
  try {
    // Get user data for email
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for lead notification delivery`);
      return false;
    }
    
    // Only send notifications for high priority leads or leads with value > 10000
    if (lead.priority !== 'high' && (!lead.value || lead.value <= 10000)) {
      return false;
    }
    
    // Check if this is a recently created lead
    const now = new Date();
    const createdAt = lead.createdAt ? new Date(lead.createdAt) : now;
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // Only send notification if created in the last 2 hours
    if (hoursSinceCreation > 2) {
      return false;
    }
    
    // Check if we've sent this notification recently
    const notificationKey = `lead-${lead.id}-highpriority`;
    const lastSent = sentNotifications.get(notificationKey);
    if (lastSent) {
      // Only send lead notification once (no duplicates)
      return false;
    }
    
    // Create email subject
    let subject = "";
    if (lead.priority === 'high') {
      subject = `High priority lead: ${lead.name}`;
    } else if (lead.value && lead.value > 10000) {
      subject = `High value lead: ${lead.name} - ${formatCurrency(lead.value)}`;
    } else {
      subject = `New lead: ${lead.name}`;
    }
    
    // Format the email content
    const content = `
      <h2>New Lead: ${lead.name}</h2>
      
      <p>A new high-priority lead has been added to your system.</p>
      
      <div style="padding: 15px; border: 1px solid #eee; border-radius: 5px; margin: 15px 0;">
        <p><strong>Name:</strong> ${lead.name}</p>
        ${lead.email ? `<p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>` : ''}
        ${lead.company ? `<p><strong>Company:</strong> ${lead.company}</p>` : ''}
        ${lead.source ? `<p><strong>Source:</strong> ${lead.source}</p>` : ''}
        ${lead.priority ? `<p><strong>Priority:</strong> <span style="color: ${lead.priority === 'high' ? '#d9534f' : '#5bc0de'}">${lead.priority}</span></p>` : ''}
        ${lead.value ? `<p><strong>Estimated Value:</strong> ${formatCurrency(lead.value)}</p>` : ''}
      </div>
      
      <p>This lead was created ${Math.round(hoursSinceCreation * 10) / 10} hours ago.</p>
    `.trim();
    
    // Send email notification
    const emailResult = await sendEmailNotification(
      user,
      subject,
      content,
      { isHtml: true }
    );
    
    if (emailResult) {
      // Track that we sent this notification
      sentNotifications.set(notificationKey, now);
      console.log(`Sent high priority lead notification email for lead ${lead.id} to user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending high priority lead notification:', error);
    return false;
  }
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Clean up old notification tracking entries
 */
export function cleanupNotificationTracking(): void {
  const now = new Date();
  
  // Remove entries older than 24 hours
  // Using Array.from() to avoid iterator issues
  Array.from(sentNotifications.entries()).forEach(([key, timestamp]) => {
    if ((now.getTime() - timestamp.getTime()) > 24 * 60 * 60 * 1000) {
      sentNotifications.delete(key);
    }
  });
}