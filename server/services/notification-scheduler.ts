/**
 * Notification Scheduler Service
 * Manages the scheduling of notifications and prevents the overwhelming of users
 */
import { storage } from '../storage';
import * as scheduledNotifications from './scheduled-notifications';

// Set to true to enable notifications, false to disable completely
const NOTIFICATIONS_ENABLED = true;

// Interval in milliseconds for checking scheduled notifications (1 minute)
const SCHEDULE_CHECK_INTERVAL = 60 * 1000;

// Interval in milliseconds for checking real-time urgent notifications (5 minutes)
const URGENT_CHECK_INTERVAL = 5 * 60 * 1000;

// Counter to track how many times scheduler has run (for cleanup)
let schedulerRunCount = 0;

// Store the interval IDs for cleanup
let scheduledDigestIntervalId: NodeJS.Timeout | null = null;
let urgentNotificationIntervalId: NodeJS.Timeout | null = null;

/**
 * Start the notification scheduler services
 */
export function startNotificationScheduler(): void {
  if (!NOTIFICATIONS_ENABLED) {
    console.log('Notification system is disabled');
    return;
  }
  
  console.log('Starting notification scheduler services...');
  stopNotificationScheduler(); // Stop any existing schedulers to prevent duplicates
  
  // Start checking for scheduled digest times
  scheduledDigestIntervalId = setInterval(async () => {
    try {
      await checkScheduledDigests();
      
      // Cleanup old tracking records periodically
      schedulerRunCount++;
      if (schedulerRunCount % 60 === 0) { // Once per hour (60 min * 1 min interval)
        scheduledNotifications.cleanupNotificationTracking();
        schedulerRunCount = 0;
      }
    } catch (error) {
      console.error('Error in scheduled digest interval:', error);
    }
  }, SCHEDULE_CHECK_INTERVAL);
  
  // Start checking for urgent notifications
  urgentNotificationIntervalId = setInterval(async () => {
    try {
      await checkUrgentNotifications();
    } catch (error) {
      console.error('Error in urgent notification interval:', error);
    }
  }, URGENT_CHECK_INTERVAL);
  
  console.log('Notification scheduler services started');
}

/**
 * Stop the notification scheduler services
 */
export function stopNotificationScheduler(): void {
  if (scheduledDigestIntervalId) {
    clearInterval(scheduledDigestIntervalId);
    scheduledDigestIntervalId = null;
  }
  
  if (urgentNotificationIntervalId) {
    clearInterval(urgentNotificationIntervalId);
    urgentNotificationIntervalId = null;
  }
  
  console.log('Notification scheduler services stopped');
}

/**
 * Check if it's time to send scheduled digests and send them
 */
async function checkScheduledDigests(): Promise<void> {
  try {
    // Only proceed if it's time for a scheduled digest
    if (!scheduledNotifications.isScheduledDigestTime()) {
      return;
    }
    
    console.log('Scheduled digest time detected, sending digests...');
    
    // Get all users (in a real app, you might want to filter by preferences)
    const users = await storage.getUsers();
    let sentCount = 0;
    
    // Send digest to each user
    for (const user of users) {
      try {
        const result = await scheduledNotifications.sendScheduledDigest(user.id);
        if (result) {
          sentCount++;
        }
      } catch (error) {
        console.error(`Error sending digest to user ${user.id}:`, error);
      }
    }
    
    console.log(`Finished sending scheduled digests to ${sentCount} users`);
  } catch (error) {
    console.error('Error checking scheduled digests:', error);
  }
}

/**
 * Check for urgent notifications (tasks due soon, imminent meetings, important leads)
 */
async function checkUrgentNotifications(): Promise<void> {
  try {
    console.log('Checking for urgent notifications...');
    
    // Get all users (in a real app, you might want to filter by preferences)
    const users = await storage.getUsers();
    
    // Track total notifications sent
    let taskNotificationsSent = 0;
    let meetingNotificationsSent = 0;
    let leadNotificationsSent = 0;
    
    // Process each user
    for (const user of users) {
      const userId = user.id;
      
      // Check urgent tasks (due within 1 hour)
      const tasksResult = await storage.getTasksByUserId(userId);
      const tasks = tasksResult || [];
      for (const task of tasks) {
        if (!task.completed) {
          const sent = await scheduledNotifications.sendUrgentTaskNotification(userId, null, task);
          if (sent) taskNotificationsSent++;
        }
      }
      
      // Check imminent meetings (starting within 15 minutes)
      const eventsResult = await storage.getEventsByUserId(userId);
      const meetings = eventsResult || [];
      for (const meeting of meetings) {
        const sent = await scheduledNotifications.sendImminentMeetingNotification(userId, null, meeting);
        if (sent) meetingNotificationsSent++;
      }
      
      // Check high-priority leads
      const leadsResult = await storage.getLeadsByUserId(userId);
      const leads = leadsResult || [];
      for (const lead of leads) {
        const sent = await scheduledNotifications.sendHighPriorityLeadNotification(userId, null, lead);
        if (sent) leadNotificationsSent++;
      }
    }
    
    console.log(
      `Urgent notifications sent: ${taskNotificationsSent} tasks, ` +
      `${meetingNotificationsSent} meetings, ${leadNotificationsSent} leads`
    );
  } catch (error) {
    console.error('Error checking urgent notifications:', error);
  }
}

// Export utility functions to manually trigger notifications
export const manualTriggers = {
  triggerDigestForUser: async (userId: number): Promise<boolean> => {
    try {
      return await scheduledNotifications.sendScheduledDigest(userId);
    } catch (error) {
      console.error(`Error manually triggering digest for user ${userId}:`, error);
      return false;
    }
  },
  
  triggerUrgentTaskNotification: async (
    userId: number, 
    clientId: number | null, 
    taskId: number
  ): Promise<boolean> => {
    try {
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== userId) {
        return false;
      }
      return await scheduledNotifications.sendUrgentTaskNotification(userId, clientId, task);
    } catch (error) {
      console.error(`Error manually triggering task notification for task ${taskId}:`, error);
      return false;
    }
  }
};