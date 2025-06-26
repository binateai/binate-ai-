import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Daily activity log to track what Binate AI accomplished
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD format
  taskType: text('task_type').notNull(), // 'expense_created', 'email_processed', 'invoice_handled', etc.
  description: text('description').notNull(),
  details: jsonb('details'), // Additional structured data
  source: text('source'), // 'email', 'automation', 'manual'
  cost: text('cost'), // Track API costs if any
  status: text('status').default('completed'), // 'completed', 'failed', 'pending'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  preferences: jsonb("preferences"),
  stripeCustomerId: text("stripe_customer_id"),
  googleRefreshToken: text("google_refresh_token"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const userPreferences = z.object({
  // Theme and UI preferences
  darkMode: z.boolean().default(false),
  
  // Communication preferences
  emailNotifications: z.boolean().default(true),
  aiResponseStyle: z.enum(["formal", "casual", "friendly"]).default("friendly"),
  emailSignature: z.string().optional(),
  communicationStyle: z.enum(["professional", "casual", "friendly"]).default("professional"),
  priorityResponseTime: z.enum(["high", "medium", "low"]).default("medium"),
  
  // Autonomous agent settings
  pauseAI: z.boolean().default(false),
  autonomousMode: z.enum(["fully_autonomous", "semi_manual"]).default("semi_manual"),
  dailySummaries: z.boolean().default(true),
  taskReminders: z.boolean().default(true),
  meetingReminders: z.boolean().default(true),
  invoiceReminders: z.boolean().default(true),
  
  // Slack notification preferences
  slackEnabled: z.boolean().default(false),
  slackNotifications: z.object({
    taskAlerts: z.boolean().default(true),
    meetingReminders: z.boolean().default(true), 
    invoiceFollowUps: z.boolean().default(true),
    leadUpdates: z.boolean().default(true),
    dailySummaries: z.boolean().default(true),
    taskAlertChannel: z.string().optional(),
    meetingReminderChannel: z.string().optional(),
    invoiceFollowUpChannel: z.string().optional(),
    leadUpdateChannel: z.string().optional(),
    dailySummaryChannel: z.string().optional()
  }).optional(),
  
  // Autonomous feature toggles
  autoManageEmail: z.boolean().default(true),
  autoReplyToEmails: z.boolean().default(false),
  autoManageTasks: z.boolean().default(true),
  autoCreateTasks: z.boolean().default(true),
  autoManageLeads: z.boolean().default(true),
  autoDetectLeads: z.boolean().default(true),
  autoManageInvoices: z.boolean().default(true),
  autoGenerateInvoices: z.boolean().default(false),
  autoManageCalendar: z.boolean().default(true),
  autoScheduleMeetings: z.boolean().default(false),
  autoManageExpenses: z.boolean().default(true),
  
  // Business settings
  currency: z.string().default("USD"),
  taxRate: z.number().default(0),
  paymentTerms: z.number().default(30), // days
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessWebsite: z.string().optional(),
  
  // AI engine settings
  aiSettings: z.object({
    summarizeEmails: z.boolean().default(true),
    suggestReplies: z.boolean().default(true),
    detectMeetings: z.boolean().default(true),
    detectLeads: z.boolean().default(true),
    detectInvoices: z.boolean().default(true),
    categorizeExpenses: z.boolean().default(true),
    suggestTasks: z.boolean().default(true),
    dailySummaries: z.boolean().default(true),
    priorityThreshold: z.number().min(0).max(1).default(0.7)
  }).optional()
});

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  messageId: text("message_id").notNull().unique(),
  threadId: text("thread_id").notNull(),
  subject: text("subject").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  body: text("body").notNull(),
  date: timestamp("date", { mode: 'date' }).notNull(),
  isRead: boolean("is_read").default(false),
  isDeleted: boolean("is_deleted").default(false),
  isArchived: boolean("is_archived").default(false),
  labels: text("labels").array(),
  aiSummary: text("ai_summary"),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  userId: true,
  messageId: true,
  threadId: true,
  subject: true,
  from: true,
  to: true,
  body: true,
  date: true,
  isRead: true,
  isDeleted: true,
  isArchived: true,
  labels: true,
  aiSummary: true,
  processed: true
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  priority: text("priority").default("medium"),
  aiGenerated: boolean("ai_generated").default(false),
  leadId: integer("lead_id"),
  assignedTo: text("assigned_to").default("me"), // "me", "binate_ai", or other team members later
  estimatedTime: integer("estimated_time").default(30), // Time in minutes
  emailId: integer("email_id"), // Reference to the email this task was created from
  source: text("source"), // "email", "chat", "dashboard", "system"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks)
  .pick({
    userId: true,
    title: true,
    description: true,
    dueDate: true,
    priority: true,
    aiGenerated: true,
    completed: true,
    leadId: true,
    assignedTo: true,
    estimatedTime: true,
    emailId: true,
    source: true,
  })
  .extend({
    dueDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
    leadId: z.number().optional(),
    emailId: z.number().optional(),
    source: z.enum(['email', 'chat', 'dashboard', 'system']).optional(),
    assignedTo: z.enum(["me", "binate_ai"]).default("me"),
    estimatedTime: z.number().optional().default(30), // Default to 30 minutes
  });

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  meetingUrl: text("meeting_url"),
  attendees: text("attendees").array(),
  aiNotes: text("ai_notes"),
  emailId: integer("email_id"),
  contextNotes: text("context_notes"),
  temporary: boolean("temporary").default(false),
  aiConfidence: integer("ai_confidence"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events)
  .pick({
    userId: true,
    title: true,
    description: true,
    startTime: true,
    endTime: true,
    location: true,
    meetingUrl: true,
    attendees: true,
    emailId: true,
    aiNotes: true,
    contextNotes: true,
    temporary: true,
    aiConfidence: true,
  })
  .extend({
    // Convert string dates to Date objects for the database
    startTime: z.string().transform(str => new Date(str)),
    endTime: z.string().transform(str => new Date(str)),
    emailId: z.number().optional(),
    aiNotes: z.string().optional(),
    contextNotes: z.string().optional(),
    temporary: z.boolean().optional().default(false),
    aiConfidence: z.number().optional(),
  });

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  number: text("number").notNull(),
  client: text("client").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  lastEmailDate: timestamp("last_email_date"),
  items: jsonb("items"),
  leadId: integer("lead_id"),
  // New fields for enhanced invoice features
  category: text("category"),                         // For invoice categorization (service, product, etc.)
  paymentDate: timestamp("payment_date"),             // Date payment was received
  remindersSent: integer("reminders_sent").default(0), // Count of reminders sent
  reminderDates: jsonb("reminder_dates"),             // Tracks when reminders were sent
  notes: text("notes"),                               // Notes specific to this invoice
  taxRate: integer("tax_rate").default(0),            // Tax rate percentage (e.g., 20 for 20%)
});

