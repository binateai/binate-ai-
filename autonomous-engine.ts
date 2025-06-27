/**
 * Autonomous Engine Service
 * 
 * This service coordinates all automated activities across the platform,
 * creating a cohesive autonomous agent that operates intelligently
 * without manual intervention.
 */

import { storage } from '../storage';
import { sendEmailNotification } from './email-sender';
// These modules don't export the required functions yet
// import { processInvoicesForUser, processInvoicesForAllUsers } from './invoice-management';
import { processTasksForUser, processTasksForAllUsers } from './task-management';
import { runAutoCalendarManagement } from './calendar-management';
// import { processExpensesForUser, processExpensesForAllUsers } from './expense-management';
// import { processLeadsForUser, processLeadsForAllUsers } from './lead-management';
import { generateTaskSuggestions } from '../ai-service';
import { AIMessage } from '@shared/schema';
// Disable notification processing in autonomous engine
// import { processScheduledNotifications } from './notification-scheduler';

// Interval duration in milliseconds
const DEFAULT_CHECK_INTERVAL = 1000 * 60 * 15; // 15 minutes
const MIN_INTERVAL = 1000 * 60 * 5; // 5 minutes
const MAX_INTERVAL = 1000 * 60 * 60 * 2; // 2 hours

// Engine state
let engineRunning = false;
let lastRunTimestamp: number | null = null;
let currentInterval = DEFAULT_CHECK_INTERVAL;
let engineTimer: NodeJS.Timeout | null = null;

/**
 * Initialize the autonomous engine and start periodic checks
 */
export function initAutonomousEngine() {
  if (engineRunning) {
    console.log('Autonomous engine is already running.');
    return;
  }

  console.log('Initializing autonomous engine...');
  engineRunning = true;
  lastRunTimestamp = Date.now();

  // Temporarily disable automatic processes to stop the excessive notifications
  console.log('Automatic processes have been temporarily disabled to prevent excessive notifications');
  
  // Setting a much longer interval (1 day) to significantly reduce notifications
  currentInterval = 1000 * 60 * 60 * 24; // 24 hours
  
  // Schedule next cycle, but with a much longer interval
  engineTimer = setInterval(() => {
    console.log('Running scheduled processes with reduced frequency');
    runEngineProcesses();
  }, currentInterval);

  console.log(`Autonomous engine initialized with ${currentInterval / (1000 * 60)} minute interval.`);
}

/**
 * Stop the autonomous engine
 */
export function stopAutonomousEngine() {
  if (!engineRunning) {
    console.log('Autonomous engine is not running.');
    return;
  }

  console.log('Stopping autonomous engine...');
  
  if (engineTimer) {
    clearInterval(engineTimer);
    engineTimer = null;
  }
  
  engineRunning = false;
  console.log('Autonomous engine stopped.');
}

/**
 * Run all automated processes for users based on their preferences
 */
