/**
 * Email Sender Service
 * 
 * This service handles sending various types of emails including
 * notifications, invoices, and reminders.
 */

import { storage } from '../storage';
import { sendEmail } from './gmail'; // Fixed import name
import { generateInvoiceHtml } from './invoice-html-generator'; // Fixed import name

/**
 * Send a notification email to a user
 */
export async function sendEmailNotification(
  user: any,
  subject: string,
  content: string,
  options: {
    isHtml?: boolean;
    includeTasks?: any[];
    includeMeetings?: any[];
    includeInvoices?: boolean;
  } = {}
): Promise<any> {
  try {
    if (!user || !user.email) {
      throw new Error('User email is required');
    }
    
    // Format content based on whether it's HTML or plain text
    let emailBody = options.isHtml ? content : `<p>${content.replace(/\n/g, '<br/>')}</p>`;
    
    // Add tasks if provided
    if (options.includeTasks && options.includeTasks.length > 0) {
      emailBody += `
        <h3>Tasks</h3>
        <ul>
      `;
      
      for (const task of options.includeTasks) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        emailBody += `
          <li>
            <strong>${task.title}</strong>
            ${task.priority ? ` (${task.priority})` : ''}
            - Due: ${dueDate}
          </li>
        `;
      }
      
      emailBody += `</ul>`;
    }
    
    // Add meetings if provided
    if (options.includeMeetings && options.includeMeetings.length > 0) {
      emailBody += `
        <h3>Upcoming Meetings</h3>
        <ul>
      `;
      
      for (const meeting of options.includeMeetings) {
        const startTime = meeting.startTime ? new Date(meeting.startTime).toLocaleString() : 'Time not specified';
        emailBody += `
          <li>
            <strong>${meeting.title}</strong>
            - ${startTime}
            ${meeting.location ? `<br/>Location: ${meeting.location}` : ''}
            ${meeting.meetingUrl ? `<br/><a href="${meeting.meetingUrl}">Join Meeting</a>` : ''}
          </li>
        `;
      }
      
      emailBody += `</ul>`;
    }
    
    // Format the complete email
    const fullHtmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1, h2, h3 { color: #2a6399; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 10px; }
            .priority-high { color: #d9534f; }
            .priority-medium { color: #f0ad4e; }
            .priority-low { color: #5bc0de; }
          </style>
        </head>
        <body>
          <div class="container">
            ${emailBody}
            <div class="footer">
              <p>
                This email was sent by Binate AI, your intelligent executive assistant.
                <br/>
                © ${new Date().getFullYear()} Binate AI
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const emailResult = await sendEmail(user.id, {
      to: user.email,
      subject,
      html: fullHtmlContent
    });
    
    // Log the email
    await storage.createEmailLog({
      userId: user.id,
      type: 'notification',
      recipient: user.email,
      subject,
      status: emailResult ? 'sent' : 'failed',
      metadata: JSON.stringify({
        includedTasks: options.includeTasks ? options.includeTasks.length : 0,
        includedMeetings: options.includeMeetings ? options.includeMeetings.length : 0,
        includedInvoices: options.includeInvoices
      })
    });
    
    return emailResult;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}

/**
 * Send a plain text email
 */
export async function sendPlainEmail(
  userId: number,
  recipient: string,
  subject: string,
  body: string
): Promise<any> {
  try {
    // Get user info to verify permissions
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Format the email content
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="white-space: pre-wrap;">${body}</div>
            <div class="footer">
              <p>
                Sent via Binate AI by ${user.fullName || user.username}
                <br/>
                © ${new Date().getFullYear()} Binate AI
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const emailResult = await sendEmail(userId, {
      to: recipient,
      subject,
      html: htmlContent
    });
    
    // Log the email
    await storage.createEmailLog({
      userId,
      type: 'plain',
      recipient,
      subject,
      status: emailResult ? 'sent' : 'failed'
    });
    
    return emailResult;
  } catch (error) {
    console.error('Error sending plain email:', error);
    throw error;
  }
}

/**
 * Send an invoice email
 */
export async function sendInvoiceEmail(
  user: any,
  invoice: any,
  recipientEmail: string
): Promise<any> {
  try {
    if (!user || !user.id) {
      throw new Error('Valid user is required');
    }
    
    if (!invoice || !invoice.id || !invoice.number) {
      throw new Error('Valid invoice is required');
    }
    
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }
    
    // Generate invoice HTML
    const userPreferences = user.preferences ? 
      (typeof user.preferences === 'string' ? 
        JSON.parse(user.preferences) : user.preferences) 
      : {};
      
    // Get invoice items
    const invoiceItems = invoice.items ? 
      (typeof invoice.items === 'string' ? 
        JSON.parse(invoice.items) : invoice.items) 
      : [];
    
    // Prepare invoice data
    const invoiceData = {
      number: invoice.number,
      client: invoice.client,
      date: invoice.issueDate || new Date(),
      dueDate: invoice.dueDate,
      items: invoiceItems,
      notes: invoice.notes || '',
      taxRate: invoice.taxRate || 0,
      currency: userPreferences.currency || 'USD',
    };
    
    // Generate invoice HTML
    const invoiceHtml = await generateInvoiceHtml(invoiceData);
    // Removed user preferences parameter because the function only accepts one parameter
    
    // Prepare email content
    let emailContent = `
      <p>Dear ${invoice.client},</p>
      
      <p>Please find attached the invoice #${invoice.number} for your recent services.</p>
      
      <p>The total amount due is ${formatCurrency(invoice.amount, userPreferences.currency || 'USD')}${invoice.dueDate ? `, due on ${formatDate(invoice.dueDate)}` : ''}.</p>
      
      <p>If you have any questions regarding this invoice, please don't hesitate to contact me.</p>
      
      <p>Thank you for your business!</p>
      
      <p>
        Best regards,<br/>
        ${user.fullName || user.username}
      </p>
    `;
    
    // Prepare full HTML email
    const fullHtmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1, h2, h3 { color: #2a6399; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .invoice-container { margin: 30px 0; padding: 20px; border: 1px solid #eee; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${emailContent}
            
            <div class="invoice-container">
              ${invoiceHtml}
            </div>
            
            <div class="footer">
              <p>
                © ${new Date().getFullYear()} ${user.fullName || user.username}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const emailResult = await sendEmail(user.id, {
      to: recipientEmail,
      subject: `Invoice #${invoice.number} from ${user.fullName || user.username}`,
      html: fullHtmlContent
    });
    
    // Log the email
    await storage.createEmailLog({
      userId: user.id,
      type: 'invoice',
      recipient: recipientEmail,
      subject: `Invoice #${invoice.number}`,
      status: emailResult ? 'sent' : 'failed',
      metadata: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: invoice.amount
      })
    });
    
    return emailResult;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

/**
 * Send a payment reminder email
 */
export async function sendPaymentReminder(
  user: any,
  invoice: any,
  recipientEmail: string
): Promise<any> {
  try {
    if (!user || !user.id) {
      throw new Error('Valid user is required');
    }
    
    if (!invoice || !invoice.id || !invoice.number) {
      throw new Error('Valid invoice is required');
    }
    
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }
    
    // Get user preferences
    const userPreferences = user.preferences ? 
      (typeof user.preferences === 'string' ? 
        JSON.parse(user.preferences) : user.preferences) 
      : {};
    
    // Calculate days past due
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date();
    const now = new Date();
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Import AI service for generating follow-up email
    const { generateInvoiceFollowUpEmail } = await import('../ai-service');
    
    // Extract invoice data for the follow-up email
    const invoiceData = {
      clientName: invoice.client,
      totalAmount: invoice.amount,
      currency: userPreferences.currency || 'USD',
      dueDate: dueDate.toISOString().split('T')[0]
    };
    
    // Generate the follow-up email content
    const emailBody = await generateInvoiceFollowUpEmail(
      invoiceData,
      invoice.number,
      daysPastDue,
      {
        fullName: user.fullName || user.username,
        email: user.email,
        ...userPreferences
      }
    );
    
    // Format the complete email
    const fullHtmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1, h2, h3 { color: #2a6399; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="white-space: pre-wrap;">${emailBody}</div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${user.fullName || user.username}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const emailResult = await sendEmail(user.id, {
      to: recipientEmail,
      subject: `Payment Reminder: Invoice #${invoice.number}`,
      html: fullHtmlContent
    });
    
    // Log the email
    await storage.createEmailLog({
      userId: user.id,
      type: 'invoice_reminder',
      recipient: recipientEmail,
      subject: `Payment Reminder: Invoice #${invoice.number}`,
      status: emailResult ? 'sent' : 'failed',
      metadata: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: invoice.amount,
        daysPastDue
      })
    });
    
    return emailResult;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    throw error;
  }
}

/**
 * Format a date string
 */
function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a currency string
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}