export const insertInvoiceSchema = createInsertSchema(invoices)
  .pick({
    userId: true,
    number: true,
    client: true,
    amount: true,
    status: true,
    dueDate: true,
    lastEmailDate: true,
    items: true,
    leadId: true,
    // New fields
    category: true,
    paymentDate: true,
    remindersSent: true,
    reminderDates: true,
    notes: true,
    taxRate: true,
  })
  .extend({
    dueDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
    lastEmailDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
    paymentDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
    reminderDates: z.any().optional(),
    category: z.string().optional(),
    remindersSent: z.number().default(0),
    notes: z.string().optional(),
    taxRate: z.number().default(0),
  });

export const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
  category: z.string().optional(), // Service, Product, Expense, etc.
  tags: z.array(z.string()).optional(), // For automatic categorization
});

export const connectedServices = pgTable("connected_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  service: text("service").notNull(),
  connected: boolean("connected").default(false),
  credentials: jsonb("credentials"),
  username: text("username"),
  displayName: text("display_name"),
  lastSynced: timestamp("last_synced"),
  lastUpdated: timestamp("last_updated"),
  lastError: text("last_error"), // Add this field to store error messages
});

export const insertConnectedServiceSchema = createInsertSchema(connectedServices).pick({
  userId: true,
  service: true,
  connected: true,
  credentials: true,
  username: true,
  displayName: true,
  lastUpdated: true,
  lastError: true, // Include in insert schema
});

