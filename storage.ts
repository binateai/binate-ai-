import { 
  User, InsertUser, 
  Task, InsertTask, 
  Email, InsertEmail,
  Event, InsertEvent, 
  Invoice, InsertInvoice,
  Lead, InsertLead,
  ConnectedService, InsertConnectedService,
  UserPreferences,
  AIChat, InsertAIChat, 
  AIMessage, InsertAIMessage, AIStoredMessage,
  Expense, InsertExpense,
  UserSettings, InsertUserSettings,
  SentEmail, InsertSentEmail,
  BetaSignup, InsertBetaSignup,
  PendingEmailReply, InsertPendingEmailReply,
  ActivityLog, InsertActivityLog,
  slackIntegrations, insertSlackIntegrationSchema,
  users, tasks, emails, events, invoices, leads, connectedServices,
  aiChats, aiMessages, expenses, userSettings, sentEmails, betaSignups, pendingEmailReplies, activityLog
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<User>;
  updateUserLastEmailSyncDate(userId: number, date: Date): Promise<boolean>;
  
  // Slack integration methods
  getSlackIntegration(userId: number): Promise<any>;
  saveSlackIntegration(userId: number, data: any): Promise<void>;
  updateSlackIntegration(userId: number, data: Partial<any>): Promise<void>;
  deleteSlackIntegration(userId: number): Promise<boolean>;
  getDefaultSlackChannel(userId: number): Promise<string | undefined>;
  setDefaultSlackChannel(userId: number, channelId: string): Promise<boolean>;
  
  // Email integration methods
  getEmailIntegration(userId: number, provider: string): Promise<any>;
  storeEmailIntegration(userId: number, provider: string, credentials: string): Promise<void>;
  updateEmailIntegration(userId: number, provider: string, credentials: string): Promise<void>;
  deleteEmailIntegration(userId: number, provider: string): Promise<boolean>;
  
  // Email logging
  createEmailLog(emailLog: {
    userId: number;
    type: string;
    recipient: string;
    subject: string;
    status: string;
    metadata?: string;
  }): Promise<any>;
  
  // Lead methods
  getLeadsByUserId(userId: number): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(userId: number, leadId: number, updates: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(userId: number, leadId: number): Promise<boolean>;
  
  // Email methods
  getEmailsByUserId(userId: number, options?: { limit?: number, unreadOnly?: boolean }): Promise<Email[]>;
  getEmail(id: number): Promise<Email | undefined>;
  getEmailByMessageId(userId: number, messageId: string): Promise<Email | undefined>;
  createOrUpdateEmail(email: Email): Promise<Email>;
  updateEmail(userId: number, emailId: number, updates: Partial<Email>): Promise<Email | undefined>;
  deleteEmail(userId: number, emailId: number): Promise<boolean>;
  
  // Autonomous Engine and Tracking methods
  createEmailLog(log: { userId: number, type: string, recipient: string, subject: string, status: string, metadata?: string }): Promise<any>;
  getLastDailySummaryDate(userId: number): Promise<Date | null>;
  updateDailySummaryDate(userId: number): Promise<boolean>;
  getLastTaskReminderDate(userId: number): Promise<Date | null>;
  updateTaskReminderDate(userId: number): Promise<boolean>;
  getUpcomingEvents(userId: number, hours: number): Promise<Event[]>;
  getOverdueInvoices(userId: number): Promise<Invoice[]>;
  // Access to raw emails data (for fallback only)
  getEmails(): Map<number, Email>;
  
  // Activity log methods
  getActivityLog(userId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Sent Email methods
  getSentEmailsByUserId(userId: number, options?: { limit?: number, type?: string }): Promise<SentEmail[]>;
  getSentEmail(id: number): Promise<SentEmail | undefined>;
  createSentEmail(sentEmail: InsertSentEmail): Promise<SentEmail>;
  updateSentEmail(userId: number, sentEmailId: number, updates: Partial<SentEmail>): Promise<SentEmail | undefined>;
  
  // Pending Email Reply methods (semi-autonomous mode)
  createPendingEmailReply(data: InsertPendingEmailReply): Promise<PendingEmailReply>;
  getPendingEmailReplies(userId: number): Promise<PendingEmailReply[]>;
  getPendingEmailReply(id: number): Promise<PendingEmailReply | undefined>;
  updatePendingEmailReply(id: number, data: Partial<PendingEmailReply>): Promise<PendingEmailReply | undefined>;
  deletePendingEmailReply(id: number): Promise<boolean>;
  
  // Task methods
  getTasksByUserId(userId: number): Promise<Task[]>;
  getTasksByLeadId(userId: number, leadId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(userId: number, taskId: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(userId: number, taskId: number): Promise<boolean>;
  
  // Event methods
  getEventsByUserId(userId: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(userId: number, eventId: number, updates: Partial<Event>): Promise<Event | undefined>;
  
  // Invoice methods
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  getInvoicesByLeadId(userId: number, leadId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  
  // Connected services methods
  getConnectedServicesByUserId(userId: number): Promise<ConnectedService[]>;
  getConnectedService(userId: number, service: string): Promise<ConnectedService | undefined>;
  updateConnectedService(
    userId: number, 
    service: string, 
    updates: Partial<InsertConnectedService>
  ): Promise<ConnectedService>;
  
  // AI Chat methods
  getAIChatsByUserId(userId: number): Promise<AIChat[]>;
  getAIChat(id: number): Promise<AIChat | undefined>;
  createAIChat(chat: InsertAIChat): Promise<AIChat>;
  updateAIChat(userId: number, chatId: number, updates: Partial<AIChat>): Promise<AIChat | undefined>;
  deleteAIChat(userId: number, chatId: number): Promise<boolean>;
  
  // AI Message methods
  getAIMessagesByChatId(chatId: number): Promise<AIMessage[]>;
  createAIMessage(message: InsertAIMessage): Promise<AIMessage>;
  
  // Expense methods
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(userId: number, expenseId: number, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(userId: number, expenseId: number): Promise<boolean>;
  
  // User Settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings>;
  
  // Pending Email Reply methods (semi-autonomous mode)
  createPendingEmailReply(data: InsertPendingEmailReply): Promise<PendingEmailReply>;
  getPendingEmailReplies(userId: number): Promise<PendingEmailReply[]>;
  getPendingEmailReply(id: number): Promise<PendingEmailReply | undefined>;
  updatePendingEmailReply(id: number, data: Partial<PendingEmailReply>): Promise<PendingEmailReply | undefined>;
  deletePendingEmailReply(id: number): Promise<boolean>;
  
  // Beta Signup methods
  getBetaSignups(): Promise<BetaSignup[]>;
  getBetaSignupByEmail(email: string): Promise<BetaSignup | undefined>;
  createBetaSignup(signup: InsertBetaSignup): Promise<BetaSignup>;
  updateBetaSignup(id: number, updates: Partial<BetaSignup>): Promise<BetaSignup | undefined>;
  
  // Slack integration methods
  getSlackIntegration(userId: number): Promise<any | undefined>;
  getAllSlackIntegrations(userId: number): Promise<any[]>;
  getSlackIntegrationByClient(userId: number, clientId: number): Promise<any | undefined>;
  getDefaultSlackIntegration(userId: number): Promise<any | undefined>;
  saveSlackIntegration(userId: number, data: any): Promise<any>;
  updateSlackIntegration(id: number, data: Partial<any>): Promise<void>;
  deleteSlackIntegration(id: number): Promise<boolean>;
  
  // Email integration methods
  getEmailIntegration(userId: number, provider: string): Promise<any>;
  storeEmailIntegration(userId: number, provider: string, credentials: string): Promise<void>;
  updateEmailIntegration(userId: number, provider: string, credentials: string): Promise<void>;
  deleteEmailIntegration(userId: number, provider: string): Promise<boolean>;
  updateUserLastEmailSyncDate(userId: number, date: Date): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private emails: Map<number, Email>;
  private emailsByMessageId: Map<string, Email>;
  private tasks: Map<number, Task>;
  private events: Map<number, Event>;
  private invoices: Map<number, Invoice>;
  private leads: Map<number, Lead>;
  private connectedServices: Map<string, ConnectedService>;
  private aiChats: Map<number, AIChat>;
  private aiMessages: Map<number, AIMessage>;
  private expenses: Map<number, Expense>;
  private userSettings: Map<number, UserSettings>;
  private sentEmails: Map<number, SentEmail>;
  private betaSignups: Map<number, BetaSignup>;
  private betaSignupsByEmail: Map<string, BetaSignup>;
  private pendingEmailReplies: Map<number, PendingEmailReply>;
  private slackIntegrations: Map<number, any>;
  sessionStore: session.SessionStore;
  
  // Helper method to directly access the internal emails map for fallback purposes
  getEmails(): Map<number, Email> {
    return this.emails;
  }
  
  private userIdCounter: number;
  private emailIdCounter: number;
  private taskIdCounter: number;
  private eventIdCounter: number;
  private invoiceIdCounter: number;
  private leadIdCounter: number;
  private serviceIdCounter: number;
  private chatIdCounter: number;
  private messageIdCounter: number;
  private expenseIdCounter: number;
  private userSettingsIdCounter: number;
  private sentEmailIdCounter: number;
  private betaSignupIdCounter: number;
  private emailLogs: Map<number, any>;
  private emailLogIdCounter: number;
  private pendingEmailReplyIdCounter: number;

  constructor() {
    this.users = new Map();
    this.emails = new Map();
    this.emailsByMessageId = new Map();
    this.tasks = new Map();
    this.events = new Map();
    this.invoices = new Map();
    this.leads = new Map();
    this.connectedServices = new Map();
    this.aiChats = new Map();
    this.aiMessages = new Map();
    this.expenses = new Map();
    this.userSettings = new Map();
    this.sentEmails = new Map();
    this.betaSignups = new Map();
    this.betaSignupsByEmail = new Map();
    this.emailLogs = new Map();
    this.pendingEmailReplies = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    this.userIdCounter = 1;
    this.emailIdCounter = 1;
    this.taskIdCounter = 1;
    this.eventIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.leadIdCounter = 1;
    this.serviceIdCounter = 1;
    this.chatIdCounter = 1;
    this.messageIdCounter = 1;
    this.expenseIdCounter = 1;
    this.userSettingsIdCounter = 1;
    this.sentEmailIdCounter = 1;
    this.betaSignupIdCounter = 1;
    this.emailLogIdCounter = 1;
    this.pendingEmailReplyIdCounter = 1;
    
    // Create a default test user
    this.createUser({
      username: "shaima123",
      // This is "testpassword" hashed with our algorithm
      password: "8fc2ce73bc85d33b61b827d56301c8bf5972204d2aa54b9ae499538e843e3fb04cf7e4d4d97c61ed1612a2cefc0a534db6fb681a8c1e06c7a55b8a1981a0d0de.43a08f69cd46e92d",
      email: "shaima@binate.ai",
      fullName: "Shaima Ahmed"
    }).then((user) => {
      console.log("Created test user:", user.username);
      
      // Add a Google connected service
      this.updateConnectedService(user.id, "google", {
        connected: true,
        credentials: {
          refresh_token: "dummy-token"
        }
      });
      
      // Add some sample tasks
      this.createTask({
        userId: user.id,
        title: "Complete project proposal",
        description: "Finish the draft and send to client",
        dueDate: new Date("2025-04-26"),
        priority: "high",
        completed: false,
        aiGenerated: false
      });
      
      this.createTask({
        userId: user.id,
        title: "Schedule team meeting",
        description: "Discuss Q2 goals with the team",
        dueDate: new Date("2025-04-22"),
        priority: "medium",
        completed: false,
        aiGenerated: false
      });
      
      // Add a sample calendar event
      this.createEvent({
        userId: user.id,
        title: "Client Meeting",
        description: "Discuss project requirements",
        startTime: new Date("2025-04-20T10:00:00"),
        endTime: new Date("2025-04-20T11:00:00"),
        location: "Virtual",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        attendees: ["client@example.com", "team@binate.ai"]
      });
      
      // Add a sample invoice
      this.createInvoice({
        userId: user.id,
        number: "INV-2025-001",
        client: "Acme Corp",
        amount: 2500,
        status: "pending",
        dueDate: new Date("2025-05-01"),
        items: [
          {
            description: "Website Development",
            quantity: 1,
            unitPrice: 2500,
            total: 2500
          }
        ]
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      preferences: {
        emailNotifications: true,
        darkMode: false,
        aiResponseStyle: "friendly"
      },
      avatar: '',
      stripeCustomerId: '',
      googleRefreshToken: ''
    };
    this.users.set(id, user);
    
    // Create default connected services
    this.updateConnectedService(id, 'google', { connected: false, credentials: {} });
    this.updateConnectedService(id, 'stripe', { connected: false, credentials: {} });
    
    return user;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Don't allow updating the id or password through this method
    const { id, password, ...allowedUpdates } = updates;
    
    const updatedUser = {
      ...user,
      ...allowedUpdates
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences
      }
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Get all users method for notification scheduler
  async getUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users);
      return result;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // Email methods
  async getEmailsByUserId(userId: number, options: { limit?: number, unreadOnly?: boolean } = {}): Promise<Email[]> {
    let emails = Array.from(this.emails.values()).filter(
      (email) => email.userId === userId
    );
    
    if (options.unreadOnly) {
      emails = emails.filter(email => !email.isRead);
    }
    
    // Sort by date descending (newest first)
    emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (options.limit) {
      emails = emails.slice(0, options.limit);
    }
    
    return emails;
  }

  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async getEmailByMessageId(userId: number, messageId: string): Promise<Email | undefined> {
    return this.emailsByMessageId.get(messageId);
  }

  async createOrUpdateEmail(email: Email): Promise<Email> {
    // If the email already exists by messageId, update it
    const existingEmail = this.emailsByMessageId.get(email.messageId);
    
    if (existingEmail) {
      const updatedEmail = {
        ...existingEmail,
        ...email,
        updatedAt: new Date()
      };
      
      this.emails.set(updatedEmail.id, updatedEmail);
      this.emailsByMessageId.set(updatedEmail.messageId, updatedEmail);
      
      return updatedEmail;
    }
    
    // Otherwise create a new email
    const id = this.emailIdCounter++;
    const newEmail: Email = {
      ...email,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.emails.set(id, newEmail);
    this.emailsByMessageId.set(newEmail.messageId, newEmail);
    
    return newEmail;
  }

  async updateEmail(userId: number, emailId: number, updates: Partial<Email>): Promise<Email | undefined> {
    const email = this.emails.get(emailId);
    
    if (!email || email.userId !== userId) {
      return undefined;
    }
    
    const updatedEmail = {
      ...email,
      ...updates,
      updatedAt: new Date()
    };
    
    this.emails.set(emailId, updatedEmail);
    this.emailsByMessageId.set(updatedEmail.messageId, updatedEmail);
    
    return updatedEmail;
  }

  async deleteEmail(userId: number, emailId: number): Promise<boolean> {
    const email = this.emails.get(emailId);
    
    if (!email || email.userId !== userId) {
      return false;
    }
    
    this.emailsByMessageId.delete(email.messageId);
    return this.emails.delete(emailId);
  }

  // Task methods
  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }
  
  async getTasksByLeadId(userId: number, leadId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && task.leadId === leadId,
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = {
      ...task,
      id,
      completed: false
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(userId: number, taskId: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    
    if (!task || task.userId !== userId) {
      return undefined;
    }
    
    const updatedTask = {
      ...task,
      ...updates,
    };
    
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  async deleteTask(userId: number, taskId: number): Promise<boolean> {
    const task = this.tasks.get(taskId);
    
    if (!task || task.userId !== userId) {
      return false;
    }
    
    return this.tasks.delete(taskId);
  }

  // Event methods
  async getEventsByUserId(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.userId === userId,
    );
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    // Get current timestamp as ISO string
    const timestamp = new Date().toISOString();
    
    // Create the new event with string timestamps
    const newEvent: Event = {
      ...event,
      id,
      aiNotes: '',
      emailId: event.emailId,
      // Use string dates directly
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  async updateEvent(userId: number, eventId: number, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(eventId);
    
    if (!event || event.userId !== userId) {
      return undefined;
    }
    
    const updatedEvent = {
      ...event,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }

  // Invoice methods
  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.userId === userId,
    );
  }
  
  async getInvoicesByLeadId(userId: number, leadId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.userId === userId && invoice.leadId === leadId,
    );
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const issueDate = new Date();
    const newInvoice: Invoice = {
      ...invoice,
      id,
      issueDate
    };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }
  
  async updateInvoice(userId: number, invoiceId: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(invoiceId);
    
    if (!invoice || invoice.userId !== userId) {
      return undefined;
    }
    
    const updatedInvoice: Invoice = {
      ...invoice,
      ...updates
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
    return updatedInvoice;
  }

  // Lead methods
  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.userId === userId
    );
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.leadIdCounter++;
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: lead.tags || [],
      metadata: lead.metadata || {}
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  async updateLead(userId: number, leadId: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(leadId);
    
    if (!lead || lead.userId !== userId) {
      return undefined;
    }
    
    const updatedLead = {
      ...lead,
      ...updates,
      updatedAt: new Date()
    };
    
    this.leads.set(leadId, updatedLead);
    return updatedLead;
  }

  async deleteLead(userId: number, leadId: number): Promise<boolean> {
    const lead = this.leads.get(leadId);
    
    if (!lead || lead.userId !== userId) {
      return false;
    }
    
    return this.leads.delete(leadId);
  }

  // Connected services methods
  async getConnectedServicesByUserId(userId: number): Promise<ConnectedService[]> {
    return Array.from(this.connectedServices.values()).filter(
      (service) => service.userId === userId,
    );
  }

  async getConnectedService(userId: number, serviceName: string): Promise<ConnectedService | undefined> {
    const key = `${userId}-${serviceName}`;
    return this.connectedServices.get(key);
  }

  async updateConnectedService(
    userId: number, 
    serviceName: string, 
    updates: Partial<InsertConnectedService>
  ): Promise<ConnectedService> {
    const key = `${userId}-${serviceName}`;
    const existing = this.connectedServices.get(key);
    
    // For better debugging, log the update
    console.log(`Updating ${serviceName} connection for user ${userId} (MemStorage):`, 
      updates.connected !== undefined ? `connected: ${updates.connected}` : '',
      updates.lastError !== undefined ? `error: ${updates.lastError}` : '');
    
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        lastSynced: new Date(),
        lastUpdated: new Date()
      };
      this.connectedServices.set(key, updated);
      return updated;
    } else {
      console.log(`Creating new ${serviceName} connection for user ${userId} (MemStorage)`);
      
      const newId = this.serviceIdCounter++;
      const service: ConnectedService = {
        id: newId,
        userId,
        service: serviceName,
        connected: updates.connected || false,
        credentials: updates.credentials || {},
        username: updates.username || null,
        displayName: updates.displayName || null,
        lastError: updates.lastError || null,
        lastSynced: new Date(),
        lastUpdated: new Date()
      };
      this.connectedServices.set(key, service);
      return service;
    }
  }

  // AI Chat methods
  async getAIChatsByUserId(userId: number): Promise<AIChat[]> {
    return Array.from(this.aiChats.values()).filter(
      (chat) => chat.userId === userId
    );
  }

  async getAIChat(id: number): Promise<AIChat | undefined> {
    return this.aiChats.get(id);
  }

  async createAIChat(chat: InsertAIChat): Promise<AIChat> {
    const id = this.chatIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newChat: AIChat = {
      ...chat,
      id,
      createdAt,
      updatedAt,
      pinned: chat.pinned || false
    };
    
    this.aiChats.set(id, newChat);
    return newChat;
  }

  async updateAIChat(userId: number, chatId: number, updates: Partial<AIChat>): Promise<AIChat | undefined> {
    const chat = this.aiChats.get(chatId);
    
    if (!chat || chat.userId !== userId) {
      return undefined;
    }
    
    const updatedChat = {
      ...chat,
      ...updates,
      updatedAt: new Date()
    };
    
    this.aiChats.set(chatId, updatedChat);
    return updatedChat;
  }

  async deleteAIChat(userId: number, chatId: number): Promise<boolean> {
    const chat = this.aiChats.get(chatId);
    
    if (!chat || chat.userId !== userId) {
      return false;
    }
    
    // Delete all messages associated with this chat
    Array.from(this.aiMessages.entries())
      .filter(([_, message]) => message.chatId === chatId)
      .forEach(([messageId, _]) => this.aiMessages.delete(messageId));
    
    return this.aiChats.delete(chatId);
  }

  // AI Message methods
  async getAIMessagesByChatId(chatId: number): Promise<AIMessage[]> {
    return Array.from(this.aiMessages.values())
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return a.timestamp.getTime() - b.timestamp.getTime();
        }
        return 0;
      });
  }

  async createAIMessage(message: InsertAIMessage): Promise<AIMessage> {
    const id = this.messageIdCounter++;
    const timestamp = new Date();
    
    const newMessage: AIMessage = {
      ...message,
      id,
      timestamp
    };
    
    this.aiMessages.set(id, newMessage);
    
    // Update the chat's updatedAt timestamp
    const chat = this.aiChats.get(message.chatId);
    if (chat) {
      this.updateAIChat(chat.userId, chat.id, {});
    }
    
    return newMessage;
  }
  
  // Expense methods
  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId
    );
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    const newExpense: Expense = {
      ...expense,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async updateExpense(userId: number, expenseId: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(expenseId);
    
    if (!expense || expense.userId !== userId) {
      return undefined;
    }
    
    const updatedExpense = {
      ...expense,
      ...updates,
      updatedAt: new Date()
    };
    
    this.expenses.set(expenseId, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(userId: number, expenseId: number): Promise<boolean> {
    const expense = this.expenses.get(expenseId);
    
    if (!expense || expense.userId !== userId) {
      return false;
    }
    
    return this.expenses.delete(expenseId);
  }
  
  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const id = this.userSettingsIdCounter++;
    const newSettings: UserSettings = {
      ...settings,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userSettings.set(id, newSettings);
    return newSettings;
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings> {
    const settings = Array.from(this.userSettings.values()).find(
      (settings) => settings.userId === userId
    );
    
    if (!settings) {
      // If settings don't exist, create them
      return this.createUserSettings({ 
        userId, 
        ...updates as InsertUserSettings 
      });
    }
    
    const updatedSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date()
    };
    
    this.userSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }
  
  // Sent Email methods
  async getSentEmailsByUserId(userId: number, options: { limit?: number, type?: string } = {}): Promise<SentEmail[]> {
    let sentEmails = Array.from(this.sentEmails.values()).filter(
      (email) => email.userId === userId
    );
    
    if (options.type) {
      sentEmails = sentEmails.filter(email => email.type === options.type);
    }
    
    // Sort by sentAt date descending (newest first)
    sentEmails.sort((a, b) => {
      const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return bTime - aTime;
    });
    
    if (options.limit) {
      sentEmails = sentEmails.slice(0, options.limit);
    }
    
    return sentEmails;
  }

  async getSentEmail(id: number): Promise<SentEmail | undefined> {
    return this.sentEmails.get(id);
  }

  async createSentEmail(sentEmail: InsertSentEmail): Promise<SentEmail> {
    const id = this.sentEmailIdCounter++;
    const now = new Date();
    
    const newSentEmail: SentEmail = {
      ...sentEmail,
      id,
      sentAt: sentEmail.sentAt || now
    };
    
    this.sentEmails.set(id, newSentEmail);
    return newSentEmail;
  }

  async updateSentEmail(userId: number, sentEmailId: number, updates: Partial<SentEmail>): Promise<SentEmail | undefined> {
    const sentEmail = this.sentEmails.get(sentEmailId);
    
    if (!sentEmail || sentEmail.userId !== userId) {
      return undefined;
    }
    
    const updatedSentEmail = {
      ...sentEmail,
      ...updates
    };
    
    this.sentEmails.set(sentEmailId, updatedSentEmail);
    return updatedSentEmail;
  }
  
  // Email logging methods
  async createEmailLog(log: { userId: number, type: string, recipient: string, subject: string, status: string, metadata?: string }): Promise<any> {
    const id = this.emailLogIdCounter++;
    const timestamp = new Date();
    
    const emailLog = {
      id,
      userId: log.userId,
      type: log.type,
      recipient: log.recipient,
      subject: log.subject,
      status: log.status,
      metadata: log.metadata || '',
      timestamp
    };
    
    this.emailLogs.set(id, emailLog);
    return emailLog;
  }
  
  // Autonomic engine methods
  async getLastDailySummaryDate(userId: number): Promise<Date | null> {
    // Get user settings
    const settings = await this.getUserSettings(userId);
    if (!settings) return null;
    
    return settings.lastDailySummaryDate ? new Date(settings.lastDailySummaryDate) : null;
  }
  
  async updateDailySummaryDate(userId: number): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    if (!settings) return false;
    
    await this.updateUserSettings(userId, {
      lastDailySummaryDate: new Date()
    });
    
    return true;
  }
  
  async getLastTaskReminderDate(userId: number): Promise<Date | null> {
    // Get user settings
    const settings = await this.getUserSettings(userId);
    if (!settings) return null;
    
    return settings.lastTaskReminderDate ? new Date(settings.lastTaskReminderDate) : null;
  }
  
  async updateTaskReminderDate(userId: number): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    if (!settings) return false;
    
    await this.updateUserSettings(userId, {
      lastTaskReminderDate: new Date()
    });
    
    return true;
  }
  
  async getUpcomingEvents(userId: number, hours: number): Promise<Event[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const events = await this.getEventsByUserId(userId);
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return eventStart > now && eventStart < cutoff;
    });
  }
  
  async getOverdueInvoices(userId: number): Promise<Invoice[]> {
    const now = new Date();
    const invoices = await this.getInvoicesByUserId(userId);
    
    return invoices.filter(invoice => {
      if (invoice.status === 'paid') return false;
      return invoice.dueDate && new Date(invoice.dueDate) < now;
    });
  }
  
  // Pending Email Reply methods
  async createPendingEmailReply(data: InsertPendingEmailReply): Promise<PendingEmailReply> {
    const id = this.pendingEmailReplyIdCounter++;
    const now = new Date();
    
    const newReply: PendingEmailReply = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      status: data.status || 'pending',
      actionTaken: null,
      actionDate: null
    };
    
    this.pendingEmailReplies.set(id, newReply);
    return newReply;
  }
  
  async getPendingEmailReplies(userId: number): Promise<PendingEmailReply[]> {
    return Array.from(this.pendingEmailReplies.values())
      .filter(reply => reply.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getPendingEmailReply(id: number): Promise<PendingEmailReply | undefined> {
    return this.pendingEmailReplies.get(id);
  }
  
  async updatePendingEmailReply(id: number, data: Partial<PendingEmailReply>): Promise<PendingEmailReply | undefined> {
    const reply = this.pendingEmailReplies.get(id);
    
    if (!reply) {
      return undefined;
    }
    
    const updatedReply: PendingEmailReply = {
      ...reply,
      ...data,
      updatedAt: new Date()
    };
    
    this.pendingEmailReplies.set(id, updatedReply);
    return updatedReply;
  }
  
  async deletePendingEmailReply(id: number): Promise<boolean> {
    return this.pendingEmailReplies.delete(id);
  }
}

// DatabaseStorage that implements IStorage with Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  private emailCache: Map<number, Email> = new Map();
  
  // Lead methods
  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    try {
      const result = await db.select().from(leads).where(eq(leads.userId, userId));
      return result;
    } catch (error) {
      console.error('Error fetching leads by userId:', error);
      return [];
    }
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    try {
      const [result] = await db.select().from(leads).where(eq(leads.id, id));
      return result;
    } catch (error) {
      console.error('Error fetching lead by id:', error);
      return undefined;
    }
  }
  
  async createLead(leadData: InsertLead): Promise<Lead> {
    try {
      const [result] = await db.insert(leads).values(leadData).returning();
      return result;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
  
  async updateLead(userId: number, leadId: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    try {
      const [result] = await db
        .update(leads)
        .set(updates)
        .where(and(
          eq(leads.id, leadId),
          eq(leads.userId, userId)
        ))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating lead:', error);
      return undefined;
    }
  }
  
  async deleteLead(userId: number, leadId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(leads)
        .where(and(
          eq(leads.id, leadId),
          eq(leads.userId, userId)
        ));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  // Provide a fallback method to access emails when the database isn't fully migrated
  getEmails(): Map<number, Email> {
    return this.emailCache;
  }

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const defaultPreferences = {
      emailNotifications: true,
      darkMode: false,
      aiResponseStyle: "friendly"
    };

    const [newUser] = await db.insert(users).values({
      ...insertUser,
      preferences: defaultPreferences,
      avatar: '',
      stripeCustomerId: '',
      googleRefreshToken: ''
    }).returning();

    // Create default connected services
    await this.updateConnectedService(newUser.id, 'google', { connected: false, credentials: {} });
    await this.updateConnectedService(newUser.id, 'stripe', { connected: false, credentials: {} });

    return newUser;
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    // Don't allow updating id or password through this method
    const { id, password, ...allowedUpdates } = updates;
    
    try {
      const [updatedUser] = await db
        .update(users)
        .set(allowedUpdates)
        .where(eq(users.id, userId))
        .returning();
        
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedPreferences = {
      ...user.preferences,
      ...preferences
    };

    const [updatedUser] = await db
      .update(users)
      .set({ preferences: updatedPreferences })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // Email methods
  async getEmailsByUserId(userId: number, options: { limit?: number, unreadOnly?: boolean } = {}): Promise<Email[]> {
    try {
      // Build the query with exact matching column names from the database
      let queryText = `
        SELECT 
          id, 
          user_id as "userId", 
          message_id as "messageId",
          message_id as "threadId", 
          subject,
          sender as "from",
          recipient as "to",
          body,
          timestamp as "date",
          read as "isRead",
          false as "isDeleted",
          false as "isArchived",
          tags as "labels",
          COALESCE(ai_summary, '') as "aiSummary",
          timestamp as "createdAt",
          timestamp as "updatedAt"
        FROM emails
        WHERE user_id = $1`;
      
      const queryParams = [userId];
      let paramCount = 1;
      
      if (options.unreadOnly) {
        queryText += ' AND read = false';
      }
      
      queryText += ' ORDER BY timestamp DESC';
      
      if (options.limit) {
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        queryParams.push(options.limit);
      }
      
      // Use the pool directly to execute the query
      console.log('Executing email query:', queryText.replace(/\s+/g, ' '), 'with params:', queryParams);
      const result = await pool.query(queryText, queryParams);
      const emails = result.rows as unknown as Email[];
      
      // Cache emails for fallback
      for (const email of emails) {
        this.emailCache.set(email.id, email);
      }
      
      return emails;
    } catch (error) {
      console.error('Error in getEmailsByUserId:', error);
      
      // Return from cache if we have any data
      if (this.emailCache.size > 0) {
        const cachedEmails = Array.from(this.emailCache.values())
          .filter(email => email.userId === userId);
          
        if (options.unreadOnly) {
          return cachedEmails.filter(email => !email.isRead);
        }
        
        return cachedEmails;
      }
      
      // If all else fails, return empty array
      return [];
    }
  }

  async getEmail(id: number): Promise<Email | undefined> {
    try {
      // Use raw SQL query with proper column mapping
      const result = await pool.query(`
        SELECT 
          id, 
          user_id as "userId", 
          message_id as "messageId",
          message_id as "threadId", 
          subject,
          sender as "from",
          recipient as "to",
          body,
          timestamp as "date",
          read as "isRead",
          false as "isDeleted",
          false as "isArchived",
          tags as "labels",
          COALESCE(ai_summary, '') as "aiSummary",
          timestamp as "createdAt",
          timestamp as "updatedAt"
        FROM emails
        WHERE id = $1
      `, [id]);
      
      const email = result.rows[0] as unknown as Email;
      
      if (email) {
        this.emailCache.set(email.id, email);
      }
      
      return email;
    } catch (error) {
      console.error('Error in getEmail:', error);
      return this.emailCache.get(id);
    }
  }
  
  // Add a new method to get email by messageId which is a string
  async getEmailByMessageId(userId: number, messageId: string): Promise<Email | undefined> {
    try {
      console.log(`Looking for email with messageId: ${messageId} for user: ${userId}`);
      
      // Use raw SQL query with proper column mapping
      const result = await pool.query(`
        SELECT 
          id, 
          user_id as "userId", 
          message_id as "messageId",
          message_id as "threadId", 
          subject,
          sender as "from",
          recipient as "to",
          body,
          timestamp as "date",
          read as "isRead",
          false as "isDeleted",
          false as "isArchived",
          tags as "labels",
          COALESCE(ai_summary, '') as "aiSummary",
          timestamp as "createdAt",
          timestamp as "updatedAt"
        FROM emails
        WHERE user_id = $1 AND message_id = $2
      `, [userId, messageId]);
      
      const email = result.rows[0] as unknown as Email;
      
      if (email) {
        this.emailCache.set(email.id, email);
        console.log(`Found email with id: ${email.id} for messageId: ${messageId}`);
      } else {
        console.log(`No email found with messageId: ${messageId}`);
      }
      
      return email;
    } catch (error) {
      console.error('Error in getEmailByMessageId:', error);
      
      // Try to find in cache based on messageId
      for (const [_, email] of this.emailCache.entries()) {
        if (email.userId === userId && email.messageId === messageId) {
          return email;
        }
      }
      
      return undefined;
    }
  }

  async createOrUpdateEmail(email: Email): Promise<Email> {
    try {
      const existingEmail = await this.getEmailByMessageId(email.userId, email.messageId);
      
      if (existingEmail) {
        // Update existing email with raw SQL
        const result = await pool.query(`
          UPDATE emails
          SET 
            subject = $1,
            sender = $2,
            recipient = $3,
            body = $4,
            timestamp = $5,
            read = $6,
            tags = $7,
            ai_summary = $8
          WHERE id = $9
          RETURNING 
            id, 
            user_id as "userId", 
            message_id as "messageId",
            message_id as "threadId", 
            subject,
            sender as "from",
            recipient as "to",
            body,
            timestamp as "date",
            read as "isRead",
            false as "isDeleted",
            false as "isArchived",
            tags as "labels",
            COALESCE(ai_summary, '') as "aiSummary",
            timestamp as "createdAt",
            timestamp as "updatedAt"
        `, [
          email.subject,
          email.from,
          email.to,
          email.body,
          email.date,
          email.isRead,
          email.labels,
          email.aiSummary,
          existingEmail.id
        ]);
        
        const updatedEmail = result.rows[0] as unknown as Email;
        this.emailCache.set(updatedEmail.id, updatedEmail);
        return updatedEmail;
      }
      
      // Insert new email with raw SQL
      const result = await pool.query(`
        INSERT INTO emails (
          user_id,
          message_id,
          subject,
          sender,
          recipient,
          body,
          timestamp,
          read,
          tags,
          ai_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING 
          id, 
          user_id as "userId", 
          message_id as "messageId",
          message_id as "threadId", 
          subject,
          sender as "from",
          recipient as "to",
          body,
          timestamp as "date",
          read as "isRead",
          false as "isDeleted",
          false as "isArchived",
          tags as "labels",
          COALESCE(ai_summary, '') as "aiSummary",
          timestamp as "createdAt",
          timestamp as "updatedAt"
      `, [
        email.userId,
        email.messageId,
        email.subject,
        email.from,
        email.to,
        email.body,
        email.date,
        email.isRead,
        email.labels,
        email.aiSummary
      ]);
      
      const newEmail = result.rows[0] as unknown as Email;
      this.emailCache.set(newEmail.id, newEmail);
      return newEmail;
    } catch (error) {
      console.error('Error in createOrUpdateEmail:', error);
      throw error;
    }
  }

  async updateEmail(userId: number, emailId: number, updates: Partial<Email>): Promise<Email | undefined> {
    try {
      // Build dynamic update query
      let queryParams: any[] = [];
      let setClause = '';
      
      // Add each update field to the query
      let paramIndex = 1;
      
      if (updates.subject !== undefined) {
        setClause += `${setClause ? ', ' : ''}subject = $${paramIndex++}`;
        queryParams.push(updates.subject);
      }
      
      if (updates.from !== undefined) {
        setClause += `${setClause ? ', ' : ''}sender = $${paramIndex++}`;
        queryParams.push(updates.from);
      }
      
      if (updates.to !== undefined) {
        setClause += `${setClause ? ', ' : ''}recipient = $${paramIndex++}`;
        queryParams.push(updates.to);
      }
      
      if (updates.body !== undefined) {
        setClause += `${setClause ? ', ' : ''}body = $${paramIndex++}`;
        queryParams.push(updates.body);
      }
      
      if (updates.date !== undefined) {
        setClause += `${setClause ? ', ' : ''}timestamp = $${paramIndex++}`;
        queryParams.push(updates.date);
      }
      
      if (updates.isRead !== undefined) {
        setClause += `${setClause ? ', ' : ''}read = $${paramIndex++}`;
        queryParams.push(updates.isRead);
      }
      
      if (updates.labels !== undefined) {
        setClause += `${setClause ? ', ' : ''}tags = $${paramIndex++}`;
        queryParams.push(updates.labels);
      }
      
      if (updates.aiSummary !== undefined) {
        setClause += `${setClause ? ', ' : ''}ai_summary = $${paramIndex++}`;
        queryParams.push(updates.aiSummary);
      }
      
      if (!setClause) {
        // Nothing to update
        const existingEmail = await this.getEmail(emailId);
        return existingEmail;
      }
      
      // Add WHERE clause parameters
      queryParams.push(emailId);
      queryParams.push(userId);
      
      // Execute the update query
      const result = await pool.query(`
        UPDATE emails
        SET ${setClause}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
        RETURNING 
          id, 
          user_id as "userId", 
          message_id as "messageId",
          message_id as "threadId", 
          subject,
          sender as "from",
          recipient as "to",
          body,
          timestamp as "date",
          read as "isRead",
          false as "isDeleted",
          false as "isArchived",
          tags as "labels",
          COALESCE(ai_summary, '') as "aiSummary",
          timestamp as "createdAt",
          timestamp as "updatedAt"
      `, queryParams);
      
      const updatedEmail = result.rows[0] as unknown as Email;
      
      if (updatedEmail) {
        this.emailCache.set(updatedEmail.id, updatedEmail);
      }
      
      return updatedEmail;
    } catch (error) {
      console.error('Error in updateEmail:', error);
      return undefined;
    }
  }

  async deleteEmail(userId: number, emailId: number): Promise<boolean> {
    try {
      // Use raw SQL query to delete email
      const result = await pool.query(`
        DELETE FROM emails 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [emailId, userId]);
      
      const success = result.rows.length > 0;
      
      if (success) {
        // Remove from cache
        this.emailCache.delete(emailId);
      }
      
      return success;
    } catch (error) {
      console.error('Error in deleteEmail:', error);
      return false;
    }
  }

  // Task methods
  async getTasksByUserId(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }
  
  async getTasksByLeadId(userId: number, leadId: number): Promise<Task[]> {
    return db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.leadId, leadId)
      )
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(userId: number, taskId: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    
    return task;
  }

  async deleteTask(userId: number, taskId: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });
    
    return result.length > 0;
  }

  // Event methods
  async getEventsByUserId(userId: number): Promise<Event[]> {
    return db.select().from(events).where(eq(events.userId, userId));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    try {
      console.log("Creating event with data:", JSON.stringify(event, null, 2));
      
      // Let Drizzle handle the timestamp columns with the Date objects provided by Zod transforms
      const [newEvent] = await db.insert(events).values({
        ...event,
        aiNotes: event.aiNotes || ''
      }).returning();
      
      console.log("Event created successfully:", JSON.stringify(newEvent, null, 2));
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
  
  async updateEvent(userId: number, eventId: number, updates: Partial<Event>): Promise<Event | undefined> {
    try {
      console.log("Updating event with data:", JSON.stringify(updates, null, 2));
      
      // Use a Date object for updatedAt
      const updatedValues = {
        ...updates,
        updatedAt: new Date()
      };
      
      const [updatedEvent] = await db
        .update(events)
        .set(updatedValues)
        .where(and(
          eq(events.id, eventId),
          eq(events.userId, userId)
        ))
        .returning();
      
      console.log("Event updated successfully:", JSON.stringify(updatedEvent, null, 2));
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      return undefined;
    }
  }

  // Invoice methods
  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.userId, userId));
  }
  
  async getInvoicesByLeadId(userId: number, leadId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(
      and(
        eq(invoices.userId, userId),
        eq(invoices.leadId, leadId)
      )
    );
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }
  
  async updateInvoice(userId: number, invoiceId: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    // First check if the invoice exists and belongs to the user
    const existingInvoice = await this.getInvoice(invoiceId);
    
    if (!existingInvoice || existingInvoice.userId !== userId) {
      return undefined;
    }
    
    // Update the invoice and return the updated version
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(and(
        eq(invoices.id, invoiceId),
        eq(invoices.userId, userId)
      ))
      .returning();
    
    return updatedInvoice;
  }

  // Connected services methods
  async getConnectedServicesByUserId(userId: number): Promise<ConnectedService[]> {
    return db.select().from(connectedServices).where(eq(connectedServices.userId, userId));
  }

  async getConnectedService(userId: number, serviceName: string): Promise<ConnectedService | undefined> {
    const [service] = await db
      .select()
      .from(connectedServices)
      .where(and(
        eq(connectedServices.userId, userId),
        eq(connectedServices.service, serviceName)
      ));
    
    return service;
  }

  async updateConnectedService(
    userId: number, 
    serviceName: string, 
    updates: Partial<InsertConnectedService>
  ): Promise<ConnectedService> {
    const existing = await this.getConnectedService(userId, serviceName);
    
    if (existing) {
      // For better debugging, log the update
      console.log(`Updating ${serviceName} connection for user ${userId}:`, 
        updates.connected !== undefined ? `connected: ${updates.connected}` : '',
        updates.lastError !== undefined ? `error: ${updates.lastError}` : '');
      
      const [updated] = await db
        .update(connectedServices)
        .set({
          ...updates,
          lastSynced: new Date(),
          lastUpdated: new Date()
        })
        .where(and(
          eq(connectedServices.userId, userId),
          eq(connectedServices.service, serviceName)
        ))
        .returning();
      
      return updated;
    } else {
      console.log(`Creating new ${serviceName} connection for user ${userId}`);
      
      const [newService] = await db
        .insert(connectedServices)
        .values({
          userId,
          service: serviceName,
          connected: updates.connected || false,
          credentials: updates.credentials || {},
          username: updates.username || null,
          displayName: updates.displayName || null,
          lastError: updates.lastError || null,
          lastSynced: new Date(),
          lastUpdated: new Date()
        })
        .returning();
      
      return newService;
    }
  }

  // AI Chat methods
  async getAIChatsByUserId(userId: number): Promise<AIChat[]> {
    return db.select()
      .from(aiChats)
      .where(eq(aiChats.userId, userId))
      .orderBy(aiChats.updatedAt);
  }

  async getAIChat(id: number): Promise<AIChat | undefined> {
    const [chat] = await db.select()
      .from(aiChats)
      .where(eq(aiChats.id, id));
    
    return chat;
  }

  async createAIChat(chat: InsertAIChat): Promise<AIChat> {
    const [newChat] = await db.insert(aiChats)
      .values({
        ...chat,
        pinned: chat.pinned || false
      })
      .returning();
    
    return newChat;
  }

  async updateAIChat(userId: number, chatId: number, updates: Partial<AIChat>): Promise<AIChat | undefined> {
    const [updatedChat] = await db.update(aiChats)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(aiChats.id, chatId),
        eq(aiChats.userId, userId)
      ))
      .returning();
    
    return updatedChat;
  }

  async deleteAIChat(userId: number, chatId: number): Promise<boolean> {
    // Delete all messages associated with this chat first
    await db.delete(aiMessages)
      .where(eq(aiMessages.chatId, chatId));
    
    // Then delete the chat
    const result = await db.delete(aiChats)
      .where(and(
        eq(aiChats.id, chatId),
        eq(aiChats.userId, userId)
      ))
      .returning({ id: aiChats.id });
    
    return result.length > 0;
  }

  // AI Message methods
  async getAIMessagesByChatId(chatId: number): Promise<AIMessage[]> {
    const messages = await db.select()
      .from(aiMessages)
      .where(eq(aiMessages.chatId, chatId))
      .orderBy(aiMessages.timestamp);
    
    return messages.map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp
    }));
  }

  async createAIMessage(message: InsertAIMessage): Promise<AIMessage> {
    const [newMessage] = await db.insert(aiMessages)
      .values(message)
      .returning();
    
    // Update the parent chat's updatedAt timestamp
    await db.update(aiChats)
      .set({ updatedAt: new Date() })
      .where(eq(aiChats.id, message.chatId));
    
    return {
      id: newMessage.id,
      chatId: newMessage.chatId,
      role: newMessage.role as 'user' | 'assistant' | 'system',
      content: newMessage.content,
      timestamp: newMessage.timestamp || undefined
    };
  }
  
  // Expense methods
  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    try {
      const result = await db.select().from(expenses).where(eq(expenses.userId, userId));
      return result;
    } catch (error) {
      console.error('Error fetching expenses by userId:', error);
      return [];
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const [result] = await db.select().from(expenses).where(eq(expenses.id, id));
      return result;
    } catch (error) {
      console.error('Error fetching expense by id:', error);
      return undefined;
    }
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    try {
      const [result] = await db.insert(expenses).values(expense).returning();
      return result;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async updateExpense(userId: number, expenseId: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    try {
      const [result] = await db
        .update(expenses)
        .set(updates)
        .where(and(
          eq(expenses.id, expenseId),
          eq(expenses.userId, userId)
        ))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating expense:', error);
      return undefined;
    }
  }

  async deleteExpense(userId: number, expenseId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(expenses)
        .where(and(
          eq(expenses.id, expenseId),
          eq(expenses.userId, userId)
        ));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }
  
  // User Settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    try {
      const [result] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.user_id, userId));
      return result;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return undefined;
    }
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    try {
      const [result] = await db
        .insert(userSettings)
        .values(settings)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: number, updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // Check if settings exist
      const existingSettings = await this.getUserSettings(userId);
      
      if (!existingSettings) {
        // Create new settings if they don't exist
        return await this.createUserSettings({ 
          userId, 
          ...updates as InsertUserSettings 
        });
      }
      
      // Update existing settings
      const [result] = await db
        .update(userSettings)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(userSettings.user_id, userId))
        .returning();
        
      return result;
    } catch (error) {
      console.error('Error updating user settings:', error);
      // If it's a duplicate key error, just return the existing settings
      if (error.code === '23505') {
        return existingSettings;
      }
      throw error;
    }
  }

  // Sent Email methods
  async getSentEmailsByUserId(userId: number, options: { limit?: number, type?: string } = {}): Promise<SentEmail[]> {
    try {
      let query = db.select().from(sentEmails).where(eq(sentEmails.userId, userId));
      
      if (options.type) {
        query = query.where(eq(sentEmails.type, options.type));
      }
      
      // Sort by sentAt date descending (newest first)
      query = query.orderBy(desc(sentEmails.sentAt));
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting sent emails by user ID:', error);
      return [];
    }
  }

  async getSentEmail(id: number): Promise<SentEmail | undefined> {
    try {
      const [result] = await db.select().from(sentEmails).where(eq(sentEmails.id, id));
      return result;
    } catch (error) {
      console.error('Error getting sent email by ID:', error);
      return undefined;
    }
  }

  async createSentEmail(sentEmail: InsertSentEmail): Promise<SentEmail> {
    try {
      // Ensure sentAt is set if not provided
      const emailData = {
        ...sentEmail,
        sentAt: sentEmail.sentAt || new Date()
      };
      
      const [result] = await db.insert(sentEmails).values(emailData).returning();
      return result;
    } catch (error) {
      console.error('Error creating sent email:', error);
      throw error;
    }
  }

  async updateSentEmail(userId: number, sentEmailId: number, updates: Partial<SentEmail>): Promise<SentEmail | undefined> {
    try {
      const [result] = await db
        .update(sentEmails)
        .set(updates)
        .where(and(
          eq(sentEmails.id, sentEmailId),
          eq(sentEmails.userId, userId)
        ))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating sent email:', error);
      return undefined;
    }
  }
  
  // Beta Signup methods
  async getBetaSignups(): Promise<BetaSignup[]> {
    try {
      return await db.select().from(betaSignups).orderBy(desc(betaSignups.joinedAt));
    } catch (error) {
      console.error('Error getting beta signups:', error);
      return [];
    }
  }
  
  async getBetaSignupByEmail(email: string): Promise<BetaSignup | undefined> {
    try {
      const [result] = await db
        .select()
        .from(betaSignups)
        .where(eq(betaSignups.email, email));
      return result;
    } catch (error) {
      console.error('Error getting beta signup by email:', error);
      return undefined;
    }
  }
  
  async createBetaSignup(signup: InsertBetaSignup): Promise<BetaSignup> {
    try {
      console.log("=== DATABASE INSERT DEBUG ===");
      console.log("About to insert beta signup with data:", JSON.stringify(signup, null, 2));
      
      const insertData = {
        ...signup,
        joinedAt: new Date()
      };
      
      console.log("Final insert data:", JSON.stringify(insertData, null, 2));
      
      const [result] = await db
        .insert(betaSignups)
        .values(insertData)
        .returning();
        
      console.log("Database insert successful! Result:", JSON.stringify(result, null, 2));
      console.log("============================");
      
      return result;
    } catch (error) {
      console.error('=== DATABASE INSERT ERROR ===');
      console.error('Error creating beta signup:', error);
      console.error('Signup data that failed:', JSON.stringify(signup, null, 2));
      console.error('=============================');
      throw error;
    }
  }

  // Activity Log methods
  async getActivityLog(userId: number): Promise<ActivityLog[]> {
    try {
      return await db.select()
        .from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.createdAt));
    } catch (error) {
      console.error('Error getting activity log:', error);
      return [];
    }
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      const [result] = await db
        .insert(activityLog)
        .values({
          ...log,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }
  
  async updateBetaSignup(id: number, updates: Partial<BetaSignup>): Promise<BetaSignup | undefined> {
    try {
      const [result] = await db
        .update(betaSignups)
        .set(updates)
        .where(eq(betaSignups.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating beta signup:', error);
      return undefined;
    }
  }
  
  // Email logging methods
  async createEmailLog(log: { userId: number, type: string, recipient: string, subject: string, status: string, metadata?: string }): Promise<any> {
    try {
      // Since we don't have a dedicated table yet, we'll temporarily log to console
      console.log('Email Log:', {
        userId: log.userId,
        type: log.type,
        recipient: log.recipient,
        subject: log.subject,
        status: log.status,
        metadata: log.metadata,
        timestamp: new Date()
      });
      
      // Return a dummy log object
      return {
        id: Date.now(),
        ...log,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error creating email log:', error);
      return null;
    }
  }
  
  // Task reminder tracking methods
  async getLastTaskReminderDate(userId: number): Promise<Date | null> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings) return null;
      
      // Using the correct field name from the schema
      return settings.lastTaskReminderSent ? new Date(settings.lastTaskReminderSent) : null;
    } catch (error) {
      console.error('Error getting last task reminder date:', error);
      return null;
    }
  }
  
  async updateTaskReminderDate(userId: number): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      
      if (!settings) {
        // Create settings if they don't exist
        await this.createUserSettings({
          userId,
          lastTaskReminderSent: new Date()
        });
      } else {
        // Update existing settings
        await this.updateUserSettings(userId, {
          lastTaskReminderSent: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating task reminder date:', error);
      return false;
    }
  }

  // Autonomic engine methods
  async getLastDailySummaryDate(userId: number): Promise<Date | null> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings) return null;
      
      return settings.lastDailySummaryDate ? new Date(settings.lastDailySummaryDate) : null;
    } catch (error) {
      console.error('Error getting last daily summary date:', error);
      return null;
    }
  }
  
  async updateDailySummaryDate(userId: number): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings) return false;
      
      await this.updateUserSettings(userId, {
        lastDailySummaryDate: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating daily summary date:', error);
      return false;
    }
  }
  
  async getLastTaskReminderDate(userId: number): Promise<Date | null> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings) return null;
      
      return settings.lastTaskReminderDate ? new Date(settings.lastTaskReminderDate) : null;
    } catch (error) {
      console.error('Error getting last task reminder date:', error);
      return null;
    }
  }
  
  async updateTaskReminderDate(userId: number): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      if (!settings) return false;
      
      await this.updateUserSettings(userId, {
        lastTaskReminderDate: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating task reminder date:', error);
      return false;
    }
  }
  
  async getUpcomingEvents(userId: number, hours: number): Promise<Event[]> {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      const events = await this.getEventsByUserId(userId);
      return events.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart > now && eventStart < cutoff;
      });
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }
  
  async getOverdueInvoices(userId: number): Promise<Invoice[]> {
    try {
      const now = new Date();
      const invoices = await this.getInvoicesByUserId(userId);
      
      return invoices.filter(invoice => {
        if (invoice.status === 'paid') return false;
        return invoice.dueDate && new Date(invoice.dueDate) < now;
      });
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      return [];
    }
  }
  
  // Pending Email Reply methods
  async createPendingEmailReply(data: InsertPendingEmailReply): Promise<PendingEmailReply> {
    try {
      const [newReply] = await db
        .insert(pendingEmailReplies)
        .values({
          userId: data.userId,
          messageId: data.messageId,
          recipient: data.recipient || data.to, // Use recipient if available, otherwise use to
          subject: data.subject,
          content: data.content,
          originalMessageData: data.originalMessageData,
          status: data.status || 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          actionTaken: null,
          actionDate: null
        })
        .returning();
      
      return newReply;
    } catch (error) {
      console.error('Error creating pending email reply:', error);
      throw error;
    }
  }
  
  async getPendingEmailReplies(userId: number): Promise<PendingEmailReply[]> {
    try {
      const replies = await db
        .select()
        .from(pendingEmailReplies)
        .where(eq(pendingEmailReplies.userId, userId))
        .orderBy(desc(pendingEmailReplies.createdAt));
      
      return replies;
    } catch (error) {
      console.error('Error getting pending email replies:', error);
      return [];
    }
  }
  
  async getPendingEmailReply(id: number): Promise<PendingEmailReply | undefined> {
    try {
      const [reply] = await db
        .select()
        .from(pendingEmailReplies)
        .where(eq(pendingEmailReplies.id, id));
      
      return reply;
    } catch (error) {
      console.error('Error getting pending email reply:', error);
      return undefined;
    }
  }
  
  async updatePendingEmailReply(id: number, data: Partial<PendingEmailReply>): Promise<PendingEmailReply | undefined> {
    try {
      const [updatedReply] = await db
        .update(pendingEmailReplies)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(pendingEmailReplies.id, id))
        .returning();
      
      return updatedReply;
    } catch (error) {
      console.error('Error updating pending email reply:', error);
      return undefined;
    }
  }
  
  async deletePendingEmailReply(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(pendingEmailReplies)
        .where(eq(pendingEmailReplies.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting pending email reply:', error);
      return false;
    }
  }
  
  // Slack integration methods with multi-tenant support
  async getSlackIntegration(userId: number, clientId?: number): Promise<any | undefined> {
    try {
      if (clientId) {
        // Look for specific client integration
        const [clientIntegration] = await db
          .select()
          .from(slackIntegrations)
          .where(eq(slackIntegrations.userId, userId))
          .where(eq(slackIntegrations.clientId, clientId));
        
        if (clientIntegration) {
          return clientIntegration;
        }
      }
      
      // Look for default integration
      const [defaultIntegration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.userId, userId))
        .where(eq(slackIntegrations.isDefault, true));
      
      if (defaultIntegration) {
        return defaultIntegration;
      }
      
      // Fall back to first integration (backwards compatibility)
      const [firstIntegration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.userId, userId))
        .limit(1);
      
      return firstIntegration;
    } catch (error) {
      console.error('Error getting Slack integration:', error);
      return undefined;
    }
  }
  
  async getAllSlackIntegrations(userId: number): Promise<any[]> {
    try {
      const integrations = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.userId, userId));
      
      return integrations;
    } catch (error) {
      console.error('Error getting all Slack integrations:', error);
      return [];
    }
  }
  
  async getSlackIntegrationByClient(userId: number, clientId: number): Promise<any | undefined> {
    try {
      const [integration] = await db
        .select()
        .from(slackIntegrations)
        .where(eq(slackIntegrations.userId, userId))
        .where(eq(slackIntegrations.clientId, clientId));
      
      return integration;
    } catch (error) {
      console.error(`Error getting Slack integration for client ${clientId}:`, error);
      return undefined;
    }
  }
  
  async getDefaultSlackChannel(userId: number): Promise<string | undefined> {
    try {
      // First try to get channel from user preferences
      const user = await this.getUser(userId);
      if (user?.preferences?.slackNotifications) {
        const { slackNotifications } = user.preferences;
        
        // Check for default channel in preferences
        if (slackNotifications.dailySummaryChannel) {
          return slackNotifications.dailySummaryChannel;
        }
      }
      
      // Then try to get from user_settings - use a safe query approach to handle missing columns
      try {
        const [settings] = await db
          .select({ defaultSlackChannel: userSettings.defaultSlackChannel })
          .from(userSettings)
          .where(eq(userSettings.userId, userId));
        
        if (settings?.defaultSlackChannel) {
          return settings.defaultSlackChannel;
        }
      } catch (dbError) {
        // If there's a column error, just log it and continue to the fallback
        console.warn(`Database error getting default channel: ${dbError.message}`);
      }
      
      // Fallback to system default 
      return process.env.SLACK_CHANNEL_ID;
    } catch (error) {
      console.error('Error getting default Slack channel:', error);
      return undefined;
    }
  }
  
  async setDefaultSlackChannel(userId: number, channelId: string): Promise<boolean> {
    try {
      // First check if the user_settings record exists
      const [existingSettings] = await db
        .select({ id: userSettings.id })
        .from(userSettings)
        .where(eq(userSettings.userId, userId));
      
      if (existingSettings) {
        // Update only the defaultSlackChannel field if record exists
        await db
          .update(userSettings)
          .set({ defaultSlackChannel: channelId })
          .where(eq(userSettings.userId, userId));
      } else {
        // Create a new record with minimal required fields
        await db
          .insert(userSettings)
          .values({
            userId,
            defaultSlackChannel: channelId
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting default Slack channel:', error);
      return false;
    }
  }
  
  async saveSlackIntegration(userId: number, data: any): Promise<void> {
    try {
      // If clientId is provided, use it for multi-tenant support
      if (data.clientId) {
        // Try to find existing integration for this client
        const [existingClientIntegration] = await db
          .select()
          .from(slackIntegrations)
          .where(eq(slackIntegrations.userId, userId))
          .where(eq(slackIntegrations.clientId, data.clientId));
        
        if (existingClientIntegration) {
          // Update existing client-specific integration
          await db
            .update(slackIntegrations)
            .set({
              accessToken: data.accessToken,
              teamId: data.teamId,
              teamName: data.teamName,
              clientName: data.clientName, // Update client name if provided
              botUserId: data.botUserId,
              scope: data.scope,
              incomingWebhook: data.incomingWebhook,
              updatedAt: new Date(),
              isActive: true,
              isDefault: data.isDefault || false,
              availableChannels: data.availableChannels || []
            })
            .where(eq(slackIntegrations.id, existingClientIntegration.id));
            
          // If setting this integration as default, unset other defaults
          if (data.isDefault) {
            await db
              .update(slackIntegrations)
              .set({ isDefault: false })
              .where(eq(slackIntegrations.userId, userId))
              .where(ne(slackIntegrations.id, existingClientIntegration.id));
          }
        } else {
          // Create new client-specific integration
          const [newIntegration] = await db
            .insert(slackIntegrations)
            .values({
              userId,
              clientId: data.clientId,
              clientName: data.clientName || `Client ${data.clientId}`,
              accessToken: data.accessToken,
              teamId: data.teamId,
              teamName: data.teamName,
              botUserId: data.botUserId,
              scope: data.scope,
              incomingWebhook: data.incomingWebhook,
              availableChannels: data.availableChannels || [],
              isActive: true,
              isDefault: data.isDefault || false
            })
            .returning();
          
          // If setting as default, unset other defaults
          if (data.isDefault && newIntegration) {
            await db
              .update(slackIntegrations)
              .set({ isDefault: false })
              .where(eq(slackIntegrations.userId, userId))
              .where(ne(slackIntegrations.id, newIntegration.id));
          }
        }
      } else {
        // For backward compatibility - single integration per user
        const existingIntegration = await this.getSlackIntegration(userId);
        
        if (existingIntegration) {
          // Update existing integration
          await db
            .update(slackIntegrations)
            .set({
              accessToken: data.accessToken,
              teamId: data.teamId,
              teamName: data.teamName,
              botUserId: data.botUserId,
              scope: data.scope,
              incomingWebhook: data.incomingWebhook,
              updatedAt: new Date(),
              isActive: true,
              isDefault: true, // Legacy integrations are default
              availableChannels: data.availableChannels || []
            })
            .where(eq(slackIntegrations.id, existingIntegration.id));
        } else {
          // Create new integration (as default)
          await db
            .insert(slackIntegrations)
            .values({
              userId,
              accessToken: data.accessToken,
              teamId: data.teamId,
              teamName: data.teamName,
              botUserId: data.botUserId,
              scope: data.scope,
              incomingWebhook: data.incomingWebhook,
              availableChannels: data.availableChannels || [],
              isActive: true,
              isDefault: true // New legacy integrations are default
            });
        }
      }
    } catch (error) {
      console.error('Error saving Slack integration:', error);
      throw error;
    }
  }
  
  async updateSlackIntegration(userId: number, data: Partial<any>): Promise<void> {
    try {
      // If clientId is provided, update specific client integration
      if (data.clientId) {
        await db
          .update(slackIntegrations)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(slackIntegrations.userId, userId))
          .where(eq(slackIntegrations.clientId, data.clientId));
      } else if (data.integrationId) {
        // If specific integration ID is provided
        await db
          .update(slackIntegrations)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(slackIntegrations.id, data.integrationId));
      } else {
        // Backward compatibility - update user's default integration
        const integration = await this.getSlackIntegration(userId);
        if (integration) {
          await db
            .update(slackIntegrations)
            .set({
              ...data,
              updatedAt: new Date()
            })
            .where(eq(slackIntegrations.id, integration.id));
        }
      }
    } catch (error) {
      console.error('Error updating Slack integration:', error);
      throw error;
    }
  }
  
  async deleteSlackIntegration(userId: number, integrationId?: number): Promise<boolean> {
    try {
      let result;
      
      if (integrationId) {
        // Delete specific integration by ID
        result = await db
          .delete(slackIntegrations)
          .where(eq(slackIntegrations.id, integrationId))
          .where(eq(slackIntegrations.userId, userId));
      } else {
        // Delete all integrations for this user (backward compatibility)
        result = await db
          .delete(slackIntegrations)
          .where(eq(slackIntegrations.userId, userId));
      }
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting Slack integration:', error);
      return false;
    }
  }
  
  // Email integration methods
  async getEmailIntegration(userId: number, provider: string): Promise<any> {
    try {
      // Use raw SQL until we update the schema
      const query = `
        SELECT * FROM email_integrations 
        WHERE user_id = $1 AND provider = $2 AND is_active = true
        ORDER BY is_default DESC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [userId, provider]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting email integration:', error);
      return null;
    }
  }
  
  async storeEmailIntegration(userId: number, provider: string, credentials: string): Promise<void> {
    try {
      // Parse credentials to extract email if available
      let email = null;
      try {
        const credentialsObj = JSON.parse(credentials);
        email = credentialsObj.email || null;
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Check if integration already exists
      const existingIntegration = await this.getEmailIntegration(userId, provider);
      
      if (existingIntegration) {
        // Update existing integration
        await this.updateEmailIntegration(userId, provider, credentials);
      } else {
        // Create new integration
        const query = `
          INSERT INTO email_integrations (
            user_id, provider, email, credentials, 
            installed_at, updated_at, is_active, is_default
          )
          VALUES ($1, $2, $3, $4, NOW(), NOW(), true, true)
        `;
        
        await pool.query(query, [userId, provider, email, credentials]);
      }
    } catch (error) {
      console.error('Error storing email integration:', error);
      throw error;
    }
  }
  
  async updateEmailIntegration(userId: number, provider: string, credentials: string): Promise<void> {
    try {
      // Parse credentials to extract email if available
      let email = null;
      try {
        const credentialsObj = JSON.parse(credentials);
        email = credentialsObj.email || null;
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Use raw SQL until we update the schema
      const query = `
        UPDATE email_integrations
        SET 
          credentials = $3,
          email = $4,
          updated_at = NOW()
        WHERE user_id = $1 
          AND provider = $2
          AND is_active = true
      `;
      
      await pool.query(query, [userId, provider, credentials, email]);
    } catch (error) {
      console.error('Error updating email integration:', error);
      throw error;
    }
  }
  
  async deleteEmailIntegration(userId: number, provider: string): Promise<boolean> {
    try {
      // Use raw SQL until we update the schema
      const query = `
        UPDATE email_integrations
        SET is_active = false
        WHERE user_id = $1 
          AND provider = $2
          AND is_active = true
      `;
      
      const result = await pool.query(query, [userId, provider]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting email integration:', error);
      return false;
    }
  }
  
  /**
   * Update the last_synced_at timestamp for an email integration
   * This helps track when emails were last successfully synced
   */
  async updateEmailIntegrationLastSynced(userId: number, provider: string): Promise<boolean> {
    try {
      // Use raw SQL until we update the schema
      const query = `
        UPDATE email_integrations
        SET last_synced_at = NOW()
        WHERE user_id = $1 
          AND provider = $2
          AND is_active = true
      `;
      
      const result = await pool.query(query, [userId, provider]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error updating last_synced_at for ${provider} email integration (user ${userId}):`, error);
      return false;
    }
  }
  
  async updateUserLastEmailSyncDate(userId: number, date: Date): Promise<boolean> {
    try {
      await db.update(users)
        .set({
          lastEmailSyncDate: date
        })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Error updating last email sync date:', error);
      return false;
    }
  }
}

// Initialize storage using the database
export const storage = new DatabaseStorage();