async function runEngineProcesses() {
  const startTime = Date.now();
  console.log(`Running autonomous engine processes at ${new Date().toISOString()}`);
  
  try {
    // Get all active users
    const users = await storage.getAllUsers();
    const totalUsers = users.length;
    
    console.log(`Processing autonomous tasks for ${totalUsers} users`);
    
    // Initialize counters for analytics
    let emailsProcessed = 0;
    let tasksCreated = 0;
    let invoicesProcessed = 0;
    let leadsDetected = 0;
    let meetingsManaged = 0;
    let expensesCategorized = 0;
    
    // Process each user based on their preferences
    for (const user of users) {
      // Get user preferences (default to empty object if null)
      const preferences = user.preferences ? 
        (typeof user.preferences === 'string' ? 
          JSON.parse(user.preferences) : user.preferences) 
        : {};
      
      // Skip users who have disabled autonomous features
      if (preferences.pauseAI === true) {
        console.log(`Skipping user ${user.id} - AI features paused`);
        continue;
      }
      
      try {
        // Process invoices - temporarily disabled
        if (preferences.autoManageInvoices !== false) {
          // const invoiceResults = await processInvoicesForUser(user.id);
          // invoicesProcessed += invoiceResults.processed || 0;
          console.log(`Invoice processing for user ${user.id} temporarily disabled`);
        }
        
        // Process calendar
        if (preferences.autoManageCalendar !== false) {
          // runAutoCalendarManagement doesn't accept parameters, so we're just calling it
          const calendarResults = await runAutoCalendarManagement();
          // Boolean result doesn't have processed property
          meetingsManaged += 1; // Just count that we ran it
        }
        
        // Process tasks
        if (preferences.autoManageTasks !== false) {
          const taskResults = await processTasksForUser(user.id);
          tasksCreated += taskResults.created || 0;
        }
        
        // Process expenses - temporarily disabled
        if (preferences.autoManageExpenses !== false) {
          // const expenseResults = await processExpensesForUser(user.id);
          // expensesCategorized += expenseResults.categorized || 0;
          console.log(`Expense processing for user ${user.id} temporarily disabled`);
        }
        
        // Process leads - temporarily disabled
        if (preferences.autoManageLeads !== false) {
          // const leadResults = await processLeadsForUser(user.id);
          // leadsDetected += leadResults.detected || 0;
          console.log(`Lead processing for user ${user.id} temporarily disabled`);
        }
        
        // Process scheduled notifications using the new structured approach
        if (preferences.slackEnabled !== false) {
          const notificationResults = await processScheduledNotifications(user.id);
          console.log(`Processed notifications for user ${user.id}: ${notificationResults.digestSent ? 'Digest sent' : 'No digest'}, ${notificationResults.urgentNotificationsSent} urgent notifications`);
        }
        
      } catch (error) {
        console.error(`Error processing autonomous tasks for user ${user.id}:`, error);
      }
    }
    
    // Generate daily summaries for all users who have it enabled
    await generateDailySummaries(users);
    
    // Log the results
    const endTime = Date.now();
    const totalProcessingTime = (endTime - startTime) / 1000;
    
    console.log(`Autonomous engine cycle completed in ${totalProcessingTime.toFixed(2)} seconds.`);
    console.log(`Analytics:
      - Users processed: ${totalUsers}
      - Emails processed: ${emailsProcessed}
      - Tasks created/updated: ${tasksCreated}
      - Invoices processed: ${invoicesProcessed}
      - Leads detected: ${leadsDetected}
      - Meetings managed: ${meetingsManaged}
      - Expenses categorized: ${expensesCategorized}
    `);
    
    // Adjust interval dynamically based on workload
    adjustInterval(totalUsers, totalProcessingTime);
    
  } catch (error) {
    console.error('Error in autonomous engine cycle:', error);
  }
  
  // Update timestamp
  lastRunTimestamp = Date.now();
}

/**
 * Dynamically adjust the interval based on workload
 */
function adjustInterval(userCount: number, processingTime: number) {
  // Basic algorithm: if processing takes more than 20% of interval, increase interval
  // If it takes less than 5% of interval, decrease interval
  const processingRatio = (processingTime * 1000) / currentInterval;
  
  if (processingRatio > 0.2) {
    // Increase interval but don't exceed max
    currentInterval = Math.min(currentInterval * 1.5, MAX_INTERVAL);
    console.log(`Adjusting engine interval UP to ${currentInterval / (1000 * 60)} minutes`);
    
    // Restart timer with new interval
    if (engineTimer) {
      clearInterval(engineTimer);
      engineTimer = setInterval(runEngineProcesses, currentInterval);
    }
  } else if (processingRatio < 0.05 && userCount > 0) {
    // Decrease interval but don't go below min
    currentInterval = Math.max(currentInterval * 0.8, MIN_INTERVAL);
    console.log(`Adjusting engine interval DOWN to ${currentInterval / (1000 * 60)} minutes`);
    
    // Restart timer with new interval
    if (engineTimer) {
      clearInterval(engineTimer);
      engineTimer = setInterval(runEngineProcesses, currentInterval);
    }
  }
}

/**
 * Generate and send daily summaries for users
 */