// Lead tracking
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  status: text("status").default("new"),
  priority: text("priority").default("medium"),
  lastContactDate: timestamp("last_contact_date").defaultNow(),
  nextContactDate: timestamp("next_contact_date"),
  notes: text("notes"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  value: integer("value"),
  metadata: jsonb("metadata"),
});

export const insertLeadSchema = createInsertSchema(leads)
  .pick({
    userId: true,
    name: true, 
    email: true,
    company: true,
    source: true,
    sourceId: true,
    status: true,
    priority: true,
    lastContactDate: true,
    nextContactDate: true,
    notes: true,
    tags: true,
    value: true,
    metadata: true,
  })
  .extend({
    lastContactDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
    nextContactDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
  });

// Define relations
// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // In cents
  description: text("description").notNull(),
  category: text("category").notNull(), // Travel, Office Supplies, etc.
  date: date("date").notNull(),
  receiptUrl: text("receipt_url"),
  vendor: text("vendor"),
  paymentMethod: text("payment_method"),
  taxDeductible: boolean("tax_deductible").default(true),
  taxRate: integer("tax_rate").default(0), // Tax rate percentage (e.g., 20 for 20%)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tags: text("tags").array(),
});

export const insertExpenseSchema = createInsertSchema(expenses)
  .pick({
    userId: true,
    amount: true,
    description: true,
    category: true,
    date: true,
    receiptUrl: true,
    vendor: true,
    paymentMethod: true,
    taxDeductible: true,
    taxRate: true,
    notes: true,
    tags: true,
  })
  .extend({
    date: z.union([
      z.string().transform(val => val ? new Date(val) : new Date()),
      z.date(),
    ]),
    receiptUrl: z.string().optional(),
    vendor: z.string().optional(),
    paymentMethod: z.string().optional(),
    taxDeductible: z.boolean().default(true),
    taxRate: z.number().default(0),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

// User settings for tax and default country
// Slack integration table to store user-specific Slack connections with multi-tenant support
export const slackIntegrations = pgTable("slack_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Removed unique constraint to allow multiple workspaces per user
  clientId: integer("client_id"), // Optional client ID for multi-tenant support
  clientName: varchar("client_name", { length: 100 }), // Optional client name for display
  accessToken: text("access_token").notNull(),
  teamId: varchar("team_id", { length: 100 }).notNull(),
  teamName: varchar("team_name", { length: 100 }),
  botUserId: varchar("bot_user_id", { length: 100 }),
  scope: text("scope"),
  incomingWebhook: jsonb("incoming_webhook"), // Store channel ID, channel name, and URL
  installedAt: timestamp("installed_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
  availableChannels: jsonb("available_channels"), // List of channels the bot can access
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Whether this is the default integration for this user
});

// Email integration table to store user-specific email service connections (Gmail, Outlook, etc.)
export const emailIntegrations = pgTable("email_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: varchar("provider", { length: 50 }).notNull(), // 'gmail', 'microsoft', etc.
  email: varchar("email", { length: 255 }),
  credentials: text("credentials").notNull(), // JSON string with tokens
  installedAt: timestamp("installed_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Whether this is the default email for this user
});

// Define relations for email integrations
export const emailIntegrationsRelations = relations(emailIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [emailIntegrations.userId],
    references: [users.id]
  })
}));

// Create insert schema for email integrations
export const insertEmailIntegrationSchema = createInsertSchema(emailIntegrations)
  .omit({ 
    id: true, 
    installedAt: true, 
    updatedAt: true,
    lastSyncedAt: true
  });

