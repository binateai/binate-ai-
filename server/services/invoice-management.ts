import { storage } from "../storage";
import { extractInvoiceRequestFromEmail } from "../ai-service";
// Removed Slack service import as it's no longer needed

/**
 * Check for overdue invoices for a user
 */
export async function checkOverdueInvoices(userId: number, sendNotifications = false) {
  try {
    // Get all invoices for the user
    const invoices = await storage.getInvoicesByUserId(userId);
    const now = new Date();
    
    // Filter for overdue invoices
    const overdueInvoices = invoices.filter(invoice => {
      // Skip paid or draft invoices
      if (invoice.status === 'paid' || invoice.status === 'draft') {
        return false;
      }
      
      // Check if due date is past
      if (!invoice.dueDate) {
        return false;
      }
      
      const dueDate = new Date(invoice.dueDate);
      return dueDate < now;
    });
    
    // Slack notifications have been completely disabled
    // Email notifications are handled separately in the invoice follow-up process
    if (sendNotifications && overdueInvoices.length > 0) {
      console.log(`Found ${overdueInvoices.length} overdue invoices for user ${userId} that need email notifications`);
      // No notifications are sent from this function anymore, parameter is kept for compatibility
    }
    
    return overdueInvoices;
  } catch (error) {
    console.error(`Error checking overdue invoices for user ${userId}:`, error);
    return [];
  }
}

/**
 * Process emails to detect invoice requests
 */
export async function detectInvoiceRequests(userId: number) {
  try {
    console.log(`Processing emails for user ${userId} to detect invoice requests`);
    
    // Get unprocessed emails
    const { getUnprocessedEmailsForInvoiceDetection, markEmailProcessedForInvoiceDetection } = await import('./gmail');
    const emails = await getUnprocessedEmailsForInvoiceDetection(userId);
    
    if (!emails.length) {
      console.log(`No unprocessed emails found for invoice detection for user ${userId}`);
      return 0;
    }
    
    let invoicesCreated = 0;
    
    // Process each email
    for (const email of emails) {
      // Skip emails that don't appear to be invoice related
      const invoiceKeywords = ['invoice', 'payment', 'bill', 'charge', 'fee', 'service', 'project', 'work', 'contract'];
      const isInvoiceRelated = invoiceKeywords.some(keyword => 
        email.subject?.toLowerCase().includes(keyword) || 
        email.body?.toLowerCase().includes(keyword)
      );
      
      if (!isInvoiceRelated || !email.body || email.body.trim().length < 30) {
        await markEmailProcessedForInvoiceDetection(userId, email.id);
        continue;
      }
      
      // Extract invoice request details
      const emailContent = `
        From: ${email.from}
        Subject: ${email.subject}
        Date: ${email.date ? new Date(email.date).toISOString() : 'Unknown'}
        
        ${email.body}
      `;
      
      const invoiceData = await extractInvoiceRequestFromEmail(emailContent);
      
      if (invoiceData && invoiceData.items && invoiceData.items.length > 0) {
        // Generate invoice number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const invoiceNumber = `INV-${year}${month}-${random}`;
        
        // Calculate total amount
        const totalAmount = invoiceData.items.reduce((sum, item) => sum + item.total, 0);
        
        // Create the invoice
        await storage.createInvoice({
          userId,
          number: invoiceNumber,
          client: invoiceData.clientName || email.from || 'Client',
          amount: totalAmount,
          status: 'draft',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
          items: invoiceData.items,
          remindersSent: 0,
          taxRate: 0, // Default no tax
          currency: 'USD', // Default USD
          notes: invoiceData.notes || `Invoice created automatically based on email from ${email.from}`
        });
        
        invoicesCreated++;
        
        // Create a task to review the invoice
        await storage.createTask({
          userId,
          title: `Review invoice ${invoiceNumber} for ${invoiceData.clientName || email.from || 'Client'}`,
          description: `This invoice was automatically generated from an email. Please review and send it.`,
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 1 day
          assignedTo: 'me',
          estimatedTime: 15,
          aiGenerated: true,
          completed: false,
          source: 'email',
          sourceId: email.id
        });
      }
      
      // Mark the email as processed
      await markEmailProcessedForInvoiceDetection(userId, email.id);
    }
    
    console.log(`Created ${invoicesCreated} invoices from emails for user ${userId}`);
    return invoicesCreated;
  } catch (error) {
    console.error(`Error detecting invoice requests from emails for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Get all pending invoices that should be sent soon
 */
export async function getPendingInvoices(userId: number) {
  try {
    // Get all invoices for the user
    const invoices = await storage.getInvoicesByUserId(userId);
    
    // Filter for draft invoices
    return invoices.filter(invoice => invoice.status === 'draft');
  } catch (error) {
    console.error(`Error getting pending invoices for user ${userId}:`, error);
    return [];
  }
}