async function generateDailySummaries(users: any[]) {
  // Current time in user's timezone (defaulting to UTC)
  const now = new Date();
  const currentHour = now.getUTCHours();
  
  // Only send daily summaries at the beginning of the day (7-9 AM)
  if (currentHour < 7 || currentHour > 9) {
    return;
  }
  
  console.log('Daily summary generation is temporarily disabled as some storage functions are not implemented');
  return;
  
  /* The following code is commented out until the storage functions are implemented
  
  for (const user of users) {
    try {
      // Get user preferences
      const preferences = user.preferences ? 
        (typeof user.preferences === 'string' ? 
          JSON.parse(user.preferences) : user.preferences) 
        : {};
      
      // Skip users who have disabled daily summaries
      if (preferences.dailySummaries === false || preferences.pauseAI === true) {
        continue;
      }
      
      // Check if we've already sent a summary today for this user
      const lastSummaryDate = await storage.getLastDailySummaryDate(user.id);
      if (lastSummaryDate) {
        const lastDate = new Date(lastSummaryDate);
        if (lastDate.toDateString() === now.toDateString()) {
          // Already sent today
          continue;
        }
      }
      
      // Compile data for the summary
      const pendingTasks = await storage.getTasksByUserId(user.id, { completed: false });
      const completedTasks = await storage.getTasksByUserId(user.id, { 
        completed: true,
        since: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
      });
      
      const upcomingMeetings = await storage.getUpcomingEvents(user.id, 24); // Next 24 hours
      
      const overdueInvoices = await storage.getOverdueInvoices(user.id);
      
      // Generate AI summary
      const messages: AIMessage[] = [
        {
          role: 'user',
          content: `Please generate my daily summary for ${now.toDateString()}.
          
          Pending Tasks: ${pendingTasks.length}
          Completed Tasks: ${completedTasks.length}
          Upcoming Meetings: ${upcomingMeetings.length}
          Overdue Invoices: ${overdueInvoices.length}
          
          Please provide a concise, motivational summary of my day ahead, including the most important tasks to focus on.`
        }
      ];
      
      const summary = await generateTaskSuggestions(messages);
      
      // Send the summary via email
      if (user.email) {
        await sendEmailNotification(
          user, 
          'Your Daily Binate AI Summary', 
          summary,
          {
            includeTasks: pendingTasks.slice(0, 5), // Include top 5 tasks
            includeMeetings: upcomingMeetings.slice(0, 3), // Include top 3 meetings
            includeInvoices: overdueInvoices.length > 0 // Include invoice section if there are overdue invoices
          }
        );
        
        // Record that we sent a summary today
        await storage.updateDailySummaryDate(user.id);
      }
      
    } catch (error) {
      console.error(`Error generating daily summary for user ${user.id}:`, error);
    }
  }
  */
}

/**
 * Run all autonomous processes immediately
 */
export async function runAllProcessesNow() {
  await runEngineProcesses();
  return {
    success: true,
    timestamp: new Date().toISOString(),
    nextScheduledRun: new Date(Date.now() + currentInterval).toISOString()
  };
}

/**
 * Get the current status of the autonomous engine
 */
export function getEngineStatus() {
  return {
    running: engineRunning,
    lastRun: lastRunTimestamp ? new Date(lastRunTimestamp).toISOString() : null,
    interval: currentInterval,
    intervalMinutes: currentInterval / (1000 * 60),
    nextScheduledRun: engineRunning && lastRunTimestamp 
      ? new Date(lastRunTimestamp + currentInterval).toISOString() 
      : null
  };
}

/**
 * Set the check interval for the autonomous engine
 */
export function setEngineInterval(minutes: number) {
  if (minutes < MIN_INTERVAL / (1000 * 60) || minutes > MAX_INTERVAL / (1000 * 60)) {
    throw new Error(`Interval must be between ${MIN_INTERVAL / (1000 * 60)} and ${MAX_INTERVAL / (1000 * 60)} minutes`);
  }
  
  const newInterval = minutes * 60 * 1000;
  currentInterval = newInterval;
  
  // Restart timer with new interval if engine is running
  if (engineRunning && engineTimer) {
    clearInterval(engineTimer);
    engineTimer = setInterval(runEngineProcesses, currentInterval);
  }
  
  return getEngineStatus();
}