export type InsertEmailIntegration = z.infer<typeof insertEmailIntegrationSchema>;
export type EmailIntegration = typeof emailIntegrations.$inferSelect;

export const insertSlackIntegrationSchema = createInsertSchema(slackIntegrations)
  .pick({
    userId: true,
    clientId: true,
    clientName: true,
    accessToken: true,
    teamId: true,
    teamName: true,
    botUserId: true,
    scope: true,
    incomingWebhook: true,
    availableChannels: true,
    isDefault: true,
  });

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  country: text("country").default("US"),
  defaultTaxRate: integer("default_tax_rate").default(0),
  defaultCurrency: text("default_currency").default("USD"),
  fiscalYearStart: text("fiscal_year_start").default("01-01"), // MM-DD format
  businessName: text("business_name"),
  businessType: text("business_type"),
  taxIdentificationNumber: text("tax_identification_number"),
  expenseCategoriesCustom: jsonb("expense_categories_custom"), // User-defined expense categories
  lastTaskReminderSent: timestamp("last_task_reminder_sent"), // Track when the last task reminder was sent
  lastDailySummaryDate: timestamp("last_daily_summary_date"), // Track when the last daily summary was sent
  defaultSlackChannel: text("default_slack_channel") // Default Slack channel for notifications
});

export const insertUserSettingsSchema = createInsertSchema(userSettings)
  .pick({
    userId: true,
    country: true,
    defaultTaxRate: true,
    defaultCurrency: true,
    fiscalYearStart: true,
    businessName: true,
    businessType: true,
    taxIdentificationNumber: true,
    expenseCategoriesCustom: true,
    lastTaskReminderSent: true,
    lastDailySummaryDate: true,
    defaultSlackChannel: true,
  })
  .extend({
    country: z.string().default("US"),
    defaultTaxRate: z.number().default(0),
    defaultCurrency: z.string().default("USD"),
    fiscalYearStart: z.string().default("01-01"),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    taxIdentificationNumber: z.string().optional(),
    expenseCategoriesCustom: z.any().optional(),
    lastTaskReminderSent: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
    lastDailySummaryDate: z.union([
      z.string().transform(val => val ? new Date(val) : null),
      z.date().nullable(),
      z.null()
    ]).nullish(),
  });

