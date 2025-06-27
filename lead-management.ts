import { storage } from "../storage";
import { extractLeadFromEmail, suggestLeadPriority } from "../ai-service";

/**
 * Get all leads for a user that need follow-up
 */
export async function getLeadsNeedingFollowUp(userId: number) {
  try {
    const leads = await storage.getLeadsByUserId(userId);
    const now = new Date();
    
    // Filter for leads that need follow-up
    return leads.filter(lead => {
      // Skip if lead has no next contact date
      if (!lead.nextContactDate) return false;
      
      // Check if next contact date is past
      const nextContactDate = new Date(lead.nextContactDate);
      return nextContactDate <= now;
    });
  } catch (error) {
    console.error(`Error getting leads needing follow-up for user ${userId}:`, error);
    return [];
  }
}

/**
 * Detect new leads from emails
 */
export async function detectLeadsFromEmails(userId: number) {
  try {
    console.log(`Processing emails for user ${userId} to detect new leads`);
    
    let leadsCreated = 0;
    
    // Get emails using fetchEmails instead of the missing function
    try {
      const { fetchEmails } = await import('./gmail');
      const emails = await fetchEmails(userId, 50); // Fetch the last 50 emails
      
      if (!emails.length) {
        console.log(`No emails found for lead detection for user ${userId}`);
        return 0;
      }
      
      // Process each email
      for (const email of emails) {
        // Skip system emails or very short emails
        if (email.from?.includes('noreply') || 
            email.from?.includes('no-reply') || 
            !email.body || 
            email.body.trim().length < 30) {
          // Skip marking as processed since we don't have that function
          continue;
        }
        
        // Extract lead information
        const emailContent = `
          From: ${email.from}
          Subject: ${email.subject}
          Date: ${email.date ? new Date(email.date).toISOString() : 'Unknown'}
          
          ${email.body}
        `;
        
        const leadData = await extractLeadFromEmail(emailContent);
        
        if (leadData && leadData.name && leadData.email) {
          // Check if lead already exists
          const existingLeads = await storage.getLeadsByUserId(userId);
          const alreadyExists = existingLeads.some(lead => 
            lead.email === leadData.email || 
            lead.name === leadData.name
          );
          
          if (!alreadyExists) {
            // Create the lead
            await storage.createLead({
              userId,
              name: leadData.name,
              email: leadData.email,
              source: 'email',
              status: 'new',
              priority: leadData.priority || 'medium',
              value: leadData.value || 0,
              nextContactDate: leadData.nextContactDate ? new Date(leadData.nextContactDate) : null,
              notes: leadData.notes || `Lead created automatically from email.\nOriginal Message:\n${email.body.substring(0, 500)}...`,
              tags: ['auto-detected'],
              metadata: {
                sourceEmailId: email.id,
                detectionConfidence: leadData.confidence || 0.8
              }
            });
            
            leadsCreated++;
            
            // Create a task to follow up with the lead
            await storage.createTask({
              userId,
              title: `Follow up with new lead: ${leadData.name}`,
              description: `This lead was automatically detected from an email. Review and follow up as needed.`,
              priority: leadData.priority || 'medium',
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 1 day
              assignedTo: 'me',
              estimatedTime: 30,
              aiGenerated: true,
              completed: false
              // leadId will be added later after the lead is created
            });
          }
        }
      }
    } catch (error: any) {
      // Handle Google account not connected error gracefully
      if (error.message && error.message.includes('Google account not connected')) {
        console.log(`User ${userId} doesn't have Google account connected. Skipping email-based lead detection.`);
        return 0;
      }
      throw error; // Re-throw other errors
    }
    
    console.log(`Created ${leadsCreated} leads from emails for user ${userId}`);
    return leadsCreated;
  } catch (error) {
    console.error(`Error detecting leads from emails for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Update lead priority based on analysis
 */
export async function updateLeadPriority(userId: number, leadId: number) {
  try {
    const lead = await storage.getLead(leadId);
    
    if (!lead || lead.userId !== userId) {
      console.error(`Lead ${leadId} not found or does not belong to user ${userId}`);
      return false;
    }
    
    try {
      // Use fetchEmails and filter by address since getEmailsForAddress is not available
      const { fetchEmails } = await import('./gmail');
      const allEmails = await fetchEmails(userId, 100); // Fetch more emails to increase chance of finding matches
      const emails = allEmails.filter(email => 
        email.from?.toLowerCase().includes(lead.email.toLowerCase()) || 
        email.to?.toLowerCase().includes(lead.email.toLowerCase())
      );
      
      if (emails.length === 0) {
        console.log(`No emails found for lead ${leadId} with email ${lead.email}`);
        return false;
      }
      
      // Combine all email content
      const emailsContent = emails.map((email: { subject: string, date?: Date | string | null, body?: string }) => `
        Subject: ${email.subject || 'No Subject'}
        Date: ${email.date ? new Date(email.date).toISOString() : 'Unknown'}
        
        ${email.body || 'No content'}
      `).join('\n\n---\n\n');
      
      // Get lead info
      const leadInfo = `
        Name: ${lead.name}
        Email: ${lead.email}
        Status: ${lead.status}
        Current Priority: ${lead.priority}
        Last Contact: ${lead.lastContactDate ? new Date(lead.lastContactDate).toISOString() : 'Unknown'}
        Notes: ${lead.notes || 'No notes available'}
      `;
      
      // Analyze and suggest priority
      const suggestedPriority = await suggestLeadPriority(leadInfo, emailsContent);
      
      if (suggestedPriority && suggestedPriority !== lead.priority) {
        // Update the lead
        await storage.updateLead(userId, leadId, {
          priority: suggestedPriority,
          updatedAt: new Date()
        });
        
        console.log(`Updated lead ${leadId} priority from ${lead.priority} to ${suggestedPriority}`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      // Handle Google account not connected error gracefully
      if (error.message && error.message.includes('Google account not connected')) {
        console.log(`User ${userId} doesn't have Google account connected. Skipping email-based priority update.`);
        return false;
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.error(`Error updating priority for lead ${leadId}:`, error);
    return false;
  }
}

/**
 * Process leads for follow-up
 */
export async function processLeadsForUser(userId: number) {
  try {
    console.log(`Starting autonomous lead management for user ${userId}`);
    
    // Step 1: Detect new leads from emails
    console.log(`Processing emails for user ${userId} to detect new leads`);
    await detectLeadsFromEmails(userId);
    
    // Step 2: Get existing leads
    const leads = await storage.getLeadsByUserId(userId);
    console.log(`Found ${leads.length} leads to process for user ${userId}`);
    
    let processed = 0;
    let priorityUpdated = 0;
    let followUpSent = 0;
    let errors = 0;
    
    // Process each lead
    for (const lead of leads) {
      try {
        console.log(`Processing lead: ${lead.name} (${lead.email})`);
        
        // Update lead priority if it's been more than 7 days
        const shouldUpdatePriority = !lead.updatedAt || 
          (new Date().getTime() - new Date(lead.updatedAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
        
        if (shouldUpdatePriority) {
          const updated = await updateLeadPriority(userId, lead.id);
          if (updated) {
            priorityUpdated++;
          }
        }
        
        // Check if lead needs follow-up
        const needsFollowUp = lead.nextContactDate && new Date(lead.nextContactDate) <= new Date();
        
        if (needsFollowUp) {
          try {
            // Use fetchEmails and filter by address since getEmailsForAddress is not available
            const { fetchEmails } = await import('./gmail');
            const allEmails = await fetchEmails(userId, 100); // Fetch more emails to increase chance of finding matches
            const emails = allEmails.filter(email => 
              email.from?.toLowerCase().includes(lead.email.toLowerCase()) || 
              email.to?.toLowerCase().includes(lead.email.toLowerCase())
            );
            
            // Get last email date
            let lastEmailDate: Date | null = null;
            if (emails.length > 0) {
              const sortedEmails = [...emails].sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
              });
              
              if (sortedEmails[0].date) {
                lastEmailDate = new Date(sortedEmails[0].date);
              }
            }
            
            // Skip if we've emailed in the last 3 days
            if (lastEmailDate && 
                (new Date().getTime() - lastEmailDate.getTime()) < 3 * 24 * 60 * 60 * 1000) {
              console.log(`Skipping follow-up for lead ${lead.id} - recently contacted`);
            } else {
              // TODO: Implement automatic follow-up email generation and sending
              // For now, just create a task
              await storage.createTask({
                userId,
                title: `Follow up with lead: ${lead.name}`,
                description: `This lead is due for follow-up. Last contact date: ${lead.lastContactDate || 'Unknown'}`,
                priority: lead.priority || 'medium',
                dueDate: new Date(),
                assignedTo: 'me',
                estimatedTime: 15,
                aiGenerated: true,
                completed: false,
                leadId: lead.id
              });
              
              // Update next contact date (default to 14 days from now)
              await storage.updateLead(userId, lead.id, {
                nextContactDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                updatedAt: new Date()
              });
              
              followUpSent++;
            }
          } catch (error: any) {
            // Handle Google account not connected error gracefully
            if (error.message && error.message.includes('Google account not connected')) {
              console.log(`User ${userId} doesn't have Google account connected. Creating follow-up task anyway.`);
              
              // Create follow-up task even without email information
              await storage.createTask({
                userId,
                title: `Follow up with lead: ${lead.name}`,
                description: `This lead is due for follow-up. Last contact date: ${lead.lastContactDate || 'Unknown'}`,
                priority: lead.priority || 'medium',
                dueDate: new Date(),
                assignedTo: 'me',
                estimatedTime: 15,
                aiGenerated: true,
                completed: false,
                leadId: lead.id
              });
              
              // Update next contact date (default to 14 days from now)
              await storage.updateLead(userId, lead.id, {
                nextContactDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                updatedAt: new Date()
              });
              
              followUpSent++;
            } else {
              // For other errors, log and continue
              console.error(`Error fetching emails for lead ${lead.id}:`, error);
            }
          }
        }
        
        processed++;
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        errors++;
      }
    }
    
    console.log(`Completed lead processing for user ${userId}:`, { processed, priorityUpdated, followUpSent, errors });
    
    return { processed, priorityUpdated, followUpSent, errors };
  } catch (error) {
    console.error(`Error processing leads for user ${userId}:`, error);
    return { processed: 0, priorityUpdated: 0, followUpSent: 0, errors: 1 };
  }
}

/**
 * Process leads for all users
 */
export async function processLeadsForAllUsers() {
  try {
    const users = await storage.getAllUsers();
    
    let usersProcessed = 0;
    let leadsProcessed = 0;
    let priorityUpdates = 0;
    let followUpsSent = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        const result = await processLeadsForUser(user.id);
        
        usersProcessed++;
        leadsProcessed += result.processed;
        priorityUpdates += result.priorityUpdated;
        followUpsSent += result.followUpSent;
        errors += result.errors;
      } catch (error) {
        console.error(`Error processing leads for user ${user.id}:`, error);
        errors++;
      }
    }
    
    return {
      usersProcessed,
      leadsProcessed,
      priorityUpdates,
      followUpsSent,
      errors
    };
  } catch (error) {
    console.error('Error processing leads for all users:', error);
    return {
      usersProcessed: 0,
      leadsProcessed: 0,
      priorityUpdates: 0,
      followUpsSent: 0,
      errors: 1
    };
  }
}