export const usersRelations = relations(users, ({ many, one }) => ({
  emails: many(emails),
  tasks: many(tasks),
  events: many(events),
  invoices: many(invoices),
  expenses: many(expenses),
  connectedServices: many(connectedServices),
  leads: many(leads),
  sentEmails: many(sentEmails),
  slackIntegration: one(slackIntegrations, {
    fields: [users.id],
    references: [slackIntegrations.userId],
  }),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [tasks.leadId],
    references: [leads.id],
  }),
  email: one(emails, {
    fields: [tasks.emailId],
    references: [emails.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  email: one(emails, {
    fields: [events.emailId],
    references: [emails.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [invoices.leadId],
    references: [leads.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const connectedServicesRelations = relations(connectedServices, ({ one }) => ({
  user: one(users, {
    fields: [connectedServices.userId],
    references: [users.id],
  }),
}));

// AI Chat models for persistence
export const aiChats = pgTable("ai_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  pinned: boolean("pinned").default(false),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', or 'system'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAIChatSchema = createInsertSchema(aiChats).pick({
  userId: true,
  title: true,
  pinned: true,
});

export const insertAIMessageSchema = createInsertSchema(aiMessages).pick({
  chatId: true,
  role: true,
  content: true,
});

// Define relations for AI chats and messages
export const aiChatsRelations = relations(aiChats, ({ one, many }) => ({
  user: one(users, {
    fields: [aiChats.userId],
    references: [users.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  chat: one(aiChats, {
    fields: [aiMessages.chatId],
    references: [aiChats.id],
  }),
}));

// Define AI Message type for use with Claude API
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: number; // Optional ID for stored messages
  timestamp?: Date; // Optional timestamp
}

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferences = z.infer<typeof userPreferences>;

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export type InsertConnectedService = z.infer<typeof insertConnectedServiceSchema>;
export type ConnectedService = typeof connectedServices.$inferSelect;

export type InsertAIChat = z.infer<typeof insertAIChatSchema>;
export type AIChat = typeof aiChats.$inferSelect;

export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;
export type AIStoredMessage = typeof aiMessages.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Sent emails table to track outgoing emails
export const sentEmails = pgTable("sent_emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  to: text("to").notNull(),
  body: text("body").notNull(),
  messageId: text("message_id"),
  threadId: text("thread_id"),
  sentAt: timestamp("sent_at").defaultNow(),
  isHtml: boolean("is_html").default(false),
  attachments: jsonb("attachments"),
  type: text("type"), // 'regular', 'invoice', 'follow-up', 'meeting', etc.
  relatedEntityId: integer("related_entity_id"), // Can reference an invoice ID, event ID, etc.
  relatedEntityType: text("related_entity_type"), // 'invoice', 'event', etc.
  aiGenerated: boolean("ai_generated").default(true),
});

export const insertSentEmailSchema = createInsertSchema(sentEmails)
  .pick({
    userId: true,
    subject: true,
    to: true,
    body: true,
    messageId: true,
    threadId: true,
    sentAt: true,
    isHtml: true,
    attachments: true,
    type: true,
    relatedEntityId: true,
    relatedEntityType: true,
    aiGenerated: true,
  })
  .extend({
    messageId: z.string().optional(),
    threadId: z.string().optional(),
    attachments: z.any().optional(),
    type: z.string().optional(),
    relatedEntityId: z.number().optional(),
    relatedEntityType: z.string().optional(),
    aiGenerated: z.boolean().default(true),
  });

export const sentEmailsRelations = relations(sentEmails, ({ one }) => ({
  user: one(users, {
    fields: [sentEmails.userId],
    references: [users.id],
  }),
}));

// Beta Signups
export const betaSignups = pgTable("beta_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  businessEmail: text("business_email"),
  companyName: text("company_name"),
  role: text("role"),
  status: text("status").default("pending"), // pending, contacted, active, etc.
  joinedAt: timestamp("joined_at").defaultNow(),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  notifiedAt: timestamp("notified_at"),
});

export const insertBetaSignupSchema = createInsertSchema(betaSignups)
  .pick({
    email: true,
    fullName: true,
    businessEmail: true,
    companyName: true,
    role: true,
    status: true,
    ipAddress: true,
    referrer: true,
  })
  .extend({
    fullName: z.string().optional(),
    businessEmail: z.string().optional(),
    companyName: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(["pending", "contacted", "active"]).default("pending"),
    ipAddress: z.string().optional(),
    referrer: z.string().optional(),
  });

export type InsertSentEmail = z.infer<typeof insertSentEmailSchema>;
export type SentEmail = typeof sentEmails.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertBetaSignup = z.infer<typeof insertBetaSignupSchema>;
export type BetaSignup = typeof betaSignups.$inferSelect;

// Pending email replies table for semi-manual mode
export const pendingEmailReplies = pgTable("pending_email_replies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageId: text("message_id").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  originalMessageData: jsonb("original_message_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: text("status").notNull().default('pending'),
  actionTaken: text("action_taken"),
  actionDate: timestamp("action_date")
});

export const pendingEmailRepliesRelations = relations(pendingEmailReplies, ({ one }) => ({
  user: one(users, {
    fields: [pendingEmailReplies.userId],
    references: [users.id]
  })
}));

export const insertPendingEmailReplySchema = createInsertSchema(pendingEmailReplies)
  .omit({ 
    id: true, 
    updatedAt: true, 
    actionTaken: true, 
    actionDate: true 
  })
  .extend({
    // For backward compatibility, allow 'to' field to be used
    to: z.string().optional(),
  });

export type InsertPendingEmailReply = z.infer<typeof insertPendingEmailReplySchema>;
export type PendingEmailReply = typeof pendingEmailReplies.$inferSelect;

// Insert schema for activity log
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
