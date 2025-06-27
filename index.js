var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLog: () => activityLog,
  aiChats: () => aiChats,
  aiChatsRelations: () => aiChatsRelations,
  aiMessages: () => aiMessages,
  aiMessagesRelations: () => aiMessagesRelations,
  betaSignups: () => betaSignups,
  connectedServices: () => connectedServices,
  connectedServicesRelations: () => connectedServicesRelations,
  emailIntegrations: () => emailIntegrations,
  emailIntegrationsRelations: () => emailIntegrationsRelations,
  emails: () => emails,
  emailsRelations: () => emailsRelations,
  events: () => events,
  eventsRelations: () => eventsRelations,
  expenses: () => expenses,
  expensesRelations: () => expensesRelations,
  insertAIChatSchema: () => insertAIChatSchema,
  insertAIMessageSchema: () => insertAIMessageSchema,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertBetaSignupSchema: () => insertBetaSignupSchema,
  insertConnectedServiceSchema: () => insertConnectedServiceSchema,
  insertEmailIntegrationSchema: () => insertEmailIntegrationSchema,
  insertEmailSchema: () => insertEmailSchema,
  insertEventSchema: () => insertEventSchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertPendingEmailReplySchema: () => insertPendingEmailReplySchema,
  insertSentEmailSchema: () => insertSentEmailSchema,
  insertSlackIntegrationSchema: () => insertSlackIntegrationSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserSettingsSchema: () => insertUserSettingsSchema,
  invoiceItemSchema: () => invoiceItemSchema,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  leads: () => leads,
  leadsRelations: () => leadsRelations,
  pendingEmailReplies: () => pendingEmailReplies,
  pendingEmailRepliesRelations: () => pendingEmailRepliesRelations,
  sentEmails: () => sentEmails,
  sentEmailsRelations: () => sentEmailsRelations,
  slackIntegrations: () => slackIntegrations,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  userPreferences: () => userPreferences,
  userSettings: () => userSettings,
  userSettingsRelations: () => userSettingsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var activityLog, users, insertUserSchema, userPreferences, emails, insertEmailSchema, tasks, insertTaskSchema, events, insertEventSchema, invoices, insertInvoiceSchema, invoiceItemSchema, connectedServices, insertConnectedServiceSchema, leads, insertLeadSchema, expenses, insertExpenseSchema, slackIntegrations, emailIntegrations, emailIntegrationsRelations, insertEmailIntegrationSchema, insertSlackIntegrationSchema, userSettings, insertUserSettingsSchema, usersRelations, leadsRelations, emailsRelations, tasksRelations, eventsRelations, invoicesRelations, expensesRelations, userSettingsRelations, connectedServicesRelations, aiChats, aiMessages, insertAIChatSchema, insertAIMessageSchema, aiChatsRelations, aiMessagesRelations, sentEmails, insertSentEmailSchema, sentEmailsRelations, betaSignups, insertBetaSignupSchema, pendingEmailReplies, pendingEmailRepliesRelations, insertPendingEmailReplySchema, insertActivityLogSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    activityLog = pgTable("activity_log", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      date: text("date").notNull(),
      // YYYY-MM-DD format
      taskType: text("task_type").notNull(),
      // 'expense_created', 'email_processed', 'invoice_handled', etc.
      description: text("description").notNull(),
      details: jsonb("details"),
      // Additional structured data
      source: text("source"),
      // 'email', 'automation', 'manual'
      cost: text("cost"),
      // Track API costs if any
      status: text("status").default("completed"),
      // 'completed', 'failed', 'pending'
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      email: text("email"),
      fullName: text("full_name"),
      avatar: text("avatar"),
      createdAt: timestamp("created_at").defaultNow(),
      preferences: jsonb("preferences"),
      stripeCustomerId: text("stripe_customer_id"),
      googleRefreshToken: text("google_refresh_token")
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true,
      email: true,
      fullName: true
    });
    userPreferences = z.object({
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
      paymentTerms: z.number().default(30),
      // days
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
    emails = pgTable("emails", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      messageId: text("message_id").notNull().unique(),
      threadId: text("thread_id").notNull(),
      subject: text("subject").notNull(),
      from: text("from").notNull(),
      to: text("to").notNull(),
      body: text("body").notNull(),
      date: timestamp("date", { mode: "date" }).notNull(),
      isRead: boolean("is_read").default(false),
      isDeleted: boolean("is_deleted").default(false),
      isArchived: boolean("is_archived").default(false),
      labels: text("labels").array(),
      aiSummary: text("ai_summary"),
      processed: boolean("processed").default(false),
      createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow()
    });
    insertEmailSchema = createInsertSchema(emails).pick({
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
    tasks = pgTable("tasks", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      title: text("title").notNull(),
      description: text("description"),
      dueDate: timestamp("due_date"),
      completed: boolean("completed").default(false),
      priority: text("priority").default("medium"),
      aiGenerated: boolean("ai_generated").default(false),
      leadId: integer("lead_id"),
      assignedTo: text("assigned_to").default("me"),
      // "me", "binate_ai", or other team members later
      estimatedTime: integer("estimated_time").default(30),
      // Time in minutes
      emailId: integer("email_id"),
      // Reference to the email this task was created from
      source: text("source"),
      // "email", "chat", "dashboard", "system"
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertTaskSchema = createInsertSchema(tasks).pick({
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
      source: true
    }).extend({
      dueDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish(),
      leadId: z.number().optional(),
      emailId: z.number().optional(),
      source: z.enum(["email", "chat", "dashboard", "system"]).optional(),
      assignedTo: z.enum(["me", "binate_ai"]).default("me"),
      estimatedTime: z.number().optional().default(30)
      // Default to 30 minutes
    });
    events = pgTable("events", {
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertEventSchema = createInsertSchema(events).pick({
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
      aiConfidence: true
    }).extend({
      // Convert string dates to Date objects for the database
      startTime: z.string().transform((str) => new Date(str)),
      endTime: z.string().transform((str) => new Date(str)),
      emailId: z.number().optional(),
      aiNotes: z.string().optional(),
      contextNotes: z.string().optional(),
      temporary: z.boolean().optional().default(false),
      aiConfidence: z.number().optional()
    });
    invoices = pgTable("invoices", {
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
      category: text("category"),
      // For invoice categorization (service, product, etc.)
      paymentDate: timestamp("payment_date"),
      // Date payment was received
      remindersSent: integer("reminders_sent").default(0),
      // Count of reminders sent
      reminderDates: jsonb("reminder_dates"),
      // Tracks when reminders were sent
      notes: text("notes"),
      // Notes specific to this invoice
      taxRate: integer("tax_rate").default(0)
      // Tax rate percentage (e.g., 20 for 20%)
    });
    insertInvoiceSchema = createInsertSchema(invoices).pick({
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
      taxRate: true
    }).extend({
      dueDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish(),
      lastEmailDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish(),
      paymentDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish(),
      reminderDates: z.any().optional(),
      category: z.string().optional(),
      remindersSent: z.number().default(0),
      notes: z.string().optional(),
      taxRate: z.number().default(0)
    });
    invoiceItemSchema = z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
      category: z.string().optional(),
      // Service, Product, Expense, etc.
      tags: z.array(z.string()).optional()
      // For automatic categorization
    });
    connectedServices = pgTable("connected_services", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      service: text("service").notNull(),
      connected: boolean("connected").default(false),
      credentials: jsonb("credentials"),
      username: text("username"),
      displayName: text("display_name"),
      lastSynced: timestamp("last_synced"),
      lastUpdated: timestamp("last_updated"),
      lastError: text("last_error")
      // Add this field to store error messages
    });
    insertConnectedServiceSchema = createInsertSchema(connectedServices).pick({
      userId: true,
      service: true,
      connected: true,
      credentials: true,
      username: true,
      displayName: true,
      lastUpdated: true,
      lastError: true
      // Include in insert schema
    });
    leads = pgTable("leads", {
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
      metadata: jsonb("metadata")
    });
    insertLeadSchema = createInsertSchema(leads).pick({
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
      metadata: true
    }).extend({
      lastContactDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish(),
      nextContactDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish()
    });
    expenses = pgTable("expenses", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      amount: integer("amount").notNull(),
      // In cents
      description: text("description").notNull(),
      category: text("category").notNull(),
      // Travel, Office Supplies, etc.
      date: date("date").notNull(),
      receiptUrl: text("receipt_url"),
      vendor: text("vendor"),
      paymentMethod: text("payment_method"),
      taxDeductible: boolean("tax_deductible").default(true),
      taxRate: integer("tax_rate").default(0),
      // Tax rate percentage (e.g., 20 for 20%)
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      tags: text("tags").array()
    });
    insertExpenseSchema = createInsertSchema(expenses).pick({
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
      tags: true
    }).extend({
      date: z.union([
        z.string().transform((val) => val ? new Date(val) : /* @__PURE__ */ new Date()),
        z.date()
      ]),
      receiptUrl: z.string().optional(),
      vendor: z.string().optional(),
      paymentMethod: z.string().optional(),
      taxDeductible: z.boolean().default(true),
      taxRate: z.number().default(0),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional()
    });
    slackIntegrations = pgTable("slack_integrations", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      // Removed unique constraint to allow multiple workspaces per user
      clientId: integer("client_id"),
      // Optional client ID for multi-tenant support
      clientName: varchar("client_name", { length: 100 }),
      // Optional client name for display
      accessToken: text("access_token").notNull(),
      teamId: varchar("team_id", { length: 100 }).notNull(),
      teamName: varchar("team_name", { length: 100 }),
      botUserId: varchar("bot_user_id", { length: 100 }),
      scope: text("scope"),
      incomingWebhook: jsonb("incoming_webhook"),
      // Store channel ID, channel name, and URL
      installedAt: timestamp("installed_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      lastSyncedAt: timestamp("last_synced_at"),
      availableChannels: jsonb("available_channels"),
      // List of channels the bot can access
      isActive: boolean("is_active").default(true),
      isDefault: boolean("is_default").default(false)
      // Whether this is the default integration for this user
    });
    emailIntegrations = pgTable("email_integrations", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      provider: varchar("provider", { length: 50 }).notNull(),
      // 'gmail', 'microsoft', etc.
      email: varchar("email", { length: 255 }),
      credentials: text("credentials").notNull(),
      // JSON string with tokens
      installedAt: timestamp("installed_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      lastSyncedAt: timestamp("last_synced_at"),
      isActive: boolean("is_active").default(true),
      isDefault: boolean("is_default").default(false)
      // Whether this is the default email for this user
    });
    emailIntegrationsRelations = relations(emailIntegrations, ({ one }) => ({
      user: one(users, {
        fields: [emailIntegrations.userId],
        references: [users.id]
      })
    }));
    insertEmailIntegrationSchema = createInsertSchema(emailIntegrations).omit({
      id: true,
      installedAt: true,
      updatedAt: true,
      lastSyncedAt: true
    });
    insertSlackIntegrationSchema = createInsertSchema(slackIntegrations).pick({
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
      isDefault: true
    });
    userSettings = pgTable("user_settings", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().unique(),
      country: text("country").default("US"),
      defaultTaxRate: integer("default_tax_rate").default(0),
      defaultCurrency: text("default_currency").default("USD"),
      fiscalYearStart: text("fiscal_year_start").default("01-01"),
      // MM-DD format
      businessName: text("business_name"),
      businessType: text("business_type"),
      taxIdentificationNumber: text("tax_identification_number"),
      expenseCategoriesCustom: jsonb("expense_categories_custom"),
      // User-defined expense categories
      lastTaskReminderSent: timestamp("last_task_reminder_sent"),
      // Track when the last task reminder was sent
      lastDailySummaryDate: timestamp("last_daily_summary_date"),
      // Track when the last daily summary was sent
      defaultSlackChannel: text("default_slack_channel")
      // Default Slack channel for notifications
    });
    insertUserSettingsSchema = createInsertSchema(userSettings).pick({
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
      defaultSlackChannel: true
    }).extend({
      country: z.string().default("US"),
      defaultTaxRate: z.number().default(0),
      defaultCurrency: z.string().default("USD"),
      fiscalYearStart: z.string().default("01-01"),
      businessName: z.string().optional(),
      businessType: z.string().optional(),
      taxIdentificationNumber: z.string().optional(),
      expenseCategoriesCustom: z.any().optional(),
      lastTaskReminderSent: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish(),
      lastDailySummaryDate: z.union([
        z.string().transform((val) => val ? new Date(val) : null),
        z.date().nullable(),
        z.null()
      ]).nullish()
    });
    usersRelations = relations(users, ({ many, one }) => ({
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
        references: [slackIntegrations.userId]
      }),
      settings: one(userSettings, {
        fields: [users.id],
        references: [userSettings.userId]
      })
    }));
    leadsRelations = relations(leads, ({ one }) => ({
      user: one(users, {
        fields: [leads.userId],
        references: [users.id]
      })
    }));
    emailsRelations = relations(emails, ({ one }) => ({
      user: one(users, {
        fields: [emails.userId],
        references: [users.id]
      })
    }));
    tasksRelations = relations(tasks, ({ one }) => ({
      user: one(users, {
        fields: [tasks.userId],
        references: [users.id]
      }),
      lead: one(leads, {
        fields: [tasks.leadId],
        references: [leads.id]
      }),
      email: one(emails, {
        fields: [tasks.emailId],
        references: [emails.id]
      })
    }));
    eventsRelations = relations(events, ({ one }) => ({
      user: one(users, {
        fields: [events.userId],
        references: [users.id]
      }),
      email: one(emails, {
        fields: [events.emailId],
        references: [emails.id]
      })
    }));
    invoicesRelations = relations(invoices, ({ one }) => ({
      user: one(users, {
        fields: [invoices.userId],
        references: [users.id]
      }),
      lead: one(leads, {
        fields: [invoices.leadId],
        references: [leads.id]
      })
    }));
    expensesRelations = relations(expenses, ({ one }) => ({
      user: one(users, {
        fields: [expenses.userId],
        references: [users.id]
      })
    }));
    userSettingsRelations = relations(userSettings, ({ one }) => ({
      user: one(users, {
        fields: [userSettings.userId],
        references: [users.id]
      })
    }));
    connectedServicesRelations = relations(connectedServices, ({ one }) => ({
      user: one(users, {
        fields: [connectedServices.userId],
        references: [users.id]
      })
    }));
    aiChats = pgTable("ai_chats", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      title: text("title").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      pinned: boolean("pinned").default(false)
    });
    aiMessages = pgTable("ai_messages", {
      id: serial("id").primaryKey(),
      chatId: integer("chat_id").notNull(),
      role: text("role").notNull(),
      // 'user', 'assistant', or 'system'
      content: text("content").notNull(),
      timestamp: timestamp("timestamp").defaultNow()
    });
    insertAIChatSchema = createInsertSchema(aiChats).pick({
      userId: true,
      title: true,
      pinned: true
    });
    insertAIMessageSchema = createInsertSchema(aiMessages).pick({
      chatId: true,
      role: true,
      content: true
    });
    aiChatsRelations = relations(aiChats, ({ one, many }) => ({
      user: one(users, {
        fields: [aiChats.userId],
        references: [users.id]
      }),
      messages: many(aiMessages)
    }));
    aiMessagesRelations = relations(aiMessages, ({ one }) => ({
      chat: one(aiChats, {
        fields: [aiMessages.chatId],
        references: [aiChats.id]
      })
    }));
    sentEmails = pgTable("sent_emails", {
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
      type: text("type"),
      // 'regular', 'invoice', 'follow-up', 'meeting', etc.
      relatedEntityId: integer("related_entity_id"),
      // Can reference an invoice ID, event ID, etc.
      relatedEntityType: text("related_entity_type"),
      // 'invoice', 'event', etc.
      aiGenerated: boolean("ai_generated").default(true)
    });
    insertSentEmailSchema = createInsertSchema(sentEmails).pick({
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
      aiGenerated: true
    }).extend({
      messageId: z.string().optional(),
      threadId: z.string().optional(),
      attachments: z.any().optional(),
      type: z.string().optional(),
      relatedEntityId: z.number().optional(),
      relatedEntityType: z.string().optional(),
      aiGenerated: z.boolean().default(true)
    });
    sentEmailsRelations = relations(sentEmails, ({ one }) => ({
      user: one(users, {
        fields: [sentEmails.userId],
        references: [users.id]
      })
    }));
    betaSignups = pgTable("beta_signups", {
      id: serial("id").primaryKey(),
      email: text("email").notNull().unique(),
      fullName: text("full_name"),
      businessEmail: text("business_email"),
      companyName: text("company_name"),
      role: text("role"),
      status: text("status").default("pending"),
      // pending, contacted, active, etc.
      joinedAt: timestamp("joined_at").defaultNow(),
      ipAddress: text("ip_address"),
      referrer: text("referrer"),
      notifiedAt: timestamp("notified_at")
    });
    insertBetaSignupSchema = createInsertSchema(betaSignups).pick({
      email: true,
      fullName: true,
      businessEmail: true,
      companyName: true,
      role: true,
      status: true,
      ipAddress: true,
      referrer: true
    }).extend({
      fullName: z.string().optional(),
      businessEmail: z.string().optional(),
      companyName: z.string().optional(),
      role: z.string().optional(),
      status: z.enum(["pending", "contacted", "active"]).default("pending"),
      ipAddress: z.string().optional(),
      referrer: z.string().optional()
    });
    pendingEmailReplies = pgTable("pending_email_replies", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      messageId: text("message_id").notNull(),
      recipient: text("recipient").notNull(),
      subject: text("subject").notNull(),
      content: text("content").notNull(),
      originalMessageData: jsonb("original_message_data").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      status: text("status").notNull().default("pending"),
      actionTaken: text("action_taken"),
      actionDate: timestamp("action_date")
    });
    pendingEmailRepliesRelations = relations(pendingEmailReplies, ({ one }) => ({
      user: one(users, {
        fields: [pendingEmailReplies.userId],
        references: [users.id]
      })
    }));
    insertPendingEmailReplySchema = createInsertSchema(pendingEmailReplies).omit({
      id: true,
      updatedAt: true,
      actionTaken: true,
      actionDate: true
    }).extend({
      // For backward compatibility, allow 'to' field to be used
      to: z.string().optional()
    });
    insertActivityLogSchema = createInsertSchema(activityLog).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
var MemoryStore, PostgresSessionStore, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    MemoryStore = createMemoryStore(session);
    PostgresSessionStore = connectPg(session);
    DatabaseStorage = class {
      sessionStore;
      emailCache = /* @__PURE__ */ new Map();
      // Lead methods
      async getLeadsByUserId(userId) {
        try {
          const result = await db.select().from(leads).where(eq(leads.userId, userId));
          return result;
        } catch (error) {
          console.error("Error fetching leads by userId:", error);
          return [];
        }
      }
      async getLead(id) {
        try {
          const [result] = await db.select().from(leads).where(eq(leads.id, id));
          return result;
        } catch (error) {
          console.error("Error fetching lead by id:", error);
          return void 0;
        }
      }
      async createLead(leadData) {
        try {
          const [result] = await db.insert(leads).values(leadData).returning();
          return result;
        } catch (error) {
          console.error("Error creating lead:", error);
          throw error;
        }
      }
      async updateLead(userId, leadId, updates) {
        try {
          const [result] = await db.update(leads).set(updates).where(and(
            eq(leads.id, leadId),
            eq(leads.userId, userId)
          )).returning();
          return result;
        } catch (error) {
          console.error("Error updating lead:", error);
          return void 0;
        }
      }
      async deleteLead(userId, leadId) {
        try {
          const result = await db.delete(leads).where(and(
            eq(leads.id, leadId),
            eq(leads.userId, userId)
          ));
          return result.rowCount > 0;
        } catch (error) {
          console.error("Error deleting lead:", error);
          return false;
        }
      }
      // Provide a fallback method to access emails when the database isn't fully migrated
      getEmails() {
        return this.emailCache;
      }
      constructor() {
        this.sessionStore = new PostgresSessionStore({
          pool,
          createTableIfMissing: true
        });
      }
      // User methods
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
      async getAllUsers() {
        return await db.select().from(users);
      }
      async createUser(insertUser) {
        const defaultPreferences = {
          emailNotifications: true,
          darkMode: false,
          aiResponseStyle: "friendly"
        };
        const [newUser] = await db.insert(users).values({
          ...insertUser,
          preferences: defaultPreferences,
          avatar: "",
          stripeCustomerId: "",
          googleRefreshToken: ""
        }).returning();
        await this.updateConnectedService(newUser.id, "google", { connected: false, credentials: {} });
        await this.updateConnectedService(newUser.id, "stripe", { connected: false, credentials: {} });
        return newUser;
      }
      async updateUser(userId, updates) {
        const { id, password, ...allowedUpdates } = updates;
        try {
          const [updatedUser] = await db.update(users).set(allowedUpdates).where(eq(users.id, userId)).returning();
          if (!updatedUser) {
            throw new Error("User not found");
          }
          return updatedUser;
        } catch (error) {
          console.error("Error updating user:", error);
          throw error;
        }
      }
      async updateUserPreferences(userId, preferences) {
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error("User not found");
        }
        const updatedPreferences = {
          ...user.preferences,
          ...preferences
        };
        const [updatedUser] = await db.update(users).set({ preferences: updatedPreferences }).where(eq(users.id, userId)).returning();
        return updatedUser;
      }
      // Email methods
      async getEmailsByUserId(userId, options = {}) {
        try {
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
            queryText += " AND read = false";
          }
          queryText += " ORDER BY timestamp DESC";
          if (options.limit) {
            paramCount++;
            queryText += ` LIMIT $${paramCount}`;
            queryParams.push(options.limit);
          }
          console.log("Executing email query:", queryText.replace(/\s+/g, " "), "with params:", queryParams);
          const result = await pool.query(queryText, queryParams);
          const emails3 = result.rows;
          for (const email of emails3) {
            this.emailCache.set(email.id, email);
          }
          return emails3;
        } catch (error) {
          console.error("Error in getEmailsByUserId:", error);
          if (this.emailCache.size > 0) {
            const cachedEmails = Array.from(this.emailCache.values()).filter((email) => email.userId === userId);
            if (options.unreadOnly) {
              return cachedEmails.filter((email) => !email.isRead);
            }
            return cachedEmails;
          }
          return [];
        }
      }
      async getEmail(id) {
        try {
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
          const email = result.rows[0];
          if (email) {
            this.emailCache.set(email.id, email);
          }
          return email;
        } catch (error) {
          console.error("Error in getEmail:", error);
          return this.emailCache.get(id);
        }
      }
      // Add a new method to get email by messageId which is a string
      async getEmailByMessageId(userId, messageId) {
        try {
          console.log(`Looking for email with messageId: ${messageId} for user: ${userId}`);
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
          const email = result.rows[0];
          if (email) {
            this.emailCache.set(email.id, email);
            console.log(`Found email with id: ${email.id} for messageId: ${messageId}`);
          } else {
            console.log(`No email found with messageId: ${messageId}`);
          }
          return email;
        } catch (error) {
          console.error("Error in getEmailByMessageId:", error);
          for (const [_, email] of this.emailCache.entries()) {
            if (email.userId === userId && email.messageId === messageId) {
              return email;
            }
          }
          return void 0;
        }
      }
      async createOrUpdateEmail(email) {
        try {
          const existingEmail = await this.getEmailByMessageId(email.userId, email.messageId);
          if (existingEmail) {
            const result2 = await pool.query(`
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
            const updatedEmail = result2.rows[0];
            this.emailCache.set(updatedEmail.id, updatedEmail);
            return updatedEmail;
          }
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
          const newEmail = result.rows[0];
          this.emailCache.set(newEmail.id, newEmail);
          return newEmail;
        } catch (error) {
          console.error("Error in createOrUpdateEmail:", error);
          throw error;
        }
      }
      async updateEmail(userId, emailId, updates) {
        try {
          let queryParams = [];
          let setClause = "";
          let paramIndex = 1;
          if (updates.subject !== void 0) {
            setClause += `${setClause ? ", " : ""}subject = $${paramIndex++}`;
            queryParams.push(updates.subject);
          }
          if (updates.from !== void 0) {
            setClause += `${setClause ? ", " : ""}sender = $${paramIndex++}`;
            queryParams.push(updates.from);
          }
          if (updates.to !== void 0) {
            setClause += `${setClause ? ", " : ""}recipient = $${paramIndex++}`;
            queryParams.push(updates.to);
          }
          if (updates.body !== void 0) {
            setClause += `${setClause ? ", " : ""}body = $${paramIndex++}`;
            queryParams.push(updates.body);
          }
          if (updates.date !== void 0) {
            setClause += `${setClause ? ", " : ""}timestamp = $${paramIndex++}`;
            queryParams.push(updates.date);
          }
          if (updates.isRead !== void 0) {
            setClause += `${setClause ? ", " : ""}read = $${paramIndex++}`;
            queryParams.push(updates.isRead);
          }
          if (updates.labels !== void 0) {
            setClause += `${setClause ? ", " : ""}tags = $${paramIndex++}`;
            queryParams.push(updates.labels);
          }
          if (updates.aiSummary !== void 0) {
            setClause += `${setClause ? ", " : ""}ai_summary = $${paramIndex++}`;
            queryParams.push(updates.aiSummary);
          }
          if (!setClause) {
            const existingEmail = await this.getEmail(emailId);
            return existingEmail;
          }
          queryParams.push(emailId);
          queryParams.push(userId);
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
          const updatedEmail = result.rows[0];
          if (updatedEmail) {
            this.emailCache.set(updatedEmail.id, updatedEmail);
          }
          return updatedEmail;
        } catch (error) {
          console.error("Error in updateEmail:", error);
          return void 0;
        }
      }
      async deleteEmail(userId, emailId) {
        try {
          const result = await pool.query(`
        DELETE FROM emails 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [emailId, userId]);
          const success = result.rows.length > 0;
          if (success) {
            this.emailCache.delete(emailId);
          }
          return success;
        } catch (error) {
          console.error("Error in deleteEmail:", error);
          return false;
        }
      }
      // Task methods
      async getTasksByUserId(userId) {
        return db.select().from(tasks).where(eq(tasks.userId, userId));
      }
      async getTasksByLeadId(userId, leadId) {
        return db.select().from(tasks).where(
          and(
            eq(tasks.userId, userId),
            eq(tasks.leadId, leadId)
          )
        );
      }
      async getTask(id) {
        const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
        return task;
      }
      async createTask(task) {
        const [newTask] = await db.insert(tasks).values(task).returning();
        return newTask;
      }
      async updateTask(userId, taskId, updates) {
        const [task] = await db.update(tasks).set(updates).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).returning();
        return task;
      }
      async deleteTask(userId, taskId) {
        const result = await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).returning({ id: tasks.id });
        return result.length > 0;
      }
      // Event methods
      async getEventsByUserId(userId) {
        return db.select().from(events).where(eq(events.userId, userId));
      }
      async getEvent(id) {
        const [event] = await db.select().from(events).where(eq(events.id, id));
        return event;
      }
      async createEvent(event) {
        try {
          console.log("Creating event with data:", JSON.stringify(event, null, 2));
          const [newEvent] = await db.insert(events).values({
            ...event,
            aiNotes: event.aiNotes || ""
          }).returning();
          console.log("Event created successfully:", JSON.stringify(newEvent, null, 2));
          return newEvent;
        } catch (error) {
          console.error("Error creating event:", error);
          throw error;
        }
      }
      async updateEvent(userId, eventId, updates) {
        try {
          console.log("Updating event with data:", JSON.stringify(updates, null, 2));
          const updatedValues = {
            ...updates,
            updatedAt: /* @__PURE__ */ new Date()
          };
          const [updatedEvent] = await db.update(events).set(updatedValues).where(and(
            eq(events.id, eventId),
            eq(events.userId, userId)
          )).returning();
          console.log("Event updated successfully:", JSON.stringify(updatedEvent, null, 2));
          return updatedEvent;
        } catch (error) {
          console.error("Error updating event:", error);
          return void 0;
        }
      }
      // Invoice methods
      async getInvoicesByUserId(userId) {
        return db.select().from(invoices).where(eq(invoices.userId, userId));
      }
      async getInvoicesByLeadId(userId, leadId) {
        return db.select().from(invoices).where(
          and(
            eq(invoices.userId, userId),
            eq(invoices.leadId, leadId)
          )
        );
      }
      async getInvoice(id) {
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
        return invoice;
      }
      async createInvoice(invoice) {
        const [newInvoice] = await db.insert(invoices).values(invoice).returning();
        return newInvoice;
      }
      async updateInvoice(userId, invoiceId, updates) {
        const existingInvoice = await this.getInvoice(invoiceId);
        if (!existingInvoice || existingInvoice.userId !== userId) {
          return void 0;
        }
        const [updatedInvoice] = await db.update(invoices).set(updates).where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.userId, userId)
        )).returning();
        return updatedInvoice;
      }
      // Connected services methods
      async getConnectedServicesByUserId(userId) {
        return db.select().from(connectedServices).where(eq(connectedServices.userId, userId));
      }
      async getConnectedService(userId, serviceName) {
        const [service] = await db.select().from(connectedServices).where(and(
          eq(connectedServices.userId, userId),
          eq(connectedServices.service, serviceName)
        ));
        return service;
      }
      async updateConnectedService(userId, serviceName, updates) {
        const existing = await this.getConnectedService(userId, serviceName);
        if (existing) {
          console.log(
            `Updating ${serviceName} connection for user ${userId}:`,
            updates.connected !== void 0 ? `connected: ${updates.connected}` : "",
            updates.lastError !== void 0 ? `error: ${updates.lastError}` : ""
          );
          const [updated] = await db.update(connectedServices).set({
            ...updates,
            lastSynced: /* @__PURE__ */ new Date(),
            lastUpdated: /* @__PURE__ */ new Date()
          }).where(and(
            eq(connectedServices.userId, userId),
            eq(connectedServices.service, serviceName)
          )).returning();
          return updated;
        } else {
          console.log(`Creating new ${serviceName} connection for user ${userId}`);
          const [newService] = await db.insert(connectedServices).values({
            userId,
            service: serviceName,
            connected: updates.connected || false,
            credentials: updates.credentials || {},
            username: updates.username || null,
            displayName: updates.displayName || null,
            lastError: updates.lastError || null,
            lastSynced: /* @__PURE__ */ new Date(),
            lastUpdated: /* @__PURE__ */ new Date()
          }).returning();
          return newService;
        }
      }
      // AI Chat methods
      async getAIChatsByUserId(userId) {
        return db.select().from(aiChats).where(eq(aiChats.userId, userId)).orderBy(aiChats.updatedAt);
      }
      async getAIChat(id) {
        const [chat] = await db.select().from(aiChats).where(eq(aiChats.id, id));
        return chat;
      }
      async createAIChat(chat) {
        const [newChat] = await db.insert(aiChats).values({
          ...chat,
          pinned: chat.pinned || false
        }).returning();
        return newChat;
      }
      async updateAIChat(userId, chatId, updates) {
        const [updatedChat] = await db.update(aiChats).set({
          ...updates,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and(
          eq(aiChats.id, chatId),
          eq(aiChats.userId, userId)
        )).returning();
        return updatedChat;
      }
      async deleteAIChat(userId, chatId) {
        await db.delete(aiMessages).where(eq(aiMessages.chatId, chatId));
        const result = await db.delete(aiChats).where(and(
          eq(aiChats.id, chatId),
          eq(aiChats.userId, userId)
        )).returning({ id: aiChats.id });
        return result.length > 0;
      }
      // AI Message methods
      async getAIMessagesByChatId(chatId) {
        const messages = await db.select().from(aiMessages).where(eq(aiMessages.chatId, chatId)).orderBy(aiMessages.timestamp);
        return messages.map((msg) => ({
          id: msg.id,
          chatId: msg.chatId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));
      }
      async createAIMessage(message) {
        const [newMessage] = await db.insert(aiMessages).values(message).returning();
        await db.update(aiChats).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(aiChats.id, message.chatId));
        return {
          id: newMessage.id,
          chatId: newMessage.chatId,
          role: newMessage.role,
          content: newMessage.content,
          timestamp: newMessage.timestamp || void 0
        };
      }
      // Expense methods
      async getExpensesByUserId(userId) {
        try {
          const result = await db.select().from(expenses).where(eq(expenses.userId, userId));
          return result;
        } catch (error) {
          console.error("Error fetching expenses by userId:", error);
          return [];
        }
      }
      async getExpense(id) {
        try {
          const [result] = await db.select().from(expenses).where(eq(expenses.id, id));
          return result;
        } catch (error) {
          console.error("Error fetching expense by id:", error);
          return void 0;
        }
      }
      async createExpense(expense) {
        try {
          const [result] = await db.insert(expenses).values(expense).returning();
          return result;
        } catch (error) {
          console.error("Error creating expense:", error);
          throw error;
        }
      }
      async updateExpense(userId, expenseId, updates) {
        try {
          const [result] = await db.update(expenses).set(updates).where(and(
            eq(expenses.id, expenseId),
            eq(expenses.userId, userId)
          )).returning();
          return result;
        } catch (error) {
          console.error("Error updating expense:", error);
          return void 0;
        }
      }
      async deleteExpense(userId, expenseId) {
        try {
          const result = await db.delete(expenses).where(and(
            eq(expenses.id, expenseId),
            eq(expenses.userId, userId)
          ));
          return result.rowCount > 0;
        } catch (error) {
          console.error("Error deleting expense:", error);
          return false;
        }
      }
      // User Settings methods
      async getUserSettings(userId) {
        try {
          const [result] = await db.select().from(userSettings).where(eq(userSettings.user_id, userId));
          return result;
        } catch (error) {
          console.error("Error fetching user settings:", error);
          return void 0;
        }
      }
      async createUserSettings(settings) {
        try {
          const [result] = await db.insert(userSettings).values(settings).returning();
          return result;
        } catch (error) {
          console.error("Error creating user settings:", error);
          throw error;
        }
      }
      async updateUserSettings(userId, updates) {
        try {
          const existingSettings2 = await this.getUserSettings(userId);
          if (!existingSettings2) {
            return await this.createUserSettings({
              userId,
              ...updates
            });
          }
          const [result] = await db.update(userSettings).set({
            ...updates,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(userSettings.user_id, userId)).returning();
          return result;
        } catch (error) {
          console.error("Error updating user settings:", error);
          if (error.code === "23505") {
            return existingSettings;
          }
          throw error;
        }
      }
      // Sent Email methods
      async getSentEmailsByUserId(userId, options = {}) {
        try {
          let query = db.select().from(sentEmails).where(eq(sentEmails.userId, userId));
          if (options.type) {
            query = query.where(eq(sentEmails.type, options.type));
          }
          query = query.orderBy(desc(sentEmails.sentAt));
          if (options.limit) {
            query = query.limit(options.limit);
          }
          return await query;
        } catch (error) {
          console.error("Error getting sent emails by user ID:", error);
          return [];
        }
      }
      async getSentEmail(id) {
        try {
          const [result] = await db.select().from(sentEmails).where(eq(sentEmails.id, id));
          return result;
        } catch (error) {
          console.error("Error getting sent email by ID:", error);
          return void 0;
        }
      }
      async createSentEmail(sentEmail) {
        try {
          const emailData = {
            ...sentEmail,
            sentAt: sentEmail.sentAt || /* @__PURE__ */ new Date()
          };
          const [result] = await db.insert(sentEmails).values(emailData).returning();
          return result;
        } catch (error) {
          console.error("Error creating sent email:", error);
          throw error;
        }
      }
      async updateSentEmail(userId, sentEmailId, updates) {
        try {
          const [result] = await db.update(sentEmails).set(updates).where(and(
            eq(sentEmails.id, sentEmailId),
            eq(sentEmails.userId, userId)
          )).returning();
          return result;
        } catch (error) {
          console.error("Error updating sent email:", error);
          return void 0;
        }
      }
      // Beta Signup methods
      async getBetaSignups() {
        try {
          return await db.select().from(betaSignups).orderBy(desc(betaSignups.joinedAt));
        } catch (error) {
          console.error("Error getting beta signups:", error);
          return [];
        }
      }
      async getBetaSignupByEmail(email) {
        try {
          const [result] = await db.select().from(betaSignups).where(eq(betaSignups.email, email));
          return result;
        } catch (error) {
          console.error("Error getting beta signup by email:", error);
          return void 0;
        }
      }
      async createBetaSignup(signup) {
        try {
          console.log("=== DATABASE INSERT DEBUG ===");
          console.log("About to insert beta signup with data:", JSON.stringify(signup, null, 2));
          const insertData = {
            ...signup,
            joinedAt: /* @__PURE__ */ new Date()
          };
          console.log("Final insert data:", JSON.stringify(insertData, null, 2));
          const [result] = await db.insert(betaSignups).values(insertData).returning();
          console.log("Database insert successful! Result:", JSON.stringify(result, null, 2));
          console.log("============================");
          return result;
        } catch (error) {
          console.error("=== DATABASE INSERT ERROR ===");
          console.error("Error creating beta signup:", error);
          console.error("Signup data that failed:", JSON.stringify(signup, null, 2));
          console.error("=============================");
          throw error;
        }
      }
      // Activity Log methods
      async getActivityLog(userId) {
        try {
          return await db.select().from(activityLog).where(eq(activityLog.userId, userId)).orderBy(desc(activityLog.createdAt));
        } catch (error) {
          console.error("Error getting activity log:", error);
          return [];
        }
      }
      async createActivityLog(log2) {
        try {
          const [result] = await db.insert(activityLog).values({
            ...log2,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).returning();
          return result;
        } catch (error) {
          console.error("Error creating activity log:", error);
          throw error;
        }
      }
      async updateBetaSignup(id, updates) {
        try {
          const [result] = await db.update(betaSignups).set(updates).where(eq(betaSignups.id, id)).returning();
          return result;
        } catch (error) {
          console.error("Error updating beta signup:", error);
          return void 0;
        }
      }
      // Email logging methods
      async createEmailLog(log2) {
        try {
          console.log("Email Log:", {
            userId: log2.userId,
            type: log2.type,
            recipient: log2.recipient,
            subject: log2.subject,
            status: log2.status,
            metadata: log2.metadata,
            timestamp: /* @__PURE__ */ new Date()
          });
          return {
            id: Date.now(),
            ...log2,
            timestamp: /* @__PURE__ */ new Date()
          };
        } catch (error) {
          console.error("Error creating email log:", error);
          return null;
        }
      }
      // Task reminder tracking methods
      async getLastTaskReminderDate(userId) {
        try {
          const settings = await this.getUserSettings(userId);
          if (!settings) return null;
          return settings.lastTaskReminderSent ? new Date(settings.lastTaskReminderSent) : null;
        } catch (error) {
          console.error("Error getting last task reminder date:", error);
          return null;
        }
      }
      async updateTaskReminderDate(userId) {
        try {
          const settings = await this.getUserSettings(userId);
          if (!settings) {
            await this.createUserSettings({
              userId,
              lastTaskReminderSent: /* @__PURE__ */ new Date()
            });
          } else {
            await this.updateUserSettings(userId, {
              lastTaskReminderSent: /* @__PURE__ */ new Date()
            });
          }
          return true;
        } catch (error) {
          console.error("Error updating task reminder date:", error);
          return false;
        }
      }
      // Autonomic engine methods
      async getLastDailySummaryDate(userId) {
        try {
          const settings = await this.getUserSettings(userId);
          if (!settings) return null;
          return settings.lastDailySummaryDate ? new Date(settings.lastDailySummaryDate) : null;
        } catch (error) {
          console.error("Error getting last daily summary date:", error);
          return null;
        }
      }
      async updateDailySummaryDate(userId) {
        try {
          const settings = await this.getUserSettings(userId);
          if (!settings) return false;
          await this.updateUserSettings(userId, {
            lastDailySummaryDate: /* @__PURE__ */ new Date()
          });
          return true;
        } catch (error) {
          console.error("Error updating daily summary date:", error);
          return false;
        }
      }
      async getLastTaskReminderDate(userId) {
        try {
          const settings = await this.getUserSettings(userId);
          if (!settings) return null;
          return settings.lastTaskReminderDate ? new Date(settings.lastTaskReminderDate) : null;
        } catch (error) {
          console.error("Error getting last task reminder date:", error);
          return null;
        }
      }
      async updateTaskReminderDate(userId) {
        try {
          const settings = await this.getUserSettings(userId);
          if (!settings) return false;
          await this.updateUserSettings(userId, {
            lastTaskReminderDate: /* @__PURE__ */ new Date()
          });
          return true;
        } catch (error) {
          console.error("Error updating task reminder date:", error);
          return false;
        }
      }
      async getUpcomingEvents(userId, hours) {
        try {
          const now = /* @__PURE__ */ new Date();
          const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1e3);
          const events2 = await this.getEventsByUserId(userId);
          return events2.filter((event) => {
            const eventStart = new Date(event.startTime);
            return eventStart > now && eventStart < cutoff;
          });
        } catch (error) {
          console.error("Error getting upcoming events:", error);
          return [];
        }
      }
      async getOverdueInvoices(userId) {
        try {
          const now = /* @__PURE__ */ new Date();
          const invoices2 = await this.getInvoicesByUserId(userId);
          return invoices2.filter((invoice) => {
            if (invoice.status === "paid") return false;
            return invoice.dueDate && new Date(invoice.dueDate) < now;
          });
        } catch (error) {
          console.error("Error getting overdue invoices:", error);
          return [];
        }
      }
      // Pending Email Reply methods
      async createPendingEmailReply(data) {
        try {
          const [newReply] = await db.insert(pendingEmailReplies).values({
            userId: data.userId,
            messageId: data.messageId,
            recipient: data.recipient || data.to,
            // Use recipient if available, otherwise use to
            subject: data.subject,
            content: data.content,
            originalMessageData: data.originalMessageData,
            status: data.status || "pending",
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date(),
            actionTaken: null,
            actionDate: null
          }).returning();
          return newReply;
        } catch (error) {
          console.error("Error creating pending email reply:", error);
          throw error;
        }
      }
      async getPendingEmailReplies(userId) {
        try {
          const replies = await db.select().from(pendingEmailReplies).where(eq(pendingEmailReplies.userId, userId)).orderBy(desc(pendingEmailReplies.createdAt));
          return replies;
        } catch (error) {
          console.error("Error getting pending email replies:", error);
          return [];
        }
      }
      async getPendingEmailReply(id) {
        try {
          const [reply] = await db.select().from(pendingEmailReplies).where(eq(pendingEmailReplies.id, id));
          return reply;
        } catch (error) {
          console.error("Error getting pending email reply:", error);
          return void 0;
        }
      }
      async updatePendingEmailReply(id, data) {
        try {
          const [updatedReply] = await db.update(pendingEmailReplies).set({
            ...data,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(pendingEmailReplies.id, id)).returning();
          return updatedReply;
        } catch (error) {
          console.error("Error updating pending email reply:", error);
          return void 0;
        }
      }
      async deletePendingEmailReply(id) {
        try {
          const result = await db.delete(pendingEmailReplies).where(eq(pendingEmailReplies.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting pending email reply:", error);
          return false;
        }
      }
      // Slack integration methods with multi-tenant support
      async getSlackIntegration(userId, clientId) {
        try {
          if (clientId) {
            const [clientIntegration] = await db.select().from(slackIntegrations).where(eq(slackIntegrations.userId, userId)).where(eq(slackIntegrations.clientId, clientId));
            if (clientIntegration) {
              return clientIntegration;
            }
          }
          const [defaultIntegration] = await db.select().from(slackIntegrations).where(eq(slackIntegrations.userId, userId)).where(eq(slackIntegrations.isDefault, true));
          if (defaultIntegration) {
            return defaultIntegration;
          }
          const [firstIntegration] = await db.select().from(slackIntegrations).where(eq(slackIntegrations.userId, userId)).limit(1);
          return firstIntegration;
        } catch (error) {
          console.error("Error getting Slack integration:", error);
          return void 0;
        }
      }
      async getAllSlackIntegrations(userId) {
        try {
          const integrations = await db.select().from(slackIntegrations).where(eq(slackIntegrations.userId, userId));
          return integrations;
        } catch (error) {
          console.error("Error getting all Slack integrations:", error);
          return [];
        }
      }
      async getSlackIntegrationByClient(userId, clientId) {
        try {
          const [integration] = await db.select().from(slackIntegrations).where(eq(slackIntegrations.userId, userId)).where(eq(slackIntegrations.clientId, clientId));
          return integration;
        } catch (error) {
          console.error(`Error getting Slack integration for client ${clientId}:`, error);
          return void 0;
        }
      }
      async getDefaultSlackChannel(userId) {
        try {
          const user = await this.getUser(userId);
          if (user?.preferences?.slackNotifications) {
            const { slackNotifications } = user.preferences;
            if (slackNotifications.dailySummaryChannel) {
              return slackNotifications.dailySummaryChannel;
            }
          }
          try {
            const [settings] = await db.select({ defaultSlackChannel: userSettings.defaultSlackChannel }).from(userSettings).where(eq(userSettings.userId, userId));
            if (settings?.defaultSlackChannel) {
              return settings.defaultSlackChannel;
            }
          } catch (dbError) {
            console.warn(`Database error getting default channel: ${dbError.message}`);
          }
          return process.env.SLACK_CHANNEL_ID;
        } catch (error) {
          console.error("Error getting default Slack channel:", error);
          return void 0;
        }
      }
      async setDefaultSlackChannel(userId, channelId) {
        try {
          const [existingSettings2] = await db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.userId, userId));
          if (existingSettings2) {
            await db.update(userSettings).set({ defaultSlackChannel: channelId }).where(eq(userSettings.userId, userId));
          } else {
            await db.insert(userSettings).values({
              userId,
              defaultSlackChannel: channelId
            });
          }
          return true;
        } catch (error) {
          console.error("Error setting default Slack channel:", error);
          return false;
        }
      }
      async saveSlackIntegration(userId, data) {
        try {
          if (data.clientId) {
            const [existingClientIntegration] = await db.select().from(slackIntegrations).where(eq(slackIntegrations.userId, userId)).where(eq(slackIntegrations.clientId, data.clientId));
            if (existingClientIntegration) {
              await db.update(slackIntegrations).set({
                accessToken: data.accessToken,
                teamId: data.teamId,
                teamName: data.teamName,
                clientName: data.clientName,
                // Update client name if provided
                botUserId: data.botUserId,
                scope: data.scope,
                incomingWebhook: data.incomingWebhook,
                updatedAt: /* @__PURE__ */ new Date(),
                isActive: true,
                isDefault: data.isDefault || false,
                availableChannels: data.availableChannels || []
              }).where(eq(slackIntegrations.id, existingClientIntegration.id));
              if (data.isDefault) {
                await db.update(slackIntegrations).set({ isDefault: false }).where(eq(slackIntegrations.userId, userId)).where(ne(slackIntegrations.id, existingClientIntegration.id));
              }
            } else {
              const [newIntegration] = await db.insert(slackIntegrations).values({
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
              }).returning();
              if (data.isDefault && newIntegration) {
                await db.update(slackIntegrations).set({ isDefault: false }).where(eq(slackIntegrations.userId, userId)).where(ne(slackIntegrations.id, newIntegration.id));
              }
            }
          } else {
            const existingIntegration = await this.getSlackIntegration(userId);
            if (existingIntegration) {
              await db.update(slackIntegrations).set({
                accessToken: data.accessToken,
                teamId: data.teamId,
                teamName: data.teamName,
                botUserId: data.botUserId,
                scope: data.scope,
                incomingWebhook: data.incomingWebhook,
                updatedAt: /* @__PURE__ */ new Date(),
                isActive: true,
                isDefault: true,
                // Legacy integrations are default
                availableChannels: data.availableChannels || []
              }).where(eq(slackIntegrations.id, existingIntegration.id));
            } else {
              await db.insert(slackIntegrations).values({
                userId,
                accessToken: data.accessToken,
                teamId: data.teamId,
                teamName: data.teamName,
                botUserId: data.botUserId,
                scope: data.scope,
                incomingWebhook: data.incomingWebhook,
                availableChannels: data.availableChannels || [],
                isActive: true,
                isDefault: true
                // New legacy integrations are default
              });
            }
          }
        } catch (error) {
          console.error("Error saving Slack integration:", error);
          throw error;
        }
      }
      async updateSlackIntegration(userId, data) {
        try {
          if (data.clientId) {
            await db.update(slackIntegrations).set({
              ...data,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(slackIntegrations.userId, userId)).where(eq(slackIntegrations.clientId, data.clientId));
          } else if (data.integrationId) {
            await db.update(slackIntegrations).set({
              ...data,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(slackIntegrations.id, data.integrationId));
          } else {
            const integration = await this.getSlackIntegration(userId);
            if (integration) {
              await db.update(slackIntegrations).set({
                ...data,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(slackIntegrations.id, integration.id));
            }
          }
        } catch (error) {
          console.error("Error updating Slack integration:", error);
          throw error;
        }
      }
      async deleteSlackIntegration(userId, integrationId) {
        try {
          let result;
          if (integrationId) {
            result = await db.delete(slackIntegrations).where(eq(slackIntegrations.id, integrationId)).where(eq(slackIntegrations.userId, userId));
          } else {
            result = await db.delete(slackIntegrations).where(eq(slackIntegrations.userId, userId));
          }
          return result.rowCount > 0;
        } catch (error) {
          console.error("Error deleting Slack integration:", error);
          return false;
        }
      }
      // Email integration methods
      async getEmailIntegration(userId, provider) {
        try {
          const query = `
        SELECT * FROM email_integrations 
        WHERE user_id = $1 AND provider = $2 AND is_active = true
        ORDER BY is_default DESC
        LIMIT 1
      `;
          const result = await pool.query(query, [userId, provider]);
          return result.rows[0] || null;
        } catch (error) {
          console.error("Error getting email integration:", error);
          return null;
        }
      }
      async storeEmailIntegration(userId, provider, credentials) {
        try {
          let email = null;
          try {
            const credentialsObj = JSON.parse(credentials);
            email = credentialsObj.email || null;
          } catch (e) {
          }
          const existingIntegration = await this.getEmailIntegration(userId, provider);
          if (existingIntegration) {
            await this.updateEmailIntegration(userId, provider, credentials);
          } else {
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
          console.error("Error storing email integration:", error);
          throw error;
        }
      }
      async updateEmailIntegration(userId, provider, credentials) {
        try {
          let email = null;
          try {
            const credentialsObj = JSON.parse(credentials);
            email = credentialsObj.email || null;
          } catch (e) {
          }
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
          console.error("Error updating email integration:", error);
          throw error;
        }
      }
      async deleteEmailIntegration(userId, provider) {
        try {
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
          console.error("Error deleting email integration:", error);
          return false;
        }
      }
      /**
       * Update the last_synced_at timestamp for an email integration
       * This helps track when emails were last successfully synced
       */
      async updateEmailIntegrationLastSynced(userId, provider) {
        try {
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
      async updateUserLastEmailSyncDate(userId, date2) {
        try {
          await db.update(users).set({
            lastEmailSyncDate: date2
          }).where(eq(users.id, userId));
          return true;
        } catch (error) {
          console.error("Error updating last email sync date:", error);
          return false;
        }
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/config.ts
function getBaseUrl() {
  console.log("\n[BaseURL] getBaseUrl() function called - determining base URL...");
  console.log("[BaseURL] Environment variables:");
  console.log(`  FORCE_PRODUCTION_DOMAIN: ${process.env.FORCE_PRODUCTION_DOMAIN}`);
  console.log(`  DISABLE_DOMAIN_OVERRIDE: ${process.env.DISABLE_DOMAIN_OVERRIDE}`);
  console.log(`  CUSTOM_DOMAIN: ${process.env.CUSTOM_DOMAIN}`);
  console.log(`  BASE_URL: ${process.env.BASE_URL}`);
  console.log(`  REPL_ID: ${process.env.REPL_ID}`);
  console.log(`  REPL_SLUG: ${process.env.REPL_SLUG}`);
  if (process.env.CUSTOM_DOMAIN === "binateai.com" || process.env.FORCE_PRODUCTION_DOMAIN === "true") {
    console.log("[BaseURL] Using production domain: https://binateai.com");
    return "https://binateai.com";
  }
  if (process.env.REPL_SLUG === "binateai") {
    console.log("[BaseURL] Using Replit app domain: https://binateai.replit.app");
    return "https://binateai.replit.app";
  }
  if (process.env.REPL_ID) {
    const replicaId = "00-26x1ysnxshf8q";
    const devURL = `https://${process.env.REPL_ID}-${replicaId}.kirk.replit.dev`;
    console.log(`[BaseURL] Using current Replit preview domain: ${devURL}`);
    return devURL;
  }
  console.log("[BaseURL] Using development workspace domain: https://workspace.binateai25.repl.co");
  return "https://workspace.binateai25.repl.co";
  if (process.env.FORCE_PRODUCTION_DOMAIN === "true") {
    const productionUrl = "https://binateai.com";
    console.log("[BaseURL] FORCING production domain for OAuth:", productionUrl);
    return productionUrl;
  }
  if (process.env.CUSTOM_DOMAIN) {
    const customDomainUrl = `https://${process.env.CUSTOM_DOMAIN}`;
    console.log("[BaseURL] Using custom domain from CUSTOM_DOMAIN:", customDomainUrl);
    return customDomainUrl;
  }
  if (process.env.BASE_URL) {
    const baseUrl = process.env.BASE_URL;
    console.log("[BaseURL] Using explicit BASE_URL from environment:", baseUrl);
    return baseUrl;
  }
  if (!isReplit) {
    console.log("[BaseURL] Using localhost (non-Replit environment)");
    return `http://localhost:${process.env.PORT || 5e3}`;
  }
  console.log("[BaseURL] Falling back to Replit environment detection");
  if (process.env.REPL_ID === "004cd0fb-c62b-41f4-9092-516b03c6788b") {
    const devURL = "https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev";
    console.log(`[BaseURL] Using development fixed URL: ${devURL}`);
    return devURL;
  }
  if (process.env.REPL_SLUG === "binateai") {
    if (process.env.CUSTOM_DOMAIN) {
      const customURL = `https://${process.env.CUSTOM_DOMAIN}`;
      console.log(`[BaseURL] Using custom domain: ${customURL}`);
      return customURL;
    }
    const prodURL = "https://binateai.replit.app";
    console.log(`[BaseURL] Using production Replit URL: ${prodURL}`);
    return prodURL;
  }
  console.log("[BaseURL] WARNING: Using fallback URL generation - OAuth may not work correctly");
  if (process.env.REPL_ID) {
    const replURL = `https://${process.env.REPL_ID}-00-26x1ysnxshf8q.kirk.replit.dev`;
    console.log(`[BaseURL] Using Replit URL format with REPL_ID: ${replURL}`);
    return replURL;
  }
  const fallbackURL = `https://workspace.${process.env.REPL_OWNER || "binateai25"}.repl.co`;
  console.log(`[BaseURL] Using fallback URL format: ${fallbackURL}`);
  return fallbackURL;
}
var isReplit, isDevelopment, GOOGLE_CALLBACK_PATH, BASE_URL, GOOGLE_CALLBACK_URL, config, config_default;
var init_config = __esm({
  "server/config.ts"() {
    "use strict";
    isReplit = !!(process.env.REPLIT_SLUG || process.env.REPL_ID || process.env.REPLIT_OWNER);
    isDevelopment = process.env.NODE_ENV === "development";
    GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";
    console.log("====== REPLIT ENVIRONMENT DEBUG ======");
    console.log("REPL_ID:", process.env.REPL_ID || "undefined");
    console.log("REPL_SLUG:", process.env.REPL_SLUG || "undefined");
    console.log("REPL_OWNER:", process.env.REPL_OWNER || "undefined");
    console.log("HOST:", process.env.HOST || "undefined");
    console.log("====================================");
    BASE_URL = getBaseUrl();
    GOOGLE_CALLBACK_URL = `${BASE_URL}${GOOGLE_CALLBACK_PATH}`;
    console.log("-------- Application Configuration --------");
    console.log(`Environment: ${isDevelopment ? "Development" : "Production"}`);
    console.log(`Platform: ${isReplit ? "Replit" : "Local"}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Google OAuth Callback URL: ${GOOGLE_CALLBACK_URL}`);
    console.log("------------------------------------------");
    config = {
      isReplit,
      isDevelopment,
      baseUrl: BASE_URL,
      appUrl: BASE_URL,
      // Adding appUrl property for Slack integration
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: GOOGLE_CALLBACK_URL,
        callbackPath: GOOGLE_CALLBACK_PATH
      }
    };
    config_default = config;
  }
});

// server/services/slack-service.ts
import { WebClient } from "@slack/web-api";
function generateSlackOAuthUrl() {
  if (!SLACK_CLIENT_ID) {
    throw new Error("Slack client ID is not configured");
  }
  const redirectUri = `${config_default.appUrl}/api/integrations/slack/callback`;
  const state = Buffer.from(Date.now().toString()).toString("base64");
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.append("client_id", SLACK_CLIENT_ID);
  url.searchParams.append("scope", DEFAULT_SCOPE.join(" "));
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("state", state);
  return url.toString();
}
async function exchangeCodeForToken(code) {
  try {
    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
      throw new Error("Slack client credentials are not configured");
    }
    const redirectUri = `${config_default.appUrl}/api/integrations/slack/callback`;
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri
      }).toString()
    });
    if (!response.ok) {
      const statusText = response.statusText || "Unknown HTTP error";
      console.error(`HTTP error during Slack OAuth: ${response.status} ${statusText}`);
      throw new Error(`HTTP error during Slack OAuth: ${response.status} ${statusText}`);
    }
    const data = await response.json();
    if (!data.ok) {
      const errorDetails = data.error || "Unknown API error";
      console.error(`Slack OAuth API error: ${errorDetails}`);
      throw new Error(`Slack OAuth error: ${errorDetails}`);
    }
    return data;
  } catch (error) {
    let errorMessage = "Unknown error during OAuth flow";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error exchanging code for Slack token:", {
      errorDetails: errorMessage,
      codeProvided: !!code,
      clientIdConfigured: !!SLACK_CLIENT_ID,
      clientSecretConfigured: !!SLACK_CLIENT_SECRET
    });
    const enhancedError = new Error(`Slack OAuth exchange failed: ${errorMessage}`);
    throw enhancedError;
  }
}
async function createWebClient(userId, clientId) {
  try {
    const integration = await storage.getSlackIntegration(userId, clientId);
    if (!integration?.accessToken) {
      console.log(`Using system WebClient for user ${userId} (no ${clientId ? "client-specific" : "personal"} integration found)`);
      if (process.env.SLACK_BOT_TOKEN) {
        return new WebClient(process.env.SLACK_BOT_TOKEN);
      }
      return null;
    }
    return new WebClient(integration.accessToken);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error(`Error creating Slack WebClient for user ${userId} and client ${clientId || "default"}:`, errorMessage);
    return null;
  }
}
async function saveSlackIntegration(userId, data) {
  try {
    if (!data.access_token) {
      throw new Error("Missing required Slack access token in OAuth response");
    }
    if (!data.team?.id || !data.team?.name) {
      throw new Error("Missing required Slack team information in OAuth response");
    }
    const integration = {
      userId,
      accessToken: data.access_token,
      scope: data.scope,
      teamId: data.team.id,
      teamName: data.team.name,
      botUserId: data.bot_user_id,
      authedUser: data.authed_user,
      incomingWebhook: data.incoming_webhook,
      connected: true,
      connectedAt: /* @__PURE__ */ new Date(),
      availableChannels: []
      // Will be filled by syncChannels
    };
    await storage.saveSlackIntegration(userId, integration);
    console.log(`Successfully saved Slack integration for user ${userId} (team: ${data.team.name})`);
    await syncSlackChannels(userId);
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error(`Error saving Slack integration for user ${userId}:`, {
      errorDetails: errorMessage,
      hasAccessToken: !!data.access_token,
      hasTeamInfo: !!(data.team?.id && data.team?.name),
      debugInfo: {
        teamId: data.team?.id || "missing",
        teamName: data.team?.name || "missing",
        botUserId: data.bot_user_id || "missing",
        hasWebhook: !!data.incoming_webhook
      }
    });
    const enhancedError = new Error(`Failed to save Slack integration: ${errorMessage}`);
    throw enhancedError;
  }
}
async function syncSlackChannels(userId) {
  try {
    const webClient = await createWebClient(userId);
    if (!webClient) {
      throw new Error("Failed to create Slack web client");
    }
    const result = await webClient.conversations.list({
      types: "public_channel,private_channel"
    });
    if (!result.ok) {
      throw new Error(`Failed to get channels: ${result.error}`);
    }
    const channels = result.channels?.map((channel) => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private
    })) || [];
    await storage.updateSlackIntegration(userId, {
      availableChannels: channels,
      lastSyncedAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error(`Error syncing Slack channels for user ${userId}:`, errorMessage);
    if (error instanceof Error) {
      throw new Error(`Failed to sync Slack channels: ${error.message}`);
    }
    throw error;
  }
}
async function sendSlackMessage(userId, message, channelId, notificationType, clientId) {
  try {
    let webClient = await createWebClient(userId, clientId);
    if (!webClient && systemWebClient) {
      console.log(`Using system WebClient for user ${userId} (no personal integration found)`);
      webClient = systemWebClient;
    }
    if (!webClient) {
      console.error("No Slack integration available for user", userId, clientId ? `and client ${clientId}` : "");
      return {
        success: false,
        errorCode: "no_client",
        errorMessage: "No Slack integration available for this user"
      };
    }
    let targetChannelId = channelId;
    if (!targetChannelId && notificationType) {
      const user = await storage.getUser(userId);
      let slackSettings = {};
      try {
        if (user?.preferences) {
          const prefs = user.preferences;
          if (prefs.slackNotifications) {
            slackSettings = {
              taskAlertChannel: prefs.slackNotifications.taskAlertChannel,
              meetingReminderChannel: prefs.slackNotifications.meetingReminderChannel,
              invoiceFollowUpChannel: prefs.slackNotifications.invoiceFollowUpChannel,
              leadUpdateChannel: prefs.slackNotifications.leadUpdateChannel,
              dailySummaryChannel: prefs.slackNotifications.dailySummaryChannel
            };
          }
        }
      } catch (err) {
        console.error("Error extracting Slack notification settings:", err);
      }
      const channelMap = {
        ["task_reminder" /* TASK_REMINDER */]: slackSettings.taskAlertChannel,
        ["meeting_reminder" /* MEETING_REMINDER */]: slackSettings.meetingReminderChannel,
        ["invoice_due" /* INVOICE_DUE */]: slackSettings.invoiceFollowUpChannel,
        ["lead_detected" /* LEAD_DETECTED */]: slackSettings.leadUpdateChannel,
        ["daily_summary" /* DAILY_SUMMARY */]: slackSettings.dailySummaryChannel,
        ["expense_alert" /* EXPENSE_ALERT */]: slackSettings.dailySummaryChannel
        // Default to daily summary channel
      };
      targetChannelId = channelMap[notificationType];
    }
    if (!targetChannelId) {
      try {
        const defaultChannel = await storage.getDefaultSlackChannel(userId);
        if (defaultChannel) {
          console.log(`Using user's default Slack channel for user ${userId}`);
          targetChannelId = defaultChannel;
        }
      } catch (err) {
        console.error(`Error getting default Slack channel for user ${userId}:`, err);
      }
    }
    if (!targetChannelId && SLACK_DEFAULT_CHANNEL) {
      console.log(`Using system default channel (${SLACK_DEFAULT_CHANNEL}) for user ${userId}`);
      targetChannelId = SLACK_DEFAULT_CHANNEL;
    }
    if (!targetChannelId) {
      const integration = await storage.getSlackIntegration(userId);
      if (integration?.incomingWebhook?.channel_id) {
        targetChannelId = integration.incomingWebhook.channel_id;
      } else {
        console.error("No target channel found for Slack message");
        return {
          success: false,
          errorCode: "no_channel",
          errorMessage: "No target channel found for Slack message"
        };
      }
    }
    if (!targetChannelId) {
      console.error("No target channel ID available for Slack message");
      return {
        success: false,
        errorCode: "no_channel",
        errorMessage: "No Slack channel specified for this message"
      };
    }
    const result = await webClient.chat.postMessage({
      channel: targetChannelId,
      text: message
    });
    if (result.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        errorCode: "api_response_error",
        errorMessage: `Slack API returned unsuccessful response: ${result.error || "Unknown error"}`
      };
    }
  } catch (error) {
    console.error("Error sending Slack message:", error);
    let errorCode = "unknown";
    let errorMessage = "An unknown error occurred";
    let debugMessage = "No detailed error available";
    if (error instanceof Error) {
      debugMessage = error.message;
    } else if (error !== null && error !== void 0) {
      debugMessage = String(error);
    }
    const slackError = error;
    if (slackError?.data?.error === "not_in_channel") {
      errorCode = "not_in_channel";
      errorMessage = "Bot is not in the channel. Please add the bot to the channel first with /invite @BinateAI";
      console.error(errorMessage);
    } else if (slackError?.data?.error === "channel_not_found") {
      errorCode = "channel_not_found";
      errorMessage = "Channel not found. Please check the channel ID.";
      console.error(errorMessage);
    } else if (slackError?.data?.error === "invalid_auth") {
      errorCode = "invalid_auth";
      errorMessage = "Invalid authentication credentials for Slack API.";
      console.error(errorMessage);
    } else if (slackError?.data?.error === "token_revoked") {
      errorCode = "token_revoked";
      errorMessage = "Slack token has been revoked. The user needs to reconnect their Slack account.";
      console.error(errorMessage);
    }
    console.debug("Original Slack error details:", debugMessage);
    return {
      success: false,
      errorCode,
      errorMessage,
      debugDetails: debugMessage
    };
  }
}
async function disconnectSlackIntegration(userId) {
  try {
    const success = await storage.deleteSlackIntegration(userId);
    return { success };
  } catch (error) {
    let errorDetails = "Unknown error";
    if (error instanceof Error) {
      errorDetails = error.message;
    } else if (error !== null && error !== void 0) {
      errorDetails = String(error);
    }
    console.error("Error disconnecting Slack integration:", {
      userId,
      errorDetails,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return {
      success: false,
      errorCode: "integration_deletion_failed",
      errorMessage: "Failed to disconnect Slack integration. Please try again.",
      debugDetails: errorDetails
    };
  }
}
async function getSlackIntegration(userId, clientId) {
  try {
    if (clientId) {
      const clientIntegration = await storage.getSlackIntegrationByClient(userId, clientId);
      if (clientIntegration) {
        const { accessToken: accessToken2, ...safeIntegration2 } = clientIntegration;
        return {
          ...safeIntegration2,
          connected: !!clientIntegration.accessToken
        };
      }
      return null;
    }
    const integrations = await storage.getAllSlackIntegrations(userId);
    if (!integrations || integrations.length === 0) {
      return null;
    }
    const defaultIntegration = integrations.find((integration) => integration.isDefault);
    if (defaultIntegration) {
      const { accessToken: accessToken2, ...safeIntegration2 } = defaultIntegration;
      return {
        ...safeIntegration2,
        connected: !!defaultIntegration.accessToken
      };
    }
    const firstIntegration = integrations[0];
    const { accessToken, ...safeIntegration } = firstIntegration;
    return {
      ...safeIntegration,
      connected: !!firstIntegration.accessToken
    };
  } catch (error) {
    console.error("Error getting Slack integration:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.debug("Detailed Slack integration error:", errorMessage);
    return null;
  }
}
async function sendMeetingReminderNotification(userId, meetingTitle, startTime, meetingId, location, meetingUrl) {
  const formattedTime = startTime.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  let message = `\u{1F4C5} *Meeting Reminder*
Meeting: "${meetingTitle}" starts at ${formattedTime}
`;
  if (location) {
    message += `Location: ${location}
`;
  }
  if (meetingUrl) {
    message += `Meeting URL: ${meetingUrl}
`;
  }
  message += `View it in Binate AI: ${config_default.appUrl}/app/calendar/${meetingId}`;
  return await sendSlackMessage(userId, message, void 0, "meeting_reminder" /* MEETING_REMINDER */);
}
var SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, SLACK_DEFAULT_CHANNEL, systemWebClient, DEFAULT_SCOPE, NotificationType;
var init_slack_service = __esm({
  "server/services/slack-service.ts"() {
    "use strict";
    init_storage();
    init_config();
    SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
    SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
    SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
    SLACK_DEFAULT_CHANNEL = process.env.SLACK_CHANNEL_ID;
    systemWebClient = SLACK_BOT_TOKEN ? new WebClient(SLACK_BOT_TOKEN) : null;
    DEFAULT_SCOPE = [
      "chat:write",
      "channels:read",
      "channels:join",
      "chat:write.public",
      "incoming-webhook"
    ];
    NotificationType = /* @__PURE__ */ ((NotificationType2) => {
      NotificationType2["TASK_REMINDER"] = "task_reminder";
      NotificationType2["MEETING_REMINDER"] = "meeting_reminder";
      NotificationType2["INVOICE_DUE"] = "invoice_due";
      NotificationType2["LEAD_DETECTED"] = "lead_detected";
      NotificationType2["DAILY_SUMMARY"] = "daily_summary";
      NotificationType2["EXPENSE_ALERT"] = "expense_alert";
      return NotificationType2;
    })(NotificationType || {});
  }
});

// server/services/lead-detection.ts
import Anthropic from "@anthropic-ai/sdk";
async function analyzeEmailForLead(email) {
  try {
    const prompt = `
You are an AI assistant helping to identify potential leads from emails. 
Analyze the email content below and identify if it contains a potential business lead.

Email Subject: ${email.subject}
From: ${email.from}
To: ${email.to}
Email Content: ${email.body}

A lead is someone who has expressed interest in our services or products, asked for more information, or requested a quote/proposal.
If this email is from a potential client or customer showing interest, extract the following information:
- Name of the person contacting us
- Email address
- Company name (if mentioned)
- Estimated potential value (if possible to determine)
- Any relevant notes about their needs
- Appropriate tags (e.g., "web-design", "consulting", "urgent", "follow-up-needed")

Return the data in JSON format with these fields. If this is not a lead, return null.
`;
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1e3,
      system: "You're a helpful assistant specialized in identifying business leads. Return ONLY valid JSON without any explanations or markdown formatting. If something isn't a lead, return null.",
      messages: [
        { role: "user", content: prompt }
      ]
    });
    const content = response.content[0].text;
    try {
      const jsonResponse = JSON.parse(content);
      if (jsonResponse === null) {
        return null;
      }
      if (!jsonResponse.name || !jsonResponse.email) {
        console.log("AI response missing required lead fields:", jsonResponse);
        return null;
      }
      return {
        name: jsonResponse.name,
        email: jsonResponse.email,
        company: jsonResponse.company || "",
        value: jsonResponse.value ? parseInt(jsonResponse.value, 10) : void 0,
        notes: jsonResponse.notes || "",
        tags: Array.isArray(jsonResponse.tags) ? jsonResponse.tags : []
      };
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return null;
    }
  } catch (error) {
    console.error("Error analyzing email for lead:", error);
    return null;
  }
}
async function createLeadFromEmail(userId, leadData, sourceEmail) {
  const lead = {
    userId,
    name: leadData.name,
    email: leadData.email,
    company: leadData.company || "",
    source: "email",
    sourceId: sourceEmail.messageId,
    status: "new",
    priority: "medium",
    lastContactDate: new Date(sourceEmail.date),
    notes: leadData.notes || "",
    tags: leadData.tags || [],
    value: leadData.value
  };
  return await storage.createLead(lead);
}
async function processEmailForLeads(email) {
  if (email.from.toLowerCase().includes("@binate.ai")) {
    return null;
  }
  const existingLeads = await storage.getLeadsByUserId(email.userId);
  const alreadyProcessed = existingLeads.some(
    (lead2) => lead2.source === "email" && lead2.sourceId === email.messageId
  );
  if (alreadyProcessed) {
    return null;
  }
  const leadData = await analyzeEmailForLead(email);
  if (!leadData) {
    return null;
  }
  const lead = await createLeadFromEmail(email.userId, leadData, email);
  console.log(`Created new lead from email: ${lead.name} (${lead.email})`);
  return lead;
}
var anthropic;
var init_lead_detection = __esm({
  "server/services/lead-detection.ts"() {
    "use strict";
    init_storage();
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
});

// server/ai-service.ts
var ai_service_exports = {};
__export(ai_service_exports, {
  EXPENSE_CATEGORIES: () => EXPENSE_CATEGORIES,
  categorizeExpense: () => categorizeExpense,
  estimateTaskTime: () => estimateTaskTime,
  extractInvoiceRequestFromEmail: () => extractInvoiceRequestFromEmail,
  extractJsonFromResponse: () => extractJsonFromResponse,
  extractLeadFromEmail: () => extractLeadFromEmail,
  generateEmailReply: () => generateEmailReply,
  generateInvoiceFollowUpEmail: () => generateInvoiceFollowUpEmail,
  generateMeetingAgenda: () => generateMeetingAgenda,
  generateMeetingPrep: () => generateMeetingPrep,
  generateMeetingSummaryFromNotes: () => generateMeetingSummaryFromNotes,
  generateTaskSuggestions: () => generateTaskSuggestions,
  generateTasksFromEmailContent: () => generateTasksFromEmailContent,
  getClaudeResponse: () => getClaudeResponse,
  getClaudeResponseFromHistory: () => getClaudeResponseFromHistory,
  handleAssistantQuery: () => handleAssistantQuery,
  suggestLeadPriority: () => suggestLeadPriority,
  summarizeEmail: () => summarizeEmail,
  timeEstimationResponseSchema: () => timeEstimationResponseSchema
});
import Anthropic2 from "@anthropic-ai/sdk";
import { z as z2 } from "zod";
async function estimateTaskTime(taskDetails) {
  const defaultResponse = {
    estimatedTime: 30,
    confidence: 0.7,
    reasoning: "Default estimation for tasks with minimal context."
  };
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY is not set, using default time estimation");
    return defaultResponse;
  }
  try {
    const prompt = `
      You are an AI assistant specializing in estimating how long tasks will take to complete.
      
      TASK INFORMATION:
      Title: ${taskDetails.title}
      ${taskDetails.description ? `Description: ${taskDetails.description}` : "No detailed description provided."}
      
      Please analyze this task and estimate:
      1. How many minutes it will likely take to complete (between 5 and 480 minutes)
      2. Your confidence level in this estimate (between 0 and 1)
      3. Brief reasoning for your estimation
      
      Consider factors like:
      - Task complexity and scope
      - Whether it requires research, creation, or review
      - If communication or coordination with others is needed
      - Similar tasks typically encountered in professional settings
      
      Respond in JSON format with the following structure:
      {
        "estimatedTime": number, // in minutes (integer between 5 and 480)
        "confidence": number, // between 0 and 1
        "reasoning": "explanation for your estimate"
      }
    `;
    console.log(`Estimating time for task: "${taskDetails.title}"`);
    const message = await anthropic2.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: "You are an expert task time estimation AI. Respond only with valid JSON.",
      messages: [{ role: "user", content: prompt }]
    });
    if (message.content && message.content.length > 0 && "text" in message.content[0]) {
      const responseText = message.content[0].text.trim();
      try {
        const parsedResponse = extractJsonFromResponse(responseText);
        const validatedResponse = timeEstimationResponseSchema.parse(parsedResponse);
        return {
          estimatedTime: Math.round(validatedResponse.estimatedTime),
          // Ensure integer
          confidence: validatedResponse.confidence,
          reasoning: validatedResponse.reasoning
        };
      } catch (parseError) {
        console.error("Error parsing time estimation JSON:", parseError);
        return defaultResponse;
      }
    }
    console.warn("No valid content in Claude response for time estimation");
    return defaultResponse;
  } catch (error) {
    console.error("Error estimating task time:", error);
    return defaultResponse;
  }
}
function extractJsonFromResponse(response) {
  try {
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    return JSON.parse(response.trim());
  } catch (error) {
    console.error("Error extracting JSON from Claude response:", error);
    throw new Error("Failed to extract valid JSON from the AI response");
  }
}
async function getClaudeResponse(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "AI functionality is not available. Please add an ANTHROPIC_API_KEY.";
  }
  try {
    console.log("Attempting to call Anthropic API with single message...");
    console.log(`Request to Anthropic API: model=${MODEL}, max_tokens=1000, prompt length=${prompt.length}`);
    const message = await anthropic2.messages.create({
      model: MODEL,
      max_tokens: 1e3,
      messages: [{ role: "user", content: prompt }]
    });
    if (message.content && message.content.length > 0 && "text" in message.content[0]) {
      return message.content[0].text;
    }
    return "No response from AI service";
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    let errorMessage = "";
    if (error.error && error.error.error && error.error.error.message) {
      errorMessage = `${error.status} ${JSON.stringify(error.error)}`;
      if (error.error.error.message.includes("credit balance is too low")) {
        errorMessage = "Anthropic API credit balance is too low. Please update your API key with sufficient credits.";
      }
    } else {
      errorMessage = error.message || "Unknown error occurred";
    }
    throw new Error(`Failed to get AI response: ${errorMessage}`);
  }
}
async function getClaudeResponseFromHistory(messages, systemPrompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "AI functionality is not available. Please add an ANTHROPIC_API_KEY.";
  }
  try {
    console.log("Attempting to call Anthropic API...");
    const formattedMessages = messages.filter(
      (msg) => (
        // The Anthropic API only accepts 'user' and 'assistant' roles
        msg.role === "user" || msg.role === "assistant"
      )
    ).map((message2) => ({
      role: message2.role,
      content: message2.content
    }));
    console.log(`Request to Anthropic API: model=${MODEL}, max_tokens=1000, message count=${formattedMessages.length}`);
    const message = await anthropic2.messages.create({
      model: MODEL,
      max_tokens: 1e3,
      messages: formattedMessages,
      system: systemPrompt
    });
    if (message.content && message.content.length > 0 && "text" in message.content[0]) {
      return message.content[0].text;
    }
    return "No response from AI service";
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    let errorMessage = "";
    if (error.error && error.error.error && error.error.error.message) {
      errorMessage = `${error.status} ${JSON.stringify(error.error)}`;
      if (error.error.error.message.includes("credit balance is too low")) {
        errorMessage = "Anthropic API credit balance is too low. Please update your API key with sufficient credits.";
      }
    } else {
      errorMessage = error.message || "Unknown error occurred";
    }
    throw new Error(`Failed to get AI response: ${errorMessage}`);
  }
}
async function generateEmailReply(suggestedReply, context) {
  const stylePrompt = context.userPreferences?.aiResponseStyle === "formal" ? "formal and professional" : context.userPreferences?.aiResponseStyle === "casual" ? "friendly and casual" : "balanced and natural";
  const prompt = `
    You are an AI assistant helping to customize an email reply.
    
    The suggested reply is:
    """
    ${suggestedReply}
    """
    
    Please refine this reply to be ${stylePrompt} in tone. 
    Maintain the key points but adjust the language, adding a professional signature at the end.
    The reply should be well-structured with appropriate paragraphs and be ready to send.
    
    Only return the email body - no formatting tags, no subject line, just the reply content.
  `;
  try {
    const response = await getClaudeResponse(prompt);
    return response.trim();
  } catch (error) {
    console.error("Error generating email reply:", error);
    return suggestedReply;
  }
}
async function summarizeEmail(emailContent) {
  const prompt = `
    Summarize the following email in a concise manner, highlighting the key points, any action items, and important deadlines:
    
    """
    ${emailContent}
    """
    
    Provide a summary in 3-5 bullet points.
  `;
  try {
    return await getClaudeResponse(prompt);
  } catch (error) {
    console.error("Error summarizing email:", error);
    throw error;
  }
}
async function generateMeetingPrep(eventDetails) {
  const eventDate = new Date(eventDetails.startTime);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const attendeesStr = Array.isArray(eventDetails.attendees) && eventDetails.attendees.length > 0 ? eventDetails.attendees.filter(Boolean).join(", ") : typeof eventDetails.attendees === "string" ? eventDetails.attendees : "No attendees specified";
  let durationMinutes = 30;
  if (eventDetails.startTime && eventDetails.endTime) {
    const start = new Date(eventDetails.startTime);
    const end = new Date(eventDetails.endTime);
    durationMinutes = Math.round((end.getTime() - start.getTime()) / 6e4);
  }
  let meetingType = "standard";
  const titleLower = (eventDetails.title || "").toLowerCase();
  const descLower = (eventDetails.description || "").toLowerCase();
  if (titleLower.includes("interview") || descLower.includes("interview")) {
    meetingType = "interview";
  } else if (titleLower.includes("brainstorm") || descLower.includes("brainstorm")) {
    meetingType = "brainstorming";
  } else if (titleLower.includes("decision") || descLower.includes("decision") || descLower.includes("decide")) {
    meetingType = "decision-making";
  } else if (titleLower.includes("status") || titleLower.includes("update") || descLower.includes("update")) {
    meetingType = "status-update";
  } else if (titleLower.includes("review") || descLower.includes("review")) {
    meetingType = "review";
  } else if (titleLower.includes("planning") || descLower.includes("planning") || descLower.includes("plan")) {
    meetingType = "planning";
  }
  const prompt = `
    You are an AI assistant specialized in meeting preparation. 
    
    Prepare meeting notes for the following meeting:
    
    Title: ${eventDetails.title}
    Date: ${formattedDate}
    Time: ${formattedTime}
    Duration: ${durationMinutes} minutes
    Location: ${eventDetails.location || "Not specified"}
    Meeting URL: ${eventDetails.meetingUrl || "Not provided"}
    Attendees: ${attendeesStr}
    Description: ${eventDetails.description || "No description provided"}
    Meeting Type: ${meetingType}
    
    Your response should include:
    
    PART 1: MEETING SUMMARY
    - A concise 2-3 sentence overview of what the meeting is about and its purpose
    
    PART 2: CONTEXT & PREPARATION
    - Key background information needed for this meeting
    - Suggested talking points based on the meeting title and description
    - Questions to prepare for or ask during the meeting
    - Any documents or information that would be helpful to review beforehand
    - For meetings with specific people, suggestions on topics they might want to discuss
    - For decision meetings, options to consider with pros/cons
    
    Format this information clearly with headings and bullet points. Use professional language.
  `;
  try {
    console.log(`Generating meeting prep for: "${eventDetails.title}"`);
    const response = await getClaudeResponse(prompt);
    let summary = "";
    let context = response;
    if (response.includes("PART 1") && response.includes("PART 2")) {
      const parts = response.split("PART 2");
      if (parts.length >= 1) {
        const summarySection = parts[0].replace("PART 1", "").replace("MEETING SUMMARY", "").trim();
        const contextSection = "PART 2" + parts[1].trim();
        summary = summarySection;
        context = contextSection;
      }
    } else {
      const paragraphs = response.split("\n\n");
      summary = paragraphs[0].trim();
      context = response;
    }
    return { summary, context };
  } catch (error) {
    console.error("Error generating meeting prep:", error);
    return {
      summary: `Preparation notes for: ${eventDetails.title}`,
      context: `
        Meeting Details:
        Date: ${formattedDate}
        Time: ${formattedTime}
        Duration: ${durationMinutes} minutes
        Location: ${eventDetails.location || "Not specified"}
        Attendees: ${attendeesStr}
        
        Note: Unable to generate detailed preparation notes. Please review the meeting description.
      `
    };
  }
}
async function generateInvoiceFollowUpEmail(invoiceData, invoiceNumber, daysPastDue, userContext) {
  const tone = daysPastDue > 30 ? "firm but polite" : "friendly but professional";
  const urgency = daysPastDue > 45 ? "high" : daysPastDue > 15 ? "medium" : "low";
  const amount = typeof invoiceData.totalAmount === "number" ? invoiceData.totalAmount.toFixed(2) : typeof invoiceData.amount === "number" ? invoiceData.amount.toFixed(2) : "specified amount";
  const formattedDueDate = invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "the due date";
  const clientName = invoiceData.clientName || invoiceData.client || "Valued Client";
  const prompt = `
    You are an AI assistant helping to draft a payment reminder email for an overdue invoice.
    
    Here's the invoice information:
    - Invoice Number: ${invoiceNumber}
    - Client: ${clientName}
    - Amount: $${amount}
    - Due Date: ${formattedDueDate}
    - Days Past Due: ${daysPastDue}
    
    Please draft a ${tone} payment reminder email with ${urgency} urgency.
    
    The email should:
    - Start with a polite greeting
    - Reference the specific invoice number and amount
    - Mention that it's ${daysPastDue} days overdue
    - Request prompt payment
    - For invoices more than 30 days overdue, mention potential late fees or next steps
    - Include clear payment instructions
    - End with a professional sign-off
    - Include the sender's name (${userContext.fullName || "Business Owner"})
    
    Only return the email body - no subject line, no formatting tags, just the content.
  `;
  try {
    const response = await getClaudeResponse(prompt);
    return response.trim();
  } catch (error) {
    console.error("Error generating invoice follow-up email:", error);
    return `
      Dear ${clientName},
      
      I hope this email finds you well. I'm writing to follow up on invoice #${invoiceNumber} for $${amount}, which was due on ${formattedDueDate} and is currently ${daysPastDue} days overdue.
      
      Please let me know if you have any questions about this invoice or if there's anything I can do to facilitate payment.
      
      Thank you for your prompt attention to this matter.
      
      Best regards,
      ${userContext.fullName || "Business Owner"}
    `.trim();
  }
}
async function generateTasksFromEmailContent(emailContent) {
  try {
    const prompt = `
      You are Binate AI, an intelligent task extraction assistant.
      Analyze the following email content and identify any potential tasks or action items.
      
      EMAIL CONTENT:
      """
      ${emailContent}
      """
      
      For each task you identify, please provide:
      1. A clear, concise title for the task
      2. Any relevant description or context
      3. A priority level (high, medium, or low)
      4. A suggested due date (if mentioned or implied)
      5. Who should be assigned to it ("me" or "binate_ai")
      
      Format your response as a valid JSON array of task objects with the following structure:
      [
        {
          "title": "Task title",
          "description": "Task description and context",
          "priority": "high|medium|low",
          "dueDate": "YYYY-MM-DD", // or null if not specified
          "assignedTo": "me|binate_ai",
          "estimatedTime": 30 // estimated minutes to complete
        }
      ]
      
      Only extract actual tasks or action items that require follow-up, not general information.
      If no tasks are found, return an empty array.
    `;
    const response = await getClaudeResponse(prompt);
    try {
      const tasks2 = extractJsonFromResponse(response);
      return Array.isArray(tasks2) ? tasks2 : [];
    } catch (error) {
      console.error("Error parsing extracted tasks JSON:", error);
      return [];
    }
  } catch (error) {
    console.error("Error extracting tasks from email:", error);
    return [];
  }
}
async function generateTaskSuggestions(messages) {
  try {
    const systemPrompt = `
      You are Binate AI, an intelligent task management assistant.
      Your goal is to help users manage their tasks by providing clear updates and suggestions.
      Be concise, helpful, and action-oriented in your responses.
    `;
    const response = await getClaudeResponseFromHistory(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return "I'm sorry, I'm having trouble processing this task right now. Please try again later.";
  }
}
async function extractLeadFromEmail(emailContent) {
  try {
    const prompt = `
      You are Binate AI, an intelligent lead extraction assistant.
      Analyze the following email content and determine if it contains information about a potential business lead.
      
      EMAIL CONTENT:
      """
      ${emailContent}
      """
      
      If this appears to be a potential lead, extract the following information:
      1. Name of the potential client or contact person
      2. Email address
      3. Company or organization (if mentioned)
      4. Nature of interest or inquiry
      5. Suggested priority (high, medium, or low) based on urgency and potential value
      6. Estimated value of the potential deal (if hinted at)
      7. Any notes or context that would be helpful for follow-up
      8. Suggested next contact date (in YYYY-MM-DD format)
      
      Format your response as a valid JSON object with the following structure:
      {
        "name": "Contact name",
        "email": "contact@example.com",
        "company": "Company name or null",
        "interest": "Brief description of interest",
        "priority": "high|medium|low",
        "value": 1000, // estimated value in currency units, or 0 if unknown
        "notes": "Additional context or null",
        "nextContactDate": "YYYY-MM-DD", // or null if not applicable
        "confidence": 0.8 // your confidence that this is a lead (0.0 to 1.0)
      }
      
      If this does not appear to be a lead or you cannot extract sufficient information, return: {"confidence": 0}
    `;
    const response = await getClaudeResponse(prompt);
    try {
      const leadData = extractJsonFromResponse(response);
      if (!leadData.confidence || leadData.confidence < 0.4) {
        return null;
      }
      return leadData;
    } catch (error) {
      console.error("Error parsing extracted lead JSON:", error);
      return null;
    }
  } catch (error) {
    console.error("Error extracting lead from email:", error);
    return null;
  }
}
async function suggestLeadPriority(leadInfo, emailsContent) {
  try {
    const prompt = `
      You are Binate AI, an intelligent lead prioritization assistant.
      Your task is to analyze the lead information and email communications to suggest an appropriate priority level.
      
      LEAD INFORMATION:
      """
      ${leadInfo}
      """
      
      EMAIL COMMUNICATIONS:
      """
      ${emailsContent}
      """
      
      Based on the above information, suggest a priority level for this lead:
      - high: Urgent interest, clear buying signals, quick responses, high potential value
      - medium: Moderate interest, some engagement, average potential value
      - low: Initial inquiry, minimal follow-up, low potential value or long sales cycle
      
      Only respond with: "high", "medium", or "low" - no other text.
    `;
    const response = await getClaudeResponse(prompt);
    const priority = response.trim().toLowerCase();
    if (priority === "high" || priority === "medium" || priority === "low") {
      return priority;
    }
    return null;
  } catch (error) {
    console.error("Error suggesting lead priority:", error);
    return null;
  }
}
async function generateMeetingSummaryFromNotes(meetingNotes) {
  try {
    const prompt = `
      You are Binate AI, an intelligent meeting summary assistant.
      Analyze the following meeting notes and generate a concise, well-structured summary.
      
      MEETING NOTES:
      """
      ${meetingNotes}
      """
      
      Your summary should include:
      1. Key points discussed
      2. Decisions made
      3. Action items (clearly marked as "Action Item: [task]" on separate lines)
      4. Any important deadlines or dates
      5. Follow-up items
      
      Format the summary in clear, concise language with bullet points for readability.
      Keep the summary comprehensive but concise (maximum 300 words).
    `;
    const response = await getClaudeResponse(prompt);
    return response;
  } catch (error) {
    console.error("Error generating meeting summary:", error);
    return "Unable to generate meeting summary at this time.";
  }
}
async function generateMeetingAgenda(title, dateTime, attendees) {
  try {
    const prompt = `
      You are Binate AI, an intelligent meeting preparation assistant.
      Generate a structured agenda for the following meeting:
      
      MEETING DETAILS:
      Title: ${title}
      Date/Time: ${dateTime}
      Attendees: ${attendees.join(", ") || "Not specified"}
      
      Create a professional meeting agenda with:
      1. A brief introduction/purpose statement
      2. 3-5 logical agenda items based on the meeting title
      3. Allocated time suggestions for each item
      4. Space for "Any Other Business"
      5. Next steps/follow-up section
      
      Format the agenda in a clear, professional structure.
    `;
    const response = await getClaudeResponse(prompt);
    return response;
  } catch (error) {
    console.error("Error generating meeting agenda:", error);
    return "Unable to generate meeting agenda at this time.";
  }
}
async function extractInvoiceRequestFromEmail(emailContent) {
  try {
    const prompt = `
      You are Binate AI, an intelligent invoice extraction assistant.
      Analyze the following email content and determine if it contains a request or information for creating an invoice.
      
      EMAIL CONTENT:
      """
      ${emailContent}
      """
      
      If this appears to be an invoice request, extract the following information:
      1. Client name or organization
      2. Service or product descriptions
      3. Quantities and unit prices (if mentioned)
      4. Total amount (if mentioned)
      5. Any notes or special instructions
      
      Format your response as a valid JSON object with the following structure:
      {
        "clientName": "Client name or organization",
        "items": [
          {
            "description": "Service/product description",
            "quantity": 1,
            "unitPrice": 100.00,
            "total": 100.00
          }
        ],
        "notes": "Additional notes or instructions",
        "confidence": 0.8 // your confidence that this is an invoice request (0.0 to 1.0)
      }
      
      If this does not appear to be an invoice request or you cannot extract sufficient information, return: {"confidence": 0}
    `;
    const response = await getClaudeResponse(prompt);
    try {
      const invoiceData = extractJsonFromResponse(response);
      if (!invoiceData.confidence || invoiceData.confidence < 0.4) {
        return null;
      }
      return invoiceData;
    } catch (error) {
      console.error("Error parsing extracted invoice JSON:", error);
      return null;
    }
  } catch (error) {
    console.error("Error extracting invoice request from email:", error);
    return null;
  }
}
async function categorizeExpense(description, categories) {
  try {
    const prompt = `
      You are Binate AI, an intelligent expense categorization assistant.
      Categorize the following expense description into one of the provided categories.
      
      EXPENSE DESCRIPTION:
      """
      ${description}
      """
      
      AVAILABLE CATEGORIES:
      """
      ${categories.join(", ")}
      """
      
      Return only the category name that best matches the expense. If none of the categories seem appropriate, return "Other".
    `;
    const response = await getClaudeResponse(prompt);
    const category = response.trim();
    if (categories.includes(category) || category === "Other") {
      return category;
    }
    return "Other";
  } catch (error) {
    console.error("Error categorizing expense:", error);
    return null;
  }
}
async function handleAssistantQuery(query, history, userPreferences2 = {}) {
  const stylePrompt = userPreferences2?.aiResponseStyle === "formal" ? "professional and formal" : userPreferences2?.aiResponseStyle === "casual" ? "friendly and conversational" : "helpful and balanced";
  const systemPrompt = `
    You are Binate AI, an intelligent executive assistant for professionals.
    You help with email management, meeting scheduling, task prioritization, invoice handling, and time management.
    
    Respond in a ${stylePrompt} tone.
    Keep your responses concise and actionable.
    If you need more information to provide a better response, ask clarifying questions.
  `;
  try {
    const messages = [...history, { role: "user", content: query }];
    const response = await getClaudeResponseFromHistory(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error("Error handling assistant query:", error);
    throw error;
  }
}
var EXPENSE_CATEGORIES, anthropic2, MODEL, timeEstimationResponseSchema;
var init_ai_service = __esm({
  "server/ai-service.ts"() {
    "use strict";
    EXPENSE_CATEGORIES = [
      "Advertising",
      "Auto",
      "Business Meals",
      "Education",
      "Entertainment",
      "Equipment",
      "Home Office",
      "Insurance",
      "Legal",
      "Maintenance",
      "Office Supplies",
      "Professional Fees",
      "Rent",
      "Software",
      "Subscriptions",
      "Travel",
      "Utilities",
      "Other"
    ];
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("Missing ANTHROPIC_API_KEY environment variable. AI functionality will be limited.");
    } else {
      const keyPrefix = process.env.ANTHROPIC_API_KEY.substring(0, 8);
      console.log(`ANTHROPIC_API_KEY is present, starts with: ${keyPrefix}...`);
    }
    anthropic2 = new Anthropic2({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    MODEL = "claude-3-7-sonnet-20250219";
    timeEstimationResponseSchema = z2.object({
      estimatedTime: z2.number().min(5).max(480),
      confidence: z2.number().min(0).max(1),
      reasoning: z2.string()
    });
  }
});

// server/services/gmail.ts
var gmail_exports = {};
__export(gmail_exports, {
  EmailIntent: () => EmailIntent,
  analyzeEmail: () => analyzeEmail,
  autoProcessEmails: () => autoProcessEmails,
  createOAuth2Client: () => createOAuth2Client,
  fetchEmails: () => fetchEmails,
  getAuthUrl: () => getAuthUrl,
  getGmailClient: () => getGmailClient,
  markAsRead: () => markAsRead,
  sendEmail: () => sendEmail,
  sendReply: () => sendReply,
  setTokensForUser: () => setTokensForUser
});
import { google } from "googleapis";
function createOAuth2Client() {
  const callbackUrl = config_default.google.callbackUrl;
  console.log(`[Gmail] Using OAuth callback URL: ${callbackUrl}`);
  const oauth2Client2 = new google.auth.OAuth2(
    config_default.google.clientId,
    config_default.google.clientSecret,
    callbackUrl
  );
  return oauth2Client2;
}
function getAuthUrl() {
  const oauth2Client2 = createOAuth2Client();
  const authUrl = oauth2Client2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
    // Force to get refresh_token every time
  });
  console.log("Generated Google auth URL:", authUrl);
  return authUrl;
}
async function setTokensForUser(userId, tokens) {
  try {
    await storage.updateConnectedService(userId, "google", {
      credentials: tokens,
      connected: true
    });
    return true;
  } catch (error) {
    console.error("Error saving tokens:", error);
    return false;
  }
}
async function getGmailClient(userId) {
  try {
    const service = await storage.getConnectedService(userId, "google");
    if (!service || service.connected === false) {
      console.log(`No Google service found for user ${userId} or service not connected`);
      return null;
    }
    if (!service.credentials) {
      console.log(`No credentials found for user ${userId}'s Google service`);
      return null;
    }
    const tokens = service.credentials;
    if (!tokens || typeof tokens !== "object") {
      console.error(`Invalid tokens for user ${userId}: null or not an object`);
      return null;
    }
    if (!tokens.access_token) {
      console.error(`Missing access_token for user ${userId}`);
      if (tokens.refresh_token) {
        console.log(`No access token but found refresh token for user ${userId}. Attempting refresh...`);
        try {
          const oauth2Client3 = createOAuth2Client();
          oauth2Client3.setCredentials({ refresh_token: tokens.refresh_token });
          const { credentials } = await oauth2Client3.refreshAccessToken();
          console.log(`Successfully refreshed token for user ${userId} from refresh_token only`);
          await setTokensForUser(userId, credentials);
          tokens.access_token = credentials.access_token;
          tokens.expiry_date = credentials.expiry_date;
        } catch (refreshError) {
          console.error(`Failed to refresh token for user ${userId} from refresh_token only:`, refreshError);
          return null;
        }
      } else {
        console.error(`No refresh token available for user ${userId}, cannot recover`);
        return null;
      }
    }
    const oauth2Client2 = createOAuth2Client();
    oauth2Client2.setCredentials(tokens);
    oauth2Client2.on("tokens", async (newTokens) => {
      console.log(`Token refresh event for user ${userId}`);
      const updatedTokens = { ...tokens, ...newTokens };
      await setTokensForUser(userId, updatedTokens);
    });
    const now = Date.now();
    if (tokens.expiry_date && tokens.expiry_date < now) {
      if (tokens.refresh_token) {
        try {
          console.log(`Token expired for user ${userId} (expired at ${new Date(tokens.expiry_date).toISOString()}, now ${new Date(now).toISOString()}), refreshing...`);
          const { credentials } = await oauth2Client2.refreshAccessToken();
          console.log(`Successfully refreshed expired token for user ${userId}`);
          await setTokensForUser(userId, credentials);
          const refreshedOauth2Client = createOAuth2Client();
          refreshedOauth2Client.setCredentials(credentials);
          return google.gmail({ version: "v1", auth: refreshedOauth2Client });
        } catch (refreshError) {
          console.error(`Error refreshing expired token for user ${userId}:`, refreshError);
          await storage.updateConnectedService(userId, "google", {
            connected: false,
            lastError: "Failed to refresh token: " + refreshError.message
          });
          return null;
        }
      } else {
        console.warn(`Token expired for user ${userId} but no refresh token available`);
        await storage.updateConnectedService(userId, "google", {
          connected: false,
          lastError: "Token expired and no refresh token available"
        });
        return null;
      }
    }
    const gmailClient = google.gmail({ version: "v1", auth: oauth2Client2 });
    try {
      console.log(`Testing Gmail connection for user ${userId}...`);
      await gmailClient.users.getProfile({ userId: "me" });
      console.log(`Gmail connection test successful for user ${userId}`);
      return gmailClient;
    } catch (testError) {
      console.error(`Gmail connection test failed for user ${userId}:`, testError);
      if (testError.code === 401 || testError.response && testError.response.status === 401) {
        console.error(`Authorization error with Gmail API for user ${userId}`);
        await storage.updateConnectedService(userId, "google", {
          connected: false,
          lastError: "Gmail API authorization failed: " + testError.message
        });
      }
      return null;
    }
  } catch (error) {
    console.error(`Unexpected error getting Gmail client for user ${userId}:`, error);
    return null;
  }
}
async function fetchEmails(userId, maxResults = 20) {
  console.log(`Fetching emails for user ${userId}, max results: ${maxResults}`);
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    console.error(`Failed to get Gmail client for user ${userId}`);
    throw new Error("Google account not connected. Please connect your Google account in Settings to use this feature.");
  }
  try {
    console.log("Fetching message list from Gmail API...");
    const user = await storage.getUser(userId);
    const userPreferences2 = user?.preferences || {};
    const lastSyncDate = userPreferences2.lastEmailSyncDate ? new Date(userPreferences2.lastEmailSyncDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const formattedDate = `${lastSyncDate.getFullYear()}/${(lastSyncDate.getMonth() + 1).toString().padStart(2, "0")}/${lastSyncDate.getDate().toString().padStart(2, "0")}`;
    console.log(`Using date filter: after:${formattedDate}`);
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: `after:${formattedDate}`
      // Get all emails after last sync date
    });
    if (!response || !response.data) {
      console.error("Gmail API returned empty response");
      return [];
    }
    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} messages to process`);
    const emails3 = [];
    for (const message of messages) {
      if (!message.id) {
        console.log("Skipping message with no ID");
        continue;
      }
      try {
        console.log(`Fetching full message ${message.id}...`);
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full"
        });
        if (!fullMessage.data.payload) {
          console.log(`Message ${message.id} has no payload, skipping`);
          continue;
        }
        const headers = fullMessage.data.payload.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const from = headers.find((h) => h.name === "From")?.value || "";
        const to = headers.find((h) => h.name === "To")?.value || "";
        const date2 = headers.find((h) => h.name === "Date")?.value || "";
        let body = "";
        let bodyHtml = "";
        if (fullMessage.data.payload.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString();
        } else if (fullMessage.data.payload.parts) {
          for (const part of fullMessage.data.payload.parts) {
            if (part.mimeType === "text/plain" && part.body?.data) {
              body = Buffer.from(part.body.data, "base64").toString();
            } else if (part.mimeType === "text/html" && part.body?.data) {
              bodyHtml = Buffer.from(part.body.data, "base64").toString();
            }
          }
        }
        if (!body && bodyHtml) {
          body = bodyHtml;
        }
        let messageIdAsInt;
        try {
          const numericPart = message.id.replace(/\D/g, "");
          messageIdAsInt = parseInt(numericPart);
          if (isNaN(messageIdAsInt) || messageIdAsInt <= 0) {
            messageIdAsInt = Math.abs(
              message.id.split("").reduce((a, b) => {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
              }, 0)
            );
          }
        } catch (parseError) {
          messageIdAsInt = Date.now();
        }
        const email = {
          id: messageIdAsInt,
          userId,
          messageId: message.id,
          threadId: fullMessage.data.threadId || "",
          subject,
          from,
          to,
          body,
          isRead: !(fullMessage.data.labelIds || []).includes("UNREAD"),
          date: new Date(date2),
          labels: fullMessage.data.labelIds || [],
          isDeleted: false,
          isArchived: false,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          aiSummary: "",
          // Add missing required field
          processed: false
          // Add missing required field
        };
        console.log(`Successfully processed email "${subject}" from ${from}`);
        emails3.push(email);
        try {
          await storage.createOrUpdateEmail(email);
          console.log(`Email ${messageIdAsInt} saved to database`);
        } catch (err) {
          console.error(`Error storing email ${messageIdAsInt}:`, err);
        }
      } catch (messageError) {
        console.error(`Error processing message ${message.id}:`, messageError);
      }
    }
    console.log(`Successfully fetched and processed ${emails3.length} emails`);
    try {
      const user2 = await storage.getUser(userId);
      const preferences = user2?.preferences || {};
      const updatedPreferences = {
        ...preferences,
        lastEmailSyncDate: (/* @__PURE__ */ new Date()).toISOString()
      };
      await storage.updateUserSettings(userId, updatedPreferences);
      console.log(`Updated lastEmailSyncDate for user ${userId} to ${(/* @__PURE__ */ new Date()).toISOString()}`);
    } catch (prefError) {
      console.error(`Error updating lastEmailSyncDate for user ${userId}:`, prefError);
    }
    return emails3;
  } catch (error) {
    console.error(`Error fetching emails for user ${userId}:`, error);
    throw error;
  }
}
async function analyzeEmail(userId, emailIdOrMessageId) {
  try {
    let email;
    if (typeof emailIdOrMessageId === "string") {
      email = await storage.getEmailByMessageId(userId, emailIdOrMessageId);
    } else {
      email = await storage.getEmail(emailIdOrMessageId);
    }
    if (!email || email.userId !== userId) {
      throw new Error("Email not found or access denied");
    }
    const { getClaudeResponse: getClaudeResponse2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const systemPrompt = `You are an AI executive assistant analyzing emails. 
    Response style preference: ${user.preferences?.aiResponseStyle || "friendly"}.
    Analyze the following email and provide:
    1. The email's primary intent: INVOICE_REQUEST, MEETING_REQUEST, GENERAL_INQUIRY, TASK_REQUEST, or UNKNOWN
    2. A concise summary (max 50 words)
    3. Extracted structured data based on intent (invoice details, meeting details, task details)
    4. A suggested professional reply if appropriate
    
    Respond with JSON only in this exact format:
    {
      "intent": "INTENT_TYPE",
      "summary": "Brief summary of the email",
      "suggestedReply": "Suggested reply text if applicable",
      "extractedData": {
        // Fields based on intent type
      }
    }`;
    const emailContent = `
    From: ${email.from}
    To: ${email.to}
    Subject: ${email.subject}
    Date: ${email.date.toISOString()}
    
    ${email.body}`;
    console.log("AI analysis disabled to protect API credits");
    const claudeResponse = JSON.stringify({
      intent: "GENERAL",
      summary: "Email processed without AI analysis to protect credits",
      priority: "medium",
      actionRequired: false,
      lead: null,
      task: null,
      meeting: null,
      invoice: null
    });
    try {
      const { extractJsonFromResponse: extractJsonFromResponse2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
      const result = extractJsonFromResponse2(claudeResponse);
      if (!result.intent || !result.summary) {
        throw new Error("Invalid AI response format");
      }
      return result;
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      return {
        intent: "UNKNOWN" /* UNKNOWN */,
        summary: "Could not analyze email content"
      };
    }
  } catch (error) {
    console.error("Error analyzing email:", error);
    return {
      intent: "UNKNOWN" /* UNKNOWN */,
      summary: "Error occurred while analyzing the email"
    };
  }
}
async function sendEmail(userId, toOrOptions, subject, content) {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error("Google account not connected. Please connect your Google account in Settings to use this feature.");
  }
  try {
    let to;
    let emailSubject;
    let emailContent;
    if (typeof toOrOptions === "object") {
      to = toOrOptions.to || "";
      emailSubject = toOrOptions.subject || "";
      emailContent = toOrOptions.html || toOrOptions.text || "";
    } else {
      to = toOrOptions;
      emailSubject = subject || "";
      emailContent = content || "";
    }
    if (!to) {
      throw new Error("Recipient address required");
    }
    const email = [
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `To: ${to}`,
      `Subject: ${emailSubject}`,
      "",
      emailContent
    ].join("\r\n");
    const encodedEmail = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail
      }
    });
    console.log(`Email sent to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
async function sendReply(userId, originalMessageId, replyContent, options = {}) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const preferences = user.preferences || {};
    const autonomousMode = preferences.autonomousMode || "semi_manual";
    const gmail = await getGmailClient(userId);
    if (!gmail) {
      throw new Error("Google account not connected. Please connect your Google account in Settings to use this feature.");
    }
    const originalMessage = await gmail.users.messages.get({
      userId: "me",
      id: originalMessageId,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "To", "Message-ID", "References", "In-Reply-To"]
    });
    if (!originalMessage.data || !originalMessage.data.payload) {
      throw new Error("Could not fetch original message");
    }
    const headers = originalMessage.data.payload.headers || [];
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const originalFrom = headers.find((h) => h.name === "From")?.value || "";
    const originalTo = headers.find((h) => h.name === "To")?.value || "";
    const messageId = headers.find((h) => h.name === "Message-ID")?.value || "";
    const references = headers.find((h) => h.name === "References")?.value || "";
    const fromEmailMatch = originalFrom.match(/<([^>]+)>/) || originalFrom.match(/([^\s]+@[^\s]+)/);
    const toEmail = fromEmailMatch ? fromEmailMatch[1] : originalFrom;
    const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
    if (autonomousMode === "semi_manual" && !options.forceImmediateSend) {
      console.log(`Queueing email reply for approval (semi-manual mode) to: ${toEmail}, subject: ${replySubject}`);
      try {
        await storage.createPendingEmailReply({
          userId,
          messageId: originalMessageId,
          to: toEmail,
          // Using 'to' property for backward compatibility with existing code
          subject: replySubject,
          content: replyContent,
          originalMessageData: JSON.stringify({
            from: originalFrom,
            subject,
            messageId,
            references,
            threadId: originalMessage.data.threadId
          }),
          createdAt: /* @__PURE__ */ new Date(),
          status: "pending"
        });
        await storage.createEmailLog({
          userId,
          type: "reply_queued",
          recipient: toEmail,
          subject: replySubject,
          status: "pending",
          metadata: JSON.stringify({
            originalMessageId,
            replyLength: replyContent.length
          }),
          timestamp: /* @__PURE__ */ new Date()
        });
        return true;
      } catch (queueError) {
        console.error("Error queueing email for approval:", queueError);
        return false;
      }
    }
    let emailContent = `From: me\r
To: ${toEmail}\r
Subject: ${replySubject}\r
In-Reply-To: ${messageId}\r
References: ${references ? references + " " : ""}${messageId}\r
\r
${replyContent}`;
    const encodedEmail = Buffer.from(emailContent).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
        threadId: originalMessage.data.threadId
      }
    });
    await storage.createEmailLog({
      userId,
      type: "reply",
      recipient: toEmail,
      subject: replySubject,
      status: "sent",
      metadata: JSON.stringify({
        originalMessageId,
        replyLength: replyContent.length
      }),
      timestamp: /* @__PURE__ */ new Date()
    });
    return true;
  } catch (error) {
    console.error("Error sending reply:", error);
    try {
      await storage.createEmailLog({
        userId,
        type: "reply",
        recipient: "unknown",
        // We might not have been able to extract recipient
        subject: "Reply to email",
        status: "failed",
        metadata: JSON.stringify({
          originalMessageId,
          error: error.message
        }),
        timestamp: /* @__PURE__ */ new Date()
      });
    } catch (logError) {
      console.error("Error logging failed reply:", logError);
    }
    return false;
  }
}
async function autoProcessEmails(userId, options) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const preferences = user.preferences || {};
    const autonomousMode = preferences.autonomousMode || "semi_manual";
    const autonomousSettings = {
      autoReplyToEmails: autonomousMode === "fully_autonomous",
      autoCreateTasks: true,
      // We still create tasks in both modes
      autoDetectLeads: true,
      // We still detect leads in both modes
      autoGenerateInvoices: autonomousMode === "fully_autonomous",
      autoScheduleMeetings: autonomousMode === "fully_autonomous",
      priorityResponseTime: preferences.priorityResponseTime || "high"
      // high, medium, low
    };
    console.log(
      `Running auto email processing for user ${userId} with settings:`,
      JSON.stringify(autonomousSettings)
    );
    const emails3 = await fetchEmails(userId, 25);
    const result = {
      processed: 0,
      replied: 0,
      tasksCreated: 0,
      invoicesCreated: 0,
      meetingsScheduled: 0,
      leadsDetected: 0
    };
    if (emails3.length === 0) {
      return result;
    }
    console.log(`Found ${emails3.length} unread emails to process`);
    const sortedEmails = prioritizeEmails(emails3, user);
    console.log("Emails prioritized. Processing highest priority emails first.");
    let emailsToProcess = sortedEmails;
    if (options?.selectiveMode && options?.limitToEssentials) {
      emailsToProcess = sortedEmails.filter((email) => {
        const subject = email.subject.toLowerCase();
        const from = email.from.toLowerCase();
        return subject.includes("invoice") || subject.includes("receipt") || subject.includes("payment") || subject.includes("bill") || subject.includes("expense") || subject.includes("anthropic") || from.includes("anthropic") || from.includes("stripe") || from.includes("paypal") || from.includes("billing") || subject.includes("urgent") || subject.includes("action required");
      });
      console.log(`Selective mode: Processing ${emailsToProcess.length} business-critical emails out of ${sortedEmails.length} total emails`);
    }
    for (const email of emailsToProcess) {
      try {
        const analysis = await analyzeEmail(userId, email.messageId);
        result.processed++;
        const user2 = await storage.getUser(userId);
        if (!user2) continue;
        try {
          const lead = await processEmailForLeads(email);
          if (lead) {
            result.leadsDetected++;
            console.log(`Lead detected in email "${email.subject}": ${lead.name} (${lead.email})`);
          }
        } catch (leadError) {
          console.error("Error detecting leads in email:", leadError);
        }
        switch (analysis.intent) {
          case "TASK_REQUEST" /* TASK_REQUEST */:
            if (analysis.extractedData?.taskDetails) {
              const details = analysis.extractedData.taskDetails;
              await storage.createTask({
                userId,
                title: details.taskName || "Task from email",
                description: analysis.summary,
                priority: details.priority || "medium",
                dueDate: details.dueDate ? new Date(details.dueDate) : void 0,
                aiGenerated: true,
                completed: false
              });
              result.tasksCreated++;
            }
            if (analysis.suggestedReply) {
              const { generateEmailReply: generateEmailReply2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
              const customizedReply = await generateEmailReply2(analysis.suggestedReply, {
                userPreferences: user2.preferences
              });
              if (await sendReply(userId, email.messageId, customizedReply)) {
                result.replied++;
              }
            }
            break;
          case "INVOICE_REQUEST" /* INVOICE_REQUEST */:
            try {
              const { analyzeInvoiceRequest, generateInvoice: generateInvoice2, generateInvoiceEmailReply: generateInvoiceEmailReply2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
              const invoiceAnalysis = await analyzeInvoiceRequest(email);
              if (invoiceAnalysis.isInvoiceRequest && invoiceAnalysis.data) {
                const userPreferences2 = user2.preferences || {};
                const invoiceResult = await generateInvoice2(invoiceAnalysis.data, {
                  fullName: user2.fullName,
                  email: user2.email,
                  ...userPreferences2
                });
                const invoiceData = {
                  userId,
                  number: invoiceResult.invoiceNumber,
                  client: invoiceAnalysis.data.clientName,
                  amount: invoiceAnalysis.data.totalAmount,
                  status: "pending",
                  dueDate: new Date(invoiceAnalysis.data.dueDate),
                  issueDate: /* @__PURE__ */ new Date(),
                  items: invoiceResult.invoiceItems
                };
                const invoice = await storage.createInvoice(invoiceData);
                const emailReply = await generateInvoiceEmailReply2(
                  email,
                  invoiceAnalysis.data,
                  invoiceResult.invoiceNumber,
                  {
                    fullName: user2.fullName,
                    email: user2.email,
                    ...userPreferences2
                  }
                );
                if (await sendReply(userId, email.messageId, emailReply)) {
                  await storage.updateInvoice(userId, invoice.id, {
                    status: "sent",
                    lastEmailDate: /* @__PURE__ */ new Date()
                  });
                  result.invoicesCreated++;
                  result.replied++;
                }
              }
            } catch (invoiceError) {
              console.error("Error processing invoice request:", invoiceError);
            }
            break;
          case "MEETING_REQUEST" /* MEETING_REQUEST */:
            result.meetingsScheduled++;
            break;
          case "GENERAL_INQUIRY" /* GENERAL_INQUIRY */:
            if (analysis.suggestedReply) {
              const { generateEmailReply: generateEmailReply2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
              const customizedReply = await generateEmailReply2(analysis.suggestedReply, {
                userPreferences: user2.preferences
              });
              if (await sendReply(userId, email.messageId, customizedReply)) {
                result.replied++;
              }
            }
            break;
        }
        await markAsRead(userId, email.messageId);
      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);
      }
    }
    return result;
  } catch (error) {
    console.error("Error in auto processing emails:", error);
    return {
      processed: 0,
      replied: 0,
      tasksCreated: 0,
      invoicesCreated: 0,
      meetingsScheduled: 0,
      leadsDetected: 0
    };
  }
}
function prioritizeEmails(emails3, user) {
  const defaultImportantKeywords = ["urgent", "important", "deadline", "asap", "payment"];
  const preferences = user.preferences || {};
  const importantContacts = Array.isArray(preferences.importantContacts) ? preferences.importantContacts : [];
  const importantKeywords = Array.isArray(preferences.importantKeywords) ? preferences.importantKeywords : defaultImportantKeywords;
  const scoredEmails = emails3.map((email) => {
    let score = 0;
    const ageInHours = (Date.now() - new Date(email.date).getTime()) / (1e3 * 60 * 60);
    score += Math.max(0, 50 - ageInHours * 10);
    const senderEmail = email.from.toLowerCase();
    if (importantContacts.some(
      (contact) => senderEmail.includes(contact.toLowerCase())
    )) {
      score += 40;
    }
    if (email.subject) {
      const subjectLower = email.subject.toLowerCase();
      for (const keyword of importantKeywords) {
        if (subjectLower.includes(keyword.toLowerCase())) {
          score += 30;
          break;
        }
      }
    }
    if (email.subject && email.body) {
      const combined = `${email.subject} ${email.body}`.toLowerCase();
      if (combined.includes("project") || combined.includes("inquiry") || combined.includes("service") || combined.includes("quote") || combined.includes("proposal")) {
        score += 25;
      }
    }
    if (email.subject && email.body) {
      const combined = `${email.subject} ${email.body}`.toLowerCase();
      if (combined.includes("invoice") || combined.includes("payment") || combined.includes("bill") || combined.includes("receipt")) {
        score += 20;
      }
    }
    return { email, score };
  });
  scoredEmails.sort((a, b) => b.score - a.score);
  return scoredEmails.map((item) => item.email);
}
async function markAsRead(userId, messageId) {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error("Google account not connected. Please connect your Google account in Settings to use this feature.");
  }
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"]
      }
    });
    try {
      const email = await storage.getEmailByMessageId(userId, messageId);
      if (email) {
        await storage.updateEmail(userId, email.id, { isRead: true });
      }
    } catch (err) {
      console.error("Error updating email status in database:", err);
    }
    return true;
  } catch (error) {
    console.error("Error marking email as read:", error);
    return false;
  }
}
var SCOPES, EmailIntent;
var init_gmail = __esm({
  "server/services/gmail.ts"() {
    "use strict";
    init_storage();
    init_lead_detection();
    init_config();
    SCOPES = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "openid",
      "email",
      "profile"
    ];
    EmailIntent = /* @__PURE__ */ ((EmailIntent2) => {
      EmailIntent2["INVOICE_REQUEST"] = "INVOICE_REQUEST";
      EmailIntent2["MEETING_REQUEST"] = "MEETING_REQUEST";
      EmailIntent2["GENERAL_INQUIRY"] = "GENERAL_INQUIRY";
      EmailIntent2["TASK_REQUEST"] = "TASK_REQUEST";
      EmailIntent2["UNKNOWN"] = "UNKNOWN";
      return EmailIntent2;
    })(EmailIntent || {});
  }
});

// server/services/invoice-html-generator.ts
async function generateInvoiceHtml(invoice) {
  const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = invoice.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "N/A";
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.number}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .invoice-title {
          font-size: 28px;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        .invoice-details {
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
        }
        .invoice-details div {
          flex: 1;
        }
        .invoice-details h3 {
          margin-bottom: 5px;
          color: #2c3e50;
        }
        .table-container {
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background-color: #f8f9fa;
          text-align: left;
          padding: 10px;
          border-bottom: 2px solid #dee2e6;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #dee2e6;
        }
        .text-right {
          text-align: right;
        }
        .total-section {
          margin-top: 20px;
          margin-left: auto;
          width: 300px;
        }
        .total-section table {
          width: 100%;
        }
        .total-section th {
          text-align: right;
          font-weight: normal;
        }
        .total-section .grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
        }
        .notes {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            <h1 class="invoice-title">INVOICE</h1>
            <p style="color: #777; margin-top: 0;">Invoice Number: ${invoice.number}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold;">${invoice.client}</div>
            <!-- Add your logo or business information here -->
          </div>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Bill To:</h3>
            <p>
              ${invoice.client}<br>
              <!-- Add client address information here -->
              ${invoice.leadId ? "Client ID: " + invoice.leadId : ""}
            </p>
          </div>
          <div>
            <h3>Invoice Details:</h3>
            <p>
              Issue Date: ${issueDate}<br>
              Due Date: ${dueDate}<br>
              Payment Terms: Due on receipt
            </p>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.map((item) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right">$${item.total.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        
        <div class="total-section">
          <table>
            <tr>
              <th>Subtotal:</th>
              <td class="text-right">$${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <th>Tax (${taxRate}%):</th>
              <td class="text-right">$${taxAmount.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <th>TOTAL:</th>
              <td class="text-right">$${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        ${invoice.notes ? `
        <div class="notes">
          <h3>Notes:</h3>
          <p>${invoice.notes}</p>
        </div>
        ` : ""}
        
        <div class="notes">
          <h3>Payment Instructions:</h3>
          <p>
            Please make payment by the due date to avoid late fees.<br>
            <!-- Add payment instructions here -->
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
var init_invoice_html_generator = __esm({
  "server/services/invoice-html-generator.ts"() {
    "use strict";
  }
});

// server/services/email-sender.ts
var email_sender_exports = {};
__export(email_sender_exports, {
  sendEmailNotification: () => sendEmailNotification,
  sendInvoiceEmail: () => sendInvoiceEmail,
  sendPaymentReminder: () => sendPaymentReminder,
  sendPlainEmail: () => sendPlainEmail
});
async function sendEmailNotification(user, subject, content, options = {}) {
  try {
    if (!user || !user.email) {
      throw new Error("User email is required");
    }
    let emailBody = options.isHtml ? content : `<p>${content.replace(/\n/g, "<br/>")}</p>`;
    if (options.includeTasks && options.includeTasks.length > 0) {
      emailBody += `
        <h3>Tasks</h3>
        <ul>
      `;
      for (const task of options.includeTasks) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";
        emailBody += `
          <li>
            <strong>${task.title}</strong>
            ${task.priority ? ` (${task.priority})` : ""}
            - Due: ${dueDate}
          </li>
        `;
      }
      emailBody += `</ul>`;
    }
    if (options.includeMeetings && options.includeMeetings.length > 0) {
      emailBody += `
        <h3>Upcoming Meetings</h3>
        <ul>
      `;
      for (const meeting of options.includeMeetings) {
        const startTime = meeting.startTime ? new Date(meeting.startTime).toLocaleString() : "Time not specified";
        emailBody += `
          <li>
            <strong>${meeting.title}</strong>
            - ${startTime}
            ${meeting.location ? `<br/>Location: ${meeting.location}` : ""}
            ${meeting.meetingUrl ? `<br/><a href="${meeting.meetingUrl}">Join Meeting</a>` : ""}
          </li>
        `;
      }
      emailBody += `</ul>`;
    }
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
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Binate AI
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    const emailResult = await sendEmail(user.id, {
      to: user.email,
      subject,
      html: fullHtmlContent
    });
    await storage.createEmailLog({
      userId: user.id,
      type: "notification",
      recipient: user.email,
      subject,
      status: emailResult ? "sent" : "failed",
      metadata: JSON.stringify({
        includedTasks: options.includeTasks ? options.includeTasks.length : 0,
        includedMeetings: options.includeMeetings ? options.includeMeetings.length : 0,
        includedInvoices: options.includeInvoices
      })
    });
    return emailResult;
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw error;
  }
}
async function sendPlainEmail(userId, recipient, subject, body) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
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
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Binate AI
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    const emailResult = await sendEmail(userId, {
      to: recipient,
      subject,
      html: htmlContent
    });
    await storage.createEmailLog({
      userId,
      type: "plain",
      recipient,
      subject,
      status: emailResult ? "sent" : "failed"
    });
    return emailResult;
  } catch (error) {
    console.error("Error sending plain email:", error);
    throw error;
  }
}
async function sendInvoiceEmail(user, invoice, recipientEmail) {
  try {
    if (!user || !user.id) {
      throw new Error("Valid user is required");
    }
    if (!invoice || !invoice.id || !invoice.number) {
      throw new Error("Valid invoice is required");
    }
    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }
    const userPreferences2 = user.preferences ? typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences : {};
    const invoiceItems = invoice.items ? typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items : [];
    const invoiceData = {
      number: invoice.number,
      client: invoice.client,
      date: invoice.issueDate || /* @__PURE__ */ new Date(),
      dueDate: invoice.dueDate,
      items: invoiceItems,
      notes: invoice.notes || "",
      taxRate: invoice.taxRate || 0,
      currency: userPreferences2.currency || "USD"
    };
    const invoiceHtml = await generateInvoiceHtml(invoiceData);
    let emailContent = `
      <p>Dear ${invoice.client},</p>
      
      <p>Please find attached the invoice #${invoice.number} for your recent services.</p>
      
      <p>The total amount due is ${formatCurrency(invoice.amount, userPreferences2.currency || "USD")}${invoice.dueDate ? `, due on ${formatDate(invoice.dueDate)}` : ""}.</p>
      
      <p>If you have any questions regarding this invoice, please don't hesitate to contact me.</p>
      
      <p>Thank you for your business!</p>
      
      <p>
        Best regards,<br/>
        ${user.fullName || user.username}
      </p>
    `;
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
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${user.fullName || user.username}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    const emailResult = await sendEmail(user.id, {
      to: recipientEmail,
      subject: `Invoice #${invoice.number} from ${user.fullName || user.username}`,
      html: fullHtmlContent
    });
    await storage.createEmailLog({
      userId: user.id,
      type: "invoice",
      recipient: recipientEmail,
      subject: `Invoice #${invoice.number}`,
      status: emailResult ? "sent" : "failed",
      metadata: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: invoice.amount
      })
    });
    return emailResult;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    throw error;
  }
}
async function sendPaymentReminder(user, invoice, recipientEmail) {
  try {
    if (!user || !user.id) {
      throw new Error("Valid user is required");
    }
    if (!invoice || !invoice.id || !invoice.number) {
      throw new Error("Valid invoice is required");
    }
    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }
    const userPreferences2 = user.preferences ? typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences : {};
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : /* @__PURE__ */ new Date();
    const now = /* @__PURE__ */ new Date();
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
    const { generateInvoiceFollowUpEmail: generateInvoiceFollowUpEmail2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
    const invoiceData = {
      clientName: invoice.client,
      totalAmount: invoice.amount,
      currency: userPreferences2.currency || "USD",
      dueDate: dueDate.toISOString().split("T")[0]
    };
    const emailBody = await generateInvoiceFollowUpEmail2(
      invoiceData,
      invoice.number,
      daysPastDue,
      {
        fullName: user.fullName || user.username,
        email: user.email,
        ...userPreferences2
      }
    );
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
              <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${user.fullName || user.username}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const emailResult = await sendEmail(user.id, {
      to: recipientEmail,
      subject: `Payment Reminder: Invoice #${invoice.number}`,
      html: fullHtmlContent
    });
    await storage.createEmailLog({
      userId: user.id,
      type: "invoice_reminder",
      recipient: recipientEmail,
      subject: `Payment Reminder: Invoice #${invoice.number}`,
      status: emailResult ? "sent" : "failed",
      metadata: JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: invoice.amount,
        daysPastDue
      })
    });
    return emailResult;
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    throw error;
  }
}
function formatDate(date2) {
  const dateObj = typeof date2 === "string" ? new Date(date2) : date2;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}
var init_email_sender = __esm({
  "server/services/email-sender.ts"() {
    "use strict";
    init_storage();
    init_gmail();
    init_invoice_html_generator();
  }
});

// server/services/scheduled-notifications.ts
function isScheduledDigestTime() {
  const now = /* @__PURE__ */ new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  return DIGEST_TIMES.some(
    (time) => currentHour === time.hour && currentMinute >= time.minute && currentMinute < time.minute + 5
  );
}
async function sendScheduledDigest(userId) {
  try {
    const now = /* @__PURE__ */ new Date();
    const digestKey = `digest-${userId}-${now.toDateString()}-${now.getHours()}`;
    const lastSent = sentNotifications.get(digestKey);
    if (lastSent && now.getTime() - lastSent.getTime() < 60 * 60 * 1e3) {
      console.log(`Skipping duplicate digest for user ${userId}`);
      return false;
    }
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for digest delivery`);
      return false;
    }
    const tasksResult = await storage.getTasksByUserId(userId);
    const tasks2 = tasksResult || [];
    const dueTodayTasks = tasks2.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === now.toDateString();
    });
    const overdueTasks = tasks2.filter((task) => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && dueDate.toDateString() !== now.toDateString();
    });
    const completedTasks = tasks2.filter((task) => task.completed);
    const eventsResult = await storage.getEventsByUserId(userId);
    const events2 = eventsResult || [];
    const todayMeetings = events2.filter((event) => {
      const startTime = new Date(event.startTime);
      return startTime.toDateString() === now.toDateString();
    });
    const leadsResult = await storage.getLeadsByUserId(userId);
    const leads2 = leadsResult || [];
    const newLeads = leads2.filter((lead) => {
      if (!lead.createdAt) return false;
      const createdAt = new Date(lead.createdAt);
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return createdAt > oneDayAgo;
    });
    const currentHour = now.getHours();
    let timeOfDay = "daily";
    if (currentHour >= 5 && currentHour < 12) {
      timeOfDay = "morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = "midday";
    } else {
      timeOfDay = "evening";
    }
    const hasImportantTasks = dueTodayTasks.length > 0 || overdueTasks.length > 0;
    const hasImportantMeetings = todayMeetings.length > 0;
    const hasImportantLeads = newLeads.length > 0;
    if (!hasImportantTasks && !hasImportantMeetings && !hasImportantLeads) {
      console.log(`Skipping digest for user ${userId} - no important items to report`);
      sentNotifications.set(digestKey, now);
      return true;
    }
    const digestSummary = `
      <h2>Your ${timeOfDay} digest</h2>
      
      <p>Here's a summary of your current items:</p>
      
      <ul>
        ${tasks2.length > 0 ? `<li><strong>Tasks:</strong> ${completedTasks.length} completed, ${dueTodayTasks.length} due today, ${overdueTasks.length} overdue</li>` : ""}
        ${events2.length > 0 ? `<li><strong>Meetings:</strong> ${todayMeetings.length} today</li>` : ""}
        ${leads2.length > 0 ? `<li><strong>Leads:</strong> ${newLeads.length} new leads</li>` : ""}
      </ul>
      
      ${dueTodayTasks.length > 0 ? `<h3>Tasks due today:</h3>` : ""}
    `.trim();
    const emailSubject = `Your ${timeOfDay} digest - ${now.toLocaleDateString()}`;
    const emailResult = await sendEmailNotification(
      user,
      emailSubject,
      digestSummary,
      {
        isHtml: true,
        includeTasks: dueTodayTasks.length > 0 ? dueTodayTasks : void 0,
        includeMeetings: todayMeetings.length > 0 ? todayMeetings : void 0
      }
    );
    if (emailResult) {
      console.log(`Successfully sent ${timeOfDay} digest email to user ${userId} (${user.email})`);
      sentNotifications.set(digestKey, now);
      return true;
    } else {
      console.error(`Failed to send ${timeOfDay} digest email to user ${userId} (${user.email})`);
      return false;
    }
  } catch (error) {
    console.error("Error sending scheduled digest:", error);
    return false;
  }
}
async function sendUrgentTaskNotification(userId, clientId, task) {
  try {
    if (!task.dueDate) return false;
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for task notification delivery`);
      return false;
    }
    const now = /* @__PURE__ */ new Date();
    const dueDate = new Date(task.dueDate);
    const millisecondsUntilDue = dueDate.getTime() - now.getTime();
    const hoursUntilDue = millisecondsUntilDue / (1e3 * 60 * 60);
    const minutesUntilDue = hoursUntilDue * 60;
    const isUrgentByTime = minutesUntilDue <= 30 && minutesUntilDue >= 0;
    const isUrgentByPriority = task.priority === "high";
    if (!isUrgentByTime && !isUrgentByPriority) {
      return false;
    }
    const notificationKey = `task-${task.id}-urgent`;
    const lastSent = sentNotifications.get(notificationKey);
    if (lastSent && now.getTime() - lastSent.getTime() < 30 * 60 * 1e3) {
      return false;
    }
    let subject = "";
    if (isUrgentByTime && minutesUntilDue <= 15) {
      subject = `URGENT: Task due in ${Math.round(minutesUntilDue)} minutes - ${task.title}`;
    } else if (isUrgentByTime) {
      subject = `Reminder: Task due soon - ${task.title}`;
    } else {
      subject = `High priority task - ${task.title}`;
    }
    const content = `
      <h2>${task.title}</h2>
      
      <p><strong>Due:</strong> ${dueDate.toLocaleString()}</p>
      ${task.priority ? `<p><strong>Priority:</strong> ${task.priority}</p>` : ""}
      ${task.description ? `<p><strong>Description:</strong><br>${task.description}</p>` : ""}
      
      <p>This is an automated reminder for your urgent task.</p>
    `.trim();
    const emailResult = await sendEmailNotification(
      user,
      subject,
      content,
      { isHtml: true }
    );
    if (emailResult) {
      sentNotifications.set(notificationKey, now);
      console.log(`Sent urgent task notification email for task ${task.id} to user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending urgent task notification:", error);
    return false;
  }
}
async function sendImminentMeetingNotification(userId, clientId, meeting) {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for meeting notification delivery`);
      return false;
    }
    const now = /* @__PURE__ */ new Date();
    const startTime = new Date(meeting.startTime);
    const millisecondsUntilStart = startTime.getTime() - now.getTime();
    const minutesUntilStart = millisecondsUntilStart / (1e3 * 60);
    if (minutesUntilStart > 15 || minutesUntilStart < 0) {
      return false;
    }
    const notificationKey = `meeting-${meeting.id}-imminent`;
    const lastSent = sentNotifications.get(notificationKey);
    if (lastSent && now.getTime() - lastSent.getTime() < 5 * 60 * 1e3) {
      return false;
    }
    const roundedMinutes = Math.round(minutesUntilStart);
    const subject = `Meeting starting in ${roundedMinutes} minutes: ${meeting.title}`;
    const content = `
      <h2>${meeting.title}</h2>
      
      <p><strong>Start time:</strong> ${startTime.toLocaleString()}</p>
      <p><strong>End time:</strong> ${new Date(meeting.endTime).toLocaleString()}</p>
      ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ""}
      ${meeting.description ? `<p><strong>Description:</strong><br>${meeting.description}</p>` : ""}
      
      ${meeting.meetingUrl ? `<p><a href="${meeting.meetingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2a6399; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Meeting</a></p>` : ""}
      
      <p>This is an automated reminder for your upcoming meeting.</p>
    `.trim();
    const emailResult = await sendEmailNotification(
      user,
      subject,
      content,
      { isHtml: true }
    );
    if (emailResult) {
      sentNotifications.set(notificationKey, now);
      console.log(`Sent meeting reminder email for meeting ${meeting.id} to user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending imminent meeting notification:", error);
    return false;
  }
}
async function sendHighPriorityLeadNotification(userId, clientId, lead) {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email for lead notification delivery`);
      return false;
    }
    if (lead.priority !== "high" && (!lead.value || lead.value <= 1e4)) {
      return false;
    }
    const now = /* @__PURE__ */ new Date();
    const createdAt = lead.createdAt ? new Date(lead.createdAt) : now;
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1e3 * 60 * 60);
    if (hoursSinceCreation > 2) {
      return false;
    }
    const notificationKey = `lead-${lead.id}-highpriority`;
    const lastSent = sentNotifications.get(notificationKey);
    if (lastSent) {
      return false;
    }
    let subject = "";
    if (lead.priority === "high") {
      subject = `High priority lead: ${lead.name}`;
    } else if (lead.value && lead.value > 1e4) {
      subject = `High value lead: ${lead.name} - ${formatCurrency2(lead.value)}`;
    } else {
      subject = `New lead: ${lead.name}`;
    }
    const content = `
      <h2>New Lead: ${lead.name}</h2>
      
      <p>A new high-priority lead has been added to your system.</p>
      
      <div style="padding: 15px; border: 1px solid #eee; border-radius: 5px; margin: 15px 0;">
        <p><strong>Name:</strong> ${lead.name}</p>
        ${lead.email ? `<p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>` : ""}
        ${lead.company ? `<p><strong>Company:</strong> ${lead.company}</p>` : ""}
        ${lead.source ? `<p><strong>Source:</strong> ${lead.source}</p>` : ""}
        ${lead.priority ? `<p><strong>Priority:</strong> <span style="color: ${lead.priority === "high" ? "#d9534f" : "#5bc0de"}">${lead.priority}</span></p>` : ""}
        ${lead.value ? `<p><strong>Estimated Value:</strong> ${formatCurrency2(lead.value)}</p>` : ""}
      </div>
      
      <p>This lead was created ${Math.round(hoursSinceCreation * 10) / 10} hours ago.</p>
    `.trim();
    const emailResult = await sendEmailNotification(
      user,
      subject,
      content,
      { isHtml: true }
    );
    if (emailResult) {
      sentNotifications.set(notificationKey, now);
      console.log(`Sent high priority lead notification email for lead ${lead.id} to user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending high priority lead notification:", error);
    return false;
  }
}
function formatCurrency2(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}
function cleanupNotificationTracking() {
  const now = /* @__PURE__ */ new Date();
  Array.from(sentNotifications.entries()).forEach(([key, timestamp2]) => {
    if (now.getTime() - timestamp2.getTime() > 24 * 60 * 60 * 1e3) {
      sentNotifications.delete(key);
    }
  });
}
var DIGEST_TIMES, sentNotifications;
var init_scheduled_notifications = __esm({
  "server/services/scheduled-notifications.ts"() {
    "use strict";
    init_storage();
    init_email_sender();
    DIGEST_TIMES = [
      { hour: 7, minute: 0 },
      // 7am 
      { hour: 12, minute: 0 },
      // 12pm
      { hour: 17, minute: 0 }
      // 5pm
    ];
    sentNotifications = /* @__PURE__ */ new Map();
  }
});

// server/services/notification-scheduler.ts
var notification_scheduler_exports = {};
__export(notification_scheduler_exports, {
  manualTriggers: () => manualTriggers,
  startNotificationScheduler: () => startNotificationScheduler,
  stopNotificationScheduler: () => stopNotificationScheduler
});
function startNotificationScheduler() {
  if (!NOTIFICATIONS_ENABLED) {
    console.log("Notification system is disabled");
    return;
  }
  console.log("Starting notification scheduler services...");
  stopNotificationScheduler();
  scheduledDigestIntervalId = setInterval(async () => {
    try {
      await checkScheduledDigests();
      schedulerRunCount++;
      if (schedulerRunCount % 60 === 0) {
        cleanupNotificationTracking();
        schedulerRunCount = 0;
      }
    } catch (error) {
      console.error("Error in scheduled digest interval:", error);
    }
  }, SCHEDULE_CHECK_INTERVAL);
  urgentNotificationIntervalId = setInterval(async () => {
    try {
      await checkUrgentNotifications();
    } catch (error) {
      console.error("Error in urgent notification interval:", error);
    }
  }, URGENT_CHECK_INTERVAL);
  console.log("Notification scheduler services started");
}
function stopNotificationScheduler() {
  if (scheduledDigestIntervalId) {
    clearInterval(scheduledDigestIntervalId);
    scheduledDigestIntervalId = null;
  }
  if (urgentNotificationIntervalId) {
    clearInterval(urgentNotificationIntervalId);
    urgentNotificationIntervalId = null;
  }
  console.log("Notification scheduler services stopped");
}
async function checkScheduledDigests() {
  try {
    if (!isScheduledDigestTime()) {
      return;
    }
    console.log("Scheduled digest time detected, sending digests...");
    const users2 = await storage.getUsers();
    let sentCount = 0;
    for (const user of users2) {
      try {
        const result = await sendScheduledDigest(user.id);
        if (result) {
          sentCount++;
        }
      } catch (error) {
        console.error(`Error sending digest to user ${user.id}:`, error);
      }
    }
    console.log(`Finished sending scheduled digests to ${sentCount} users`);
  } catch (error) {
    console.error("Error checking scheduled digests:", error);
  }
}
async function checkUrgentNotifications() {
  try {
    console.log("Checking for urgent notifications...");
    const users2 = await storage.getUsers();
    let taskNotificationsSent = 0;
    let meetingNotificationsSent = 0;
    let leadNotificationsSent = 0;
    for (const user of users2) {
      const userId = user.id;
      const tasksResult = await storage.getTasksByUserId(userId);
      const tasks2 = tasksResult || [];
      for (const task of tasks2) {
        if (!task.completed) {
          const sent = await sendUrgentTaskNotification(userId, null, task);
          if (sent) taskNotificationsSent++;
        }
      }
      const eventsResult = await storage.getEventsByUserId(userId);
      const meetings = eventsResult || [];
      for (const meeting of meetings) {
        const sent = await sendImminentMeetingNotification(userId, null, meeting);
        if (sent) meetingNotificationsSent++;
      }
      const leadsResult = await storage.getLeadsByUserId(userId);
      const leads2 = leadsResult || [];
      for (const lead of leads2) {
        const sent = await sendHighPriorityLeadNotification(userId, null, lead);
        if (sent) leadNotificationsSent++;
      }
    }
    console.log(
      `Urgent notifications sent: ${taskNotificationsSent} tasks, ${meetingNotificationsSent} meetings, ${leadNotificationsSent} leads`
    );
  } catch (error) {
    console.error("Error checking urgent notifications:", error);
  }
}
var NOTIFICATIONS_ENABLED, SCHEDULE_CHECK_INTERVAL, URGENT_CHECK_INTERVAL, schedulerRunCount, scheduledDigestIntervalId, urgentNotificationIntervalId, manualTriggers;
var init_notification_scheduler = __esm({
  "server/services/notification-scheduler.ts"() {
    "use strict";
    init_storage();
    init_scheduled_notifications();
    NOTIFICATIONS_ENABLED = true;
    SCHEDULE_CHECK_INTERVAL = 60 * 1e3;
    URGENT_CHECK_INTERVAL = 5 * 60 * 1e3;
    schedulerRunCount = 0;
    scheduledDigestIntervalId = null;
    urgentNotificationIntervalId = null;
    manualTriggers = {
      triggerDigestForUser: async (userId) => {
        try {
          return await sendScheduledDigest(userId);
        } catch (error) {
          console.error(`Error manually triggering digest for user ${userId}:`, error);
          return false;
        }
      },
      triggerUrgentTaskNotification: async (userId, clientId, taskId) => {
        try {
          const task = await storage.getTask(taskId);
          if (!task || task.userId !== userId) {
            return false;
          }
          return await sendUrgentTaskNotification(userId, clientId, task);
        } catch (error) {
          console.error(`Error manually triggering task notification for task ${taskId}:`, error);
          return false;
        }
      }
    };
  }
});

// server/services/outlook-service.ts
var outlook_service_exports = {};
__export(outlook_service_exports, {
  convertOutlookMessageToInternalFormat: () => convertOutlookMessageToInternalFormat,
  createMicrosoftGraphClient: () => createMicrosoftGraphClient,
  disconnectOutlook: () => disconnectOutlook,
  exchangeCodeForToken: () => exchangeCodeForToken2,
  generateMicrosoftAuthUrl: () => generateMicrosoftAuthUrl,
  getCalendarEvents: () => getCalendarEvents,
  getMessage: () => getMessage,
  getMessages: () => getMessages,
  getUserProfile: () => getUserProfile,
  isOutlookConnected: () => isOutlookConnected,
  refreshMicrosoftToken: () => refreshMicrosoftToken,
  sendEmail: () => sendEmail2,
  storeOutlookCredentials: () => storeOutlookCredentials,
  syncRecentEmails: () => syncRecentEmails
});
import { Client } from "@microsoft/microsoft-graph-client";
import {
  ConfidentialClientApplication
} from "@azure/msal-node";
async function generateMicrosoftAuthUrl(userId, redirectUri) {
  console.log(`Generating Microsoft auth URL with redirectUri: ${redirectUri}`);
  console.log(`Microsoft client ID status: ${process.env.MICROSOFT_CLIENT_ID ? "Available" : "Missing"}`);
  const authUrlParameters = {
    scopes: OUTLOOK_SCOPES,
    redirectUri,
    state: userId.toString(),
    // Add these specific parameters to improve compatibility
    prompt: "select_account",
    // Force account selection every time
    responseMode: "query"
    // Ensure response comes as query parameters
  };
  try {
    const authUrl = await cca.getAuthCodeUrl(authUrlParameters);
    console.log("Generated Microsoft auth URL successfully");
    return authUrl;
  } catch (error) {
    console.error("Error generating Microsoft auth URL:", error);
    throw new Error(`Failed to generate Microsoft auth URL: ${error.message || "Unknown error"}`);
  }
}
async function exchangeCodeForToken2(code, redirectUri) {
  try {
    console.log(`Attempting to exchange code for token with redirect URI: ${redirectUri}`);
    const tokenRequest = {
      code,
      scopes: OUTLOOK_SCOPES,
      redirectUri
    };
    const response = await cca.acquireTokenByCode(tokenRequest);
    console.log("Successfully acquired token from Microsoft");
    return response;
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    if (error.errorCode === "invalid_grant") {
      throw new Error("Invalid authorization code. Please try connecting again.");
    } else if (error.errorCode === "invalid_client") {
      throw new Error("Invalid client configuration. Please check Microsoft app credentials.");
    }
    throw new Error(`Authentication error: ${error.message || "Unknown error during Microsoft authentication"}`);
  }
}
async function storeOutlookCredentials(userId, tokenData) {
  try {
    const expiresAt = tokenData.expiresOn ? tokenData.expiresOn.getTime() : Date.now() + 3600 * 1e3;
    const credentials = {
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expires_at: expiresAt,
      scope: Array.isArray(tokenData.scopes) ? tokenData.scopes.join(" ") : tokenData.scopes || OUTLOOK_SCOPES.join(" "),
      id_token: tokenData.idToken,
      email: tokenData.account?.username || tokenData.account?.homeAccountId || "",
      token_type: "Bearer",
      provider: "microsoft"
    };
    console.log("Storing Microsoft credentials for user:", userId);
    console.log("Token expires at:", new Date(expiresAt).toISOString());
    console.log("User email:", credentials.email);
    await storage.storeEmailIntegration(userId, "microsoft", JSON.stringify(credentials));
    console.log("Microsoft credentials stored successfully to database");
    const verification = await storage.getEmailIntegration(userId, "microsoft");
    if (verification) {
      console.log("\u2713 Microsoft integration verified in database");
    } else {
      console.error("\u2717 Microsoft integration verification failed - not found in database");
      throw new Error("Failed to verify Microsoft integration storage");
    }
  } catch (error) {
    console.error("Error storing Microsoft credentials:", error);
    throw error;
  }
}
async function refreshMicrosoftToken(userId) {
  try {
    const integration = await storage.getEmailIntegration(userId, "microsoft");
    if (!integration || !integration.connected) {
      console.log(`No active Microsoft integration found for user ${userId}`);
      return null;
    }
    let credentials;
    try {
      credentials = JSON.parse(integration.credentials);
    } catch (parseError) {
      console.error(`Failed to parse Microsoft credentials for user ${userId}:`, parseError);
      return null;
    }
    if (!credentials || !credentials.refresh_token) {
      console.error(`Invalid Microsoft credentials format for user ${userId} - missing refresh token`);
      await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify({
        ...credentials,
        connection_error: true,
        error_message: "Invalid credentials format. Please reconnect your Microsoft account.",
        error_time: (/* @__PURE__ */ new Date()).toISOString()
      }));
      return null;
    }
    if (credentials.expires_at && credentials.expires_at > Date.now() + 30 * 60 * 1e3) {
      const expiresInMinutes = Math.floor((credentials.expires_at - Date.now()) / 6e4);
      console.log(`Using existing Microsoft token for user ${userId} (expires in ${expiresInMinutes} minutes)`);
      if (expiresInMinutes < 120) {
        console.log(`Warning: Microsoft token for user ${userId} will expire soon (${expiresInMinutes} minutes)`);
      }
      return credentials.access_token;
    }
    console.log(`Microsoft token expired or expiring soon for user ${userId}, refreshing...`);
    const refreshStartTime = Date.now();
    const response = await cca.acquireTokenByRefreshToken({
      refreshToken: credentials.refresh_token,
      scopes: OUTLOOK_SCOPES
    });
    if (!response || !response.accessToken) {
      console.error(`Failed to refresh Microsoft token for user ${userId}: No valid token received`);
      await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify({
        ...credentials,
        connection_error: true,
        error_message: "Token refresh failed. Please reconnect your Microsoft account.",
        error_time: (/* @__PURE__ */ new Date()).toISOString()
      }));
      return null;
    }
    console.log(`Successfully refreshed Microsoft token for user ${userId}`);
    const expiresAt = response.expiresOn ? response.expiresOn.getTime() : Date.now() + 3600 * 1e3;
    const refreshToken = response.refreshToken || credentials.refresh_token;
    const updatedCredentials = {
      access_token: response.accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      scope: Array.isArray(response.scopes) ? response.scopes.join(" ") : response.scopes || credentials.scope,
      id_token: response.idToken || credentials.id_token,
      email: response.account?.username || credentials.email || "",
      last_refreshed: (/* @__PURE__ */ new Date()).toISOString(),
      connection_error: false
      // Reset any previous error state
    };
    await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify(updatedCredentials));
    console.log(`Updated Microsoft credentials stored for user ${userId}, expires in ${Math.round((expiresAt - Date.now()) / 6e4)} minutes`);
    return updatedCredentials.access_token;
  } catch (error) {
    console.error(`Error refreshing Microsoft token for user ${userId}:`, error);
    const integration = await storage.getEmailIntegration(userId, "microsoft");
    if (integration) {
      let credentials;
      try {
        credentials = JSON.parse(integration.credentials);
      } catch (e) {
        credentials = {};
      }
      const errorMessage = typeof error === "string" ? error.toLowerCase() : error?.message ? error.message.toLowerCase() : error.toString().toLowerCase();
      if (errorMessage.includes("invalid_grant") || errorMessage.includes("token expired") || errorMessage.includes("interaction_required") || errorMessage.includes("aadsts") || // Catch all AADSTS error codes
      errorMessage.includes("expired") || errorMessage.includes("invalid token") || errorMessage.includes("unauthorized")) {
        console.error(`Microsoft refresh token invalid or expired for user ${userId}, marking as problematic`);
        console.error(`Detailed error message: ${errorMessage}`);
        await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify({
          ...credentials,
          connection_error: true,
          error_message: "Authentication token expired. Please reconnect your Microsoft account.",
          error_time: (/* @__PURE__ */ new Date()).toISOString(),
          error_details: errorMessage.substring(0, 200)
          // Store limited details for debugging
        }));
      }
    }
    return null;
  }
}
async function createMicrosoftGraphClient(userId) {
  try {
    const accessToken = await refreshMicrosoftToken(userId);
    if (!accessToken) {
      return null;
    }
    const authProvider = {
      getAccessToken: async () => accessToken
    };
    const client = Client.initWithMiddleware({
      authProvider
    });
    return client;
  } catch (error) {
    console.error(`Error creating Microsoft Graph client for user ${userId}:`, error);
    return null;
  }
}
async function getUserProfile(userId) {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return null;
    }
    const profile = await client.api("/me").get();
    return profile;
  } catch (error) {
    console.error(`Error fetching Microsoft user profile for user ${userId}:`, error);
    return null;
  }
}
async function getMessages(userId, options = {}) {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return [];
    }
    let query = client.api("/me/messages").select("id,subject,bodyPreview,receivedDateTime,from,toRecipients,hasAttachments,importance,isRead").orderby("receivedDateTime DESC");
    if (options.filter) {
      query = query.filter(options.filter);
    }
    if (options.maxResults) {
      query = query.top(options.maxResults);
    }
    const response = await query.get();
    return response.value || [];
  } catch (error) {
    console.error(`Error fetching Outlook messages for user ${userId}:`, error);
    return [];
  }
}
async function getMessage(userId, messageId) {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return null;
    }
    const message = await client.api(`/me/messages/${messageId}`).select("id,subject,body,receivedDateTime,from,toRecipients,ccRecipients,hasAttachments").expand("attachments").get();
    return message;
  } catch (error) {
    console.error(`Error fetching Outlook message for user ${userId}:`, error);
    return null;
  }
}
async function sendEmail2(userId, emailData) {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      throw new Error("Microsoft account not connected. Please connect your Microsoft account in Settings to use this feature.");
    }
    const message = {
      subject: emailData.subject,
      body: {
        contentType: emailData.isHtml ? "html" : "text",
        content: emailData.body
      },
      toRecipients: emailData.toRecipients.map((email) => ({
        emailAddress: { address: email }
      }))
    };
    if (emailData.ccRecipients && emailData.ccRecipients.length > 0) {
      message["ccRecipients"] = emailData.ccRecipients.map((email) => ({
        emailAddress: { address: email }
      }));
    }
    if (emailData.bccRecipients && emailData.bccRecipients.length > 0) {
      message["bccRecipients"] = emailData.bccRecipients.map((email) => ({
        emailAddress: { address: email }
      }));
    }
    await client.api("/me/sendMail").post({
      message,
      saveToSentItems: true
    });
    return true;
  } catch (error) {
    console.error(`Error sending email for user ${userId}:`, error);
    throw error;
  }
}
async function getCalendarEvents(userId, options = {}) {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return [];
    }
    let query = client.api("/me/calendar/events").select("id,subject,bodyPreview,start,end,location,attendees,organizer").orderby("start/dateTime");
    if (options.startDateTime && options.endDateTime) {
      query = query.filter(`start/dateTime ge '${options.startDateTime}' and end/dateTime le '${options.endDateTime}'`);
    }
    if (options.maxResults) {
      query = query.top(options.maxResults);
    }
    const response = await query.get();
    return response.value || [];
  } catch (error) {
    console.error(`Error fetching Outlook calendar events for user ${userId}:`, error);
    return [];
  }
}
async function isOutlookConnected(userId) {
  try {
    console.log(`[Microsoft] Checking connection status for user ${userId}`);
    const integration = await storage.getEmailIntegration(userId, "microsoft");
    if (!integration || !integration.connected) {
      console.log(`[Microsoft] No active integration found for user ${userId}`);
      return false;
    }
    try {
      const credentials = JSON.parse(integration.credentials);
      if (credentials.connection_error) {
        console.log(`[Microsoft] Connection for user ${userId} has error flag: ${credentials.error_message}`);
        const refreshedToken = await refreshMicrosoftToken(userId);
        if (!refreshedToken) {
          console.log(`[Microsoft] Could not recover connection for user ${userId}, token refresh failed`);
          return false;
        }
        console.log(`[Microsoft] Successfully recovered connection for user ${userId}`);
        try {
          credentials.connection_error = false;
          credentials.error_message = "";
          credentials.last_refreshed = (/* @__PURE__ */ new Date()).toISOString();
          await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify(credentials));
          await storage.updateEmailIntegrationLastSynced(userId, "microsoft");
        } catch (updateError) {
          console.error(`[Microsoft] Error updating credentials after recovery for user ${userId}:`, updateError);
        }
      }
      try {
        console.log(`[Microsoft] Refreshing token and syncing emails for user ${userId}`);
        const token = await refreshMicrosoftToken(userId);
        if (token) {
          await storage.updateEmailIntegrationLastSynced(userId, "microsoft");
          syncRecentEmails(userId, 10).then((result) => {
            if (result.success) {
              console.log(`[Microsoft] Auto-synced ${result.count} emails during connection check for user ${userId}`);
            } else {
              console.warn(`[Microsoft] Auto-sync during connection check failed for user ${userId}: ${result.error}`);
            }
          }).catch((err) => {
            console.error(`[Microsoft] Error in auto-sync during connection check for user ${userId}:`, err);
          });
          return true;
        } else {
          console.log(`[Microsoft] Token refresh failed for user ${userId} during connection check`);
          try {
            credentials.connection_error = true;
            credentials.error_message = "Token refresh failed. Please reconnect your Microsoft account.";
            credentials.error_time = (/* @__PURE__ */ new Date()).toISOString();
            await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify(credentials));
          } catch (updateError) {
            console.error(`[Microsoft] Error updating credentials with error state for user ${userId}:`, updateError);
          }
          return false;
        }
      } catch (refreshError) {
        console.error(`[Microsoft] Error refreshing token during connection check for user ${userId}:`, refreshError);
        try {
          credentials.connection_error = true;
          credentials.error_message = "Token refresh failed. Please reconnect your Microsoft account.";
          credentials.error_time = (/* @__PURE__ */ new Date()).toISOString();
          await storage.updateEmailIntegration(userId, "microsoft", JSON.stringify(credentials));
        } catch (updateError) {
          console.error(`[Microsoft] Error updating credentials with error state for user ${userId}:`, updateError);
        }
        return false;
      }
    } catch (parseError) {
      console.error(`[Microsoft] Error parsing credentials for user ${userId}:`, parseError);
      return false;
    }
  } catch (error) {
    console.error(`[Microsoft] Error checking connection for user ${userId}:`, error);
    return false;
  }
}
async function disconnectOutlook(userId) {
  try {
    await storage.deleteEmailIntegration(userId, "microsoft");
    return true;
  } catch (error) {
    console.error(`Error disconnecting Outlook for user ${userId}:`, error);
    return false;
  }
}
function convertOutlookMessageToInternalFormat(message) {
  return {
    id: message.id,
    threadId: message.conversationId || message.id,
    messageId: message.id,
    subject: message.subject || "(No subject)",
    from: message.from?.emailAddress?.address || "",
    fromName: message.from?.emailAddress?.name || "",
    to: message.toRecipients?.map((r) => r.emailAddress.address).join(", ") || "",
    cc: message.ccRecipients?.map((r) => r.emailAddress.address).join(", ") || "",
    date: new Date(message.receivedDateTime),
    body: message.body?.content || message.bodyPreview || "",
    bodyType: message.body?.contentType || "text",
    hasAttachments: message.hasAttachments || false,
    isRead: message.isRead || false,
    importance: message.importance || "normal",
    source: "microsoft"
  };
}
async function syncRecentEmails(userId, maxResults = 100) {
  try {
    console.log(`Starting Microsoft email sync for user ${userId}, fetching up to ${maxResults} emails...`);
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User ${userId} not found when attempting to sync Microsoft emails`);
      return { success: false, count: 0, error: "User not found" };
    }
    try {
      const accessToken = await refreshMicrosoftToken(userId);
      if (!accessToken) {
        console.error(`Unable to refresh Microsoft token for user ${userId}, connection may be broken`);
        return {
          success: false,
          count: 0,
          error: "Microsoft connection is not valid. Please reconnect your Microsoft account."
        };
      }
      console.log(`Successfully verified Microsoft token for user ${userId}`);
    } catch (tokenError) {
      console.error(`Token refresh failed for Microsoft sync for user ${userId}:`, tokenError);
      return {
        success: false,
        count: 0,
        error: "Failed to authenticate with Microsoft. Please reconnect your account."
      };
    }
    console.log(`Fetching Microsoft messages for user ${userId}...`);
    const messages = await getMessages(userId, { maxResults });
    if (!messages || !messages.length) {
      console.log(`No Microsoft messages found for user ${userId}`);
      await storage.updateUserLastEmailSyncDate(userId, /* @__PURE__ */ new Date());
      return { success: true, count: 0 };
    }
    console.log(`Found ${messages.length} Microsoft messages for user ${userId}`);
    let count = 0;
    let errorCount = 0;
    const batchSize = 20;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      console.log(`Processing Microsoft email batch ${i / batchSize + 1} (${batch.length} emails) for user ${userId}`);
      for (const message of batch) {
        try {
          const email = convertOutlookMessageToInternalFormat(message);
          if (!email.messageId) {
            console.warn(`Skipping Microsoft email with missing messageId for user ${userId}`);
            continue;
          }
          const existingEmail = await storage.getEmailByMessageId(userId, email.messageId);
          if (!existingEmail) {
            let fullBody = email.body;
            if (!fullBody || fullBody.length < 100) {
              try {
                const fullMessage = await getMessage(userId, email.messageId);
                if (fullMessage && fullMessage.body && fullMessage.body.content) {
                  fullBody = fullMessage.body.content;
                }
              } catch (bodyError) {
                console.warn(`Failed to get full body for message ${email.messageId}:`, bodyError);
              }
            }
            await storage.storeEmail({
              userId,
              threadId: email.threadId,
              messageId: email.messageId,
              subject: email.subject,
              from: email.from,
              to: email.to,
              body: fullBody || email.body,
              date: email.date,
              hasAttachments: email.hasAttachments,
              isRead: email.isRead,
              processed: false,
              source: "microsoft"
            });
            count++;
            console.log(`Saved Microsoft email ${email.messageId} from ${email.from} with subject "${email.subject.substring(0, 30)}..." to database`);
          } else {
            console.log(`Skipping already imported Microsoft email ${email.messageId}`);
          }
        } catch (emailError) {
          console.error(`Error processing Microsoft email for user ${userId}:`, emailError);
          errorCount++;
        }
      }
    }
    await storage.updateUserLastEmailSyncDate(userId, /* @__PURE__ */ new Date());
    console.log(`Microsoft email sync complete for user ${userId}: ${count} new emails imported, ${errorCount} errors`);
    return {
      success: true,
      count,
      error: errorCount > 0 ? `Sync completed with ${errorCount} errors` : void 0
    };
  } catch (error) {
    console.error(`Error syncing Microsoft emails for user ${userId}:`, error);
    return {
      success: false,
      count: 0,
      error: `Failed to sync Microsoft emails: ${error.message || "Unknown error"}`
    };
  }
}
var OUTLOOK_SCOPES, msalConfig, cca;
var init_outlook_service = __esm({
  "server/services/outlook-service.ts"() {
    "use strict";
    init_storage();
    OUTLOOK_SCOPES = [
      "offline_access",
      "User.Read",
      "Mail.Read",
      "Mail.ReadWrite",
      "Mail.Send",
      "Calendars.Read",
      "Calendars.ReadWrite"
    ];
    msalConfig = {
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID || "",
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
        authority: "https://login.microsoftonline.com/common"
      }
    };
    cca = new ConfidentialClientApplication(msalConfig);
  }
});

// server/services/google-calendar.ts
var google_calendar_exports = {};
__export(google_calendar_exports, {
  createGoogleCalendarEvent: () => createGoogleCalendarEvent,
  createOAuth2Client: () => createOAuth2Client2,
  fetchGoogleCalendarEvents: () => fetchGoogleCalendarEvents,
  getCalendarClient: () => getCalendarClient,
  syncEventToGoogleCalendar: () => syncEventToGoogleCalendar
});
import { google as google3 } from "googleapis";
function createOAuth2Client2() {
  const callbackUrl = config_default.google.callbackUrl;
  console.log(`[Calendar] Using OAuth callback URL: ${callbackUrl}`);
  const oauth2Client2 = new google3.auth.OAuth2(
    config_default.google.clientId,
    config_default.google.clientSecret,
    callbackUrl
  );
  return oauth2Client2;
}
async function getCalendarClient(userId) {
  try {
    const service = await storage.getConnectedService(userId, "google");
    if (!service || service.connected === false || !service.credentials) {
      console.log(`No valid Google service found for user ${userId}`);
      return null;
    }
    const tokens = service.credentials;
    const oauth2Client2 = createOAuth2Client2();
    oauth2Client2.setCredentials(tokens);
    oauth2Client2.on("tokens", async (newTokens) => {
      const updatedTokens = { ...tokens, ...newTokens };
      await storage.updateConnectedService(userId, "google", {
        credentials: updatedTokens,
        connected: true
      });
      console.log(`Calendar tokens refreshed for user ${userId}`);
    });
    return google3.calendar({ version: "v3", auth: oauth2Client2 });
  } catch (error) {
    console.error(`Error getting Calendar client for user ${userId}:`, error);
    return null;
  }
}
async function fetchGoogleCalendarEvents(userId, maxResults = 20) {
  try {
    const calendarClient = await getCalendarClient(userId);
    if (!calendarClient) {
      console.log(`Could not get Calendar client for user ${userId}`);
      return [];
    }
    const now = /* @__PURE__ */ new Date();
    const response = await calendarClient.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime"
    });
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching Google Calendar events for user ${userId}:`, error);
    return [];
  }
}
async function createGoogleCalendarEvent(userId, event) {
  try {
    const calendarClient = await getCalendarClient(userId);
    if (!calendarClient) {
      console.log(`Could not get Calendar client for user ${userId}`);
      return null;
    }
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: new Date(event.startTime).toISOString(),
        timeZone: "UTC"
      },
      end: {
        dateTime: new Date(event.endTime).toISOString(),
        timeZone: "UTC"
      },
      location: event.location,
      attendees: event.attendees?.map((email) => ({ email })) || []
    };
    const response = await calendarClient.events.insert({
      calendarId: "primary",
      requestBody: googleEvent,
      sendUpdates: "all"
      // Send updates to all attendees
    });
    console.log(`Created Google Calendar event for user ${userId}: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating Google Calendar event for user ${userId}:`, error);
    return null;
  }
}
async function syncEventToGoogleCalendar(userId, eventId) {
  try {
    const event = await storage.getEvent(eventId);
    if (!event || event.userId !== userId) {
      console.error(`Event ${eventId} not found or does not belong to user ${userId}`);
      return false;
    }
    const googleEvent = await createGoogleCalendarEvent(userId, event);
    if (!googleEvent) {
      return false;
    }
    const updatedContextNotes = event.contextNotes ? `${event.contextNotes}

Google Calendar Event ID: ${googleEvent.id}` : `Google Calendar Event ID: ${googleEvent.id}`;
    await storage.updateEvent(userId, eventId, {
      meetingUrl: googleEvent.hangoutLink || event.meetingUrl,
      contextNotes: updatedContextNotes
    });
    return true;
  } catch (error) {
    console.error(`Error syncing event ${eventId} to Google Calendar for user ${userId}:`, error);
    return false;
  }
}
var init_google_calendar = __esm({
  "server/services/google-calendar.ts"() {
    "use strict";
    init_storage();
    init_config();
  }
});

// server/services/invoice-management.ts
var invoice_management_exports = {};
__export(invoice_management_exports, {
  checkOverdueInvoices: () => checkOverdueInvoices,
  detectInvoiceRequests: () => detectInvoiceRequests,
  getPendingInvoices: () => getPendingInvoices
});
async function checkOverdueInvoices(userId, sendNotifications = false) {
  try {
    const invoices2 = await storage.getInvoicesByUserId(userId);
    const now = /* @__PURE__ */ new Date();
    const overdueInvoices = invoices2.filter((invoice) => {
      if (invoice.status === "paid" || invoice.status === "draft") {
        return false;
      }
      if (!invoice.dueDate) {
        return false;
      }
      const dueDate = new Date(invoice.dueDate);
      return dueDate < now;
    });
    if (sendNotifications && overdueInvoices.length > 0) {
      console.log(`Found ${overdueInvoices.length} overdue invoices for user ${userId} that need email notifications`);
    }
    return overdueInvoices;
  } catch (error) {
    console.error(`Error checking overdue invoices for user ${userId}:`, error);
    return [];
  }
}
async function detectInvoiceRequests(userId) {
  try {
    console.log(`Processing emails for user ${userId} to detect invoice requests`);
    const { getUnprocessedEmailsForInvoiceDetection, markEmailProcessedForInvoiceDetection } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
    const emails3 = await getUnprocessedEmailsForInvoiceDetection(userId);
    if (!emails3.length) {
      console.log(`No unprocessed emails found for invoice detection for user ${userId}`);
      return 0;
    }
    let invoicesCreated = 0;
    for (const email of emails3) {
      const invoiceKeywords = ["invoice", "payment", "bill", "charge", "fee", "service", "project", "work", "contract"];
      const isInvoiceRelated = invoiceKeywords.some(
        (keyword) => email.subject?.toLowerCase().includes(keyword) || email.body?.toLowerCase().includes(keyword)
      );
      if (!isInvoiceRelated || !email.body || email.body.trim().length < 30) {
        await markEmailProcessedForInvoiceDetection(userId, email.id);
        continue;
      }
      const emailContent = `
        From: ${email.from}
        Subject: ${email.subject}
        Date: ${email.date ? new Date(email.date).toISOString() : "Unknown"}
        
        ${email.body}
      `;
      const invoiceData = await extractInvoiceRequestFromEmail(emailContent);
      if (invoiceData && invoiceData.items && invoiceData.items.length > 0) {
        const date2 = /* @__PURE__ */ new Date();
        const year = date2.getFullYear();
        const month = String(date2.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(Math.random() * 1e3).toString().padStart(3, "0");
        const invoiceNumber = `INV-${year}${month}-${random}`;
        const totalAmount = invoiceData.items.reduce((sum, item) => sum + item.total, 0);
        await storage.createInvoice({
          userId,
          number: invoiceNumber,
          client: invoiceData.clientName || email.from || "Client",
          amount: totalAmount,
          status: "draft",
          issueDate: /* @__PURE__ */ new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
          // Due in 30 days
          items: invoiceData.items,
          remindersSent: 0,
          taxRate: 0,
          // Default no tax
          currency: "USD",
          // Default USD
          notes: invoiceData.notes || `Invoice created automatically based on email from ${email.from}`
        });
        invoicesCreated++;
        await storage.createTask({
          userId,
          title: `Review invoice ${invoiceNumber} for ${invoiceData.clientName || email.from || "Client"}`,
          description: `This invoice was automatically generated from an email. Please review and send it.`,
          priority: "high",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1e3),
          // Due in 1 day
          assignedTo: "me",
          estimatedTime: 15,
          aiGenerated: true,
          completed: false,
          source: "email",
          sourceId: email.id
        });
      }
      await markEmailProcessedForInvoiceDetection(userId, email.id);
    }
    console.log(`Created ${invoicesCreated} invoices from emails for user ${userId}`);
    return invoicesCreated;
  } catch (error) {
    console.error(`Error detecting invoice requests from emails for user ${userId}:`, error);
    return 0;
  }
}
async function getPendingInvoices(userId) {
  try {
    const invoices2 = await storage.getInvoicesByUserId(userId);
    return invoices2.filter((invoice) => invoice.status === "draft");
  } catch (error) {
    console.error(`Error getting pending invoices for user ${userId}:`, error);
    return [];
  }
}
var init_invoice_management = __esm({
  "server/services/invoice-management.ts"() {
    "use strict";
    init_storage();
    init_ai_service();
  }
});

// server/services/task-management.ts
async function getTasksDueSoon(userId, hours = 24) {
  try {
    const now = /* @__PURE__ */ new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1e3);
    try {
      const tasks2 = await storage.getTasksByUserId(userId);
      return tasks2.filter(
        (task) => !task.completed && task.dueDate && new Date(task.dueDate) <= cutoff
      );
    } catch (dbError) {
      console.warn(`Using fallback method for tasks due soon: ${dbError.message}`);
      return [];
    }
  } catch (error) {
    console.error(`Error getting tasks due soon for user ${userId}:`, error);
    return [];
  }
}
async function processEmailsForTasks(userId) {
  try {
    console.log(`Email processing for tasks is not yet implemented`);
    return { created: 0 };
  } catch (error) {
    console.error(`Error processing emails for tasks for user ${userId}:`, error);
    return { created: 0 };
  }
}
async function sendTaskReminders(userId) {
  try {
    const upcomingTasks = await getTasksDueSoon(userId, 24);
    if (upcomingTasks.length === 0) {
      return { sent: 0, slackSent: false };
    }
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return { sent: 0, slackSent: false };
    }
    const preferences = user.preferences ? typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences : {};
    if (preferences.taskReminders === false || preferences.emailNotifications === false) {
      console.log(`Task reminders or email notifications disabled for user ${userId}, skipping email reminders`);
      return { sent: 0, slackSent: false };
    }
    const lastReminderTime = await storage.getLastTaskReminderDate(userId);
    if (lastReminderTime) {
      const lastTime = new Date(lastReminderTime);
      const now = /* @__PURE__ */ new Date();
      if (now.getTime() - lastTime.getTime() < 8 * 60 * 60 * 1e3) {
        console.log(`Skipping task reminder for user ${userId} - last reminder sent ${Math.round((now.getTime() - lastTime.getTime()) / (60 * 60 * 1e3))} hours ago`);
        return { sent: 0, slackSent: false };
      }
    }
    const highPriorityTasks = upcomingTasks.filter((t) => t.priority === "high");
    const otherTasks = upcomingTasks.filter((t) => t.priority !== "high");
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
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";
        emailContent += `
          <li>
            <strong>${task.title}</strong> - Due: ${dueDate}
            ${task.description ? `<br/><small>${task.description}</small>` : ""}
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
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";
        const priority = task.priority === "medium" ? "Medium" : "Low";
        emailContent += `
          <li>
            <strong>${task.title}</strong> (${priority}) - Due: ${dueDate}
          </li>
        `;
      }
      emailContent += `</ul>`;
    }
    await sendEmailNotification(
      user,
      "Task Reminders: Upcoming Due Dates",
      emailContent,
      { isHtml: true }
    );
    await storage.updateTaskReminderDate(userId);
    console.log(`Email task reminder sent for user ${userId} and reminder date updated`);
    let slackSent = false;
    return { sent: upcomingTasks.length, slackSent };
  } catch (error) {
    console.error(`Error sending task reminders for user ${userId}:`, error);
    return { sent: 0, slackSent: false };
  }
}
async function processTasksForUser(userId) {
  try {
    const results = {
      created: 0,
      remindersSent: 0,
      slackNotificationsSent: false
    };
    const user = await storage.getUser(userId);
    if (!user) {
      return results;
    }
    const emailTasks = await processEmailsForTasks(userId);
    results.created += emailTasks.created;
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
var init_task_management = __esm({
  "server/services/task-management.ts"() {
    "use strict";
    init_storage();
    init_email_sender();
    init_slack_service();
  }
});

// server/services/calendar-management.ts
async function sendMeetingReminder(userId, eventId) {
  try {
    const event = await storage.getEvent(eventId);
    if (!event || event.userId !== userId) {
      console.error(`Event ${eventId} not found or does not belong to user ${userId}`);
      return false;
    }
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return false;
    }
    let agenda = event.description || "";
    if (!agenda.includes("Agenda:")) {
      const generatedAgenda = await generateMeetingAgenda(
        event.title,
        new Date(event.startTime).toISOString(),
        event.attendees || []
      );
      if (generatedAgenda) {
        agenda = generatedAgenda;
        await storage.updateEvent(userId, eventId, {
          description: agenda
        });
      }
    }
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const timeString = `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`;
    const meetingReminder = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #2563EB;">Meeting Reminder</h1>
        <p>Hello ${user.fullName || user.username},</p>
        <p>This is a reminder for your upcoming meeting:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #2563EB;">${event.title}</h2>
          <p><strong>Time:</strong> ${timeString}</p>
          <p><strong>Date:</strong> ${startTime.toLocaleDateString()}</p>
          ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ""}
          ${event.meetingUrl ? `<p><strong>Meeting URL:</strong> <a href="${event.meetingUrl}">${event.meetingUrl}</a></p>` : ""}
          ${event.attendees && event.attendees.length > 0 ? `<p><strong>Attendees:</strong> ${event.attendees.join(", ")}</p>` : ""}
        </div>
        
        ${agenda ? `
        <h3>Agenda:</h3>
        <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0;">
          ${agenda.replace(/\\n/g, "<br>")}
        </div>
        ` : ""}
        
        <p>This reminder was automatically generated by Binate AI.</p>
      </div>
    `;
    const userEmail = user.email;
    if (!userEmail) {
      console.error(`Cannot send meeting reminder: User ${userId} has no email address`);
      return false;
    }
    const { sendPlainEmail: sendPlainEmail2 } = await Promise.resolve().then(() => (init_email_sender(), email_sender_exports));
    const sent = await sendPlainEmail2(
      user,
      userEmail,
      `Meeting Reminder: ${event.title}`,
      meetingReminder,
      true
      // isHtml
    );
    let slackSent = false;
    try {
      const preferences = user.preferences ? typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences : {};
      if (preferences.slackNotificationsEnabled !== false) {
        console.log(`Sending Slack meeting reminder for event ${eventId}`);
        const slackResult = await sendMeetingReminderNotification(
          userId,
          event.title,
          new Date(event.startTime),
          eventId,
          event.location || void 0,
          event.meetingUrl || void 0
        );
        slackSent = slackResult.success;
        if (slackSent) {
          console.log(`Slack meeting reminder sent for event ${eventId}`);
        } else {
          console.error(`Failed to send Slack meeting reminder for event ${eventId}: ${slackResult.errorMessage || "Unknown error"}`);
        }
      }
    } catch (slackError) {
      console.error(`Error sending Slack meeting reminder for event ${eventId}:`, slackError);
    }
    if (sent || slackSent) {
      console.log(`Meeting reminder sent to ${userEmail} for event ${eventId} - Email: ${sent ? "Yes" : "No"}, Slack: ${slackSent ? "Yes" : "No"}`);
      await storage.updateEvent(userId, eventId, {
        reminderSent: true
      });
      return true;
    } else {
      console.error(`Failed to send meeting reminder for event ${eventId} (email and Slack both failed)`);
      return false;
    }
  } catch (error) {
    console.error(`Error sending meeting reminder for event ${eventId}:`, error);
    return false;
  }
}
async function generateMeetingSummary(userId, eventId) {
  try {
    const event = await storage.getEvent(eventId);
    if (!event || event.userId !== userId) {
      console.error(`Event ${eventId} not found or does not belong to user ${userId}`);
      return false;
    }
    if (event.summary) {
      console.log(`Meeting summary already exists for event ${eventId}`);
      return true;
    }
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return false;
    }
    let meetingNotes = event.notes || "";
    if (!meetingNotes) {
      meetingNotes = `Meeting: ${event.title}
Attendees: ${event.attendees ? event.attendees.join(", ") : "Unknown"}
Agenda: ${event.description || "None provided"}`;
    }
    const summary = await generateMeetingSummaryFromNotes(meetingNotes);
    if (summary) {
      await storage.updateEvent(userId, eventId, {
        summary
      });
      if (summary.includes("Action Item") || summary.includes("TODO") || summary.includes("Task")) {
        const actionItems = summary.split("\n").filter(
          (line) => line.includes("Action Item:") || line.includes("TODO:") || line.includes("Task:")
        );
        for (const item of actionItems) {
          const actionText = item.replace(/Action Item:|TODO:|Task:/, "").trim();
          await storage.createTask({
            userId,
            title: actionText.substring(0, 100),
            // Ensure it's not too long
            description: `Generated from meeting: ${event.title}`,
            priority: "medium",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
            // Due in 7 days
            assignedTo: "me",
            estimatedTime: 30,
            aiGenerated: true,
            completed: false,
            source: "meeting",
            sourceId: event.id
          });
        }
      }
      const summaryEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #2563EB;">Meeting Summary</h1>
          <p>Hello ${user.fullName || user.username},</p>
          <p>Here's a summary of your recent meeting:</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563EB; padding: 15px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2563EB;">${event.title}</h2>
            <p><strong>Date:</strong> ${new Date(event.startTime).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}</p>
            ${event.attendees && event.attendees.length > 0 ? `<p><strong>Attendees:</strong> ${event.attendees.join(", ")}</p>` : ""}
          </div>
          
          <h3>Summary:</h3>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0;">
            ${summary.replace(/\n/g, "<br>")}
          </div>
          
          <p>This summary was automatically generated by Binate AI based on the meeting details and notes.</p>
        </div>
      `;
      const userEmail = user.email;
      if (!userEmail) {
        console.error(`Cannot send meeting summary: User ${userId} has no email address`);
        return false;
      }
      const { sendPlainEmail: sendPlainEmail2 } = await Promise.resolve().then(() => (init_email_sender(), email_sender_exports));
      const sent = await sendPlainEmail2(
        user,
        userEmail,
        `Meeting Summary: ${event.title}`,
        summaryEmail,
        true
        // isHtml
      );
      if (sent) {
        console.log(`Meeting summary sent to ${userEmail} for event ${eventId}`);
        return true;
      } else {
        console.error(`Failed to send meeting summary to ${userEmail} for event ${eventId}`);
        return false;
      }
    } else {
      console.error(`Failed to generate meeting summary for event ${eventId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error generating meeting summary for event ${eventId}:`, error);
    return false;
  }
}
async function runAutoCalendarManagement2() {
  try {
    const users2 = await storage.getAllUsers();
    for (const user of users2) {
      const events2 = await storage.getEventsByUserId(user.id);
      const now = /* @__PURE__ */ new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1e3);
      const upcomingMeetings = events2.filter((event) => {
        const startTime = new Date(event.startTime);
        return startTime > now && startTime < oneHourFromNow && !event.reminderSent;
      });
      for (const meeting of upcomingMeetings) {
        await sendMeetingReminder(user.id, meeting.id);
      }
      const justEndedMeetings = events2.filter((event) => {
        const endTime = new Date(event.endTime);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
        return endTime > oneHourAgo && endTime <= now && !event.summary;
      });
      for (const meeting of justEndedMeetings) {
        await generateMeetingSummary(user.id, meeting.id);
      }
    }
    return true;
  } catch (error) {
    console.error("Error in autonomous calendar management:", error);
    return false;
  }
}
var init_calendar_management = __esm({
  "server/services/calendar-management.ts"() {
    "use strict";
    init_storage();
    init_ai_service();
    init_slack_service();
  }
});

// server/services/autonomous-engine.ts
var autonomous_engine_exports = {};
__export(autonomous_engine_exports, {
  getEngineStatus: () => getEngineStatus,
  initAutonomousEngine: () => initAutonomousEngine,
  runAllProcessesNow: () => runAllProcessesNow,
  setEngineInterval: () => setEngineInterval,
  stopAutonomousEngine: () => stopAutonomousEngine
});
function initAutonomousEngine() {
  if (engineRunning) {
    console.log("Autonomous engine is already running.");
    return;
  }
  console.log("Initializing autonomous engine...");
  engineRunning = true;
  lastRunTimestamp = Date.now();
  console.log("Automatic processes have been temporarily disabled to prevent excessive notifications");
  currentInterval = 1e3 * 60 * 60 * 24;
  engineTimer = setInterval(() => {
    console.log("Running scheduled processes with reduced frequency");
    runEngineProcesses();
  }, currentInterval);
  console.log(`Autonomous engine initialized with ${currentInterval / (1e3 * 60)} minute interval.`);
}
function stopAutonomousEngine() {
  if (!engineRunning) {
    console.log("Autonomous engine is not running.");
    return;
  }
  console.log("Stopping autonomous engine...");
  if (engineTimer) {
    clearInterval(engineTimer);
    engineTimer = null;
  }
  engineRunning = false;
  console.log("Autonomous engine stopped.");
}
async function runEngineProcesses() {
  const startTime = Date.now();
  console.log(`Running autonomous engine processes at ${(/* @__PURE__ */ new Date()).toISOString()}`);
  try {
    const users2 = await storage.getAllUsers();
    const totalUsers = users2.length;
    console.log(`Processing autonomous tasks for ${totalUsers} users`);
    let emailsProcessed = 0;
    let tasksCreated = 0;
    let invoicesProcessed = 0;
    let leadsDetected = 0;
    let meetingsManaged = 0;
    let expensesCategorized = 0;
    for (const user of users2) {
      const preferences = user.preferences ? typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences : {};
      if (preferences.pauseAI === true) {
        console.log(`Skipping user ${user.id} - AI features paused`);
        continue;
      }
      try {
        if (preferences.autoManageInvoices !== false) {
          console.log(`Invoice processing for user ${user.id} temporarily disabled`);
        }
        if (preferences.autoManageCalendar !== false) {
          const calendarResults = await runAutoCalendarManagement2();
          meetingsManaged += 1;
        }
        if (preferences.autoManageTasks !== false) {
          const taskResults = await processTasksForUser(user.id);
          tasksCreated += taskResults.created || 0;
        }
        if (preferences.autoManageExpenses !== false) {
          console.log(`Expense processing for user ${user.id} temporarily disabled`);
        }
        if (preferences.autoManageLeads !== false) {
          console.log(`Lead processing for user ${user.id} temporarily disabled`);
        }
        if (preferences.slackEnabled !== false) {
          const notificationResults = await processScheduledNotifications(user.id);
          console.log(`Processed notifications for user ${user.id}: ${notificationResults.digestSent ? "Digest sent" : "No digest"}, ${notificationResults.urgentNotificationsSent} urgent notifications`);
        }
      } catch (error) {
        console.error(`Error processing autonomous tasks for user ${user.id}:`, error);
      }
    }
    await generateDailySummaries(users2);
    const endTime = Date.now();
    const totalProcessingTime = (endTime - startTime) / 1e3;
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
    adjustInterval(totalUsers, totalProcessingTime);
  } catch (error) {
    console.error("Error in autonomous engine cycle:", error);
  }
  lastRunTimestamp = Date.now();
}
function adjustInterval(userCount, processingTime) {
  const processingRatio = processingTime * 1e3 / currentInterval;
  if (processingRatio > 0.2) {
    currentInterval = Math.min(currentInterval * 1.5, MAX_INTERVAL);
    console.log(`Adjusting engine interval UP to ${currentInterval / (1e3 * 60)} minutes`);
    if (engineTimer) {
      clearInterval(engineTimer);
      engineTimer = setInterval(runEngineProcesses, currentInterval);
    }
  } else if (processingRatio < 0.05 && userCount > 0) {
    currentInterval = Math.max(currentInterval * 0.8, MIN_INTERVAL);
    console.log(`Adjusting engine interval DOWN to ${currentInterval / (1e3 * 60)} minutes`);
    if (engineTimer) {
      clearInterval(engineTimer);
      engineTimer = setInterval(runEngineProcesses, currentInterval);
    }
  }
}
async function generateDailySummaries(users2) {
  const now = /* @__PURE__ */ new Date();
  const currentHour = now.getUTCHours();
  if (currentHour < 7 || currentHour > 9) {
    return;
  }
  console.log("Daily summary generation is temporarily disabled as some storage functions are not implemented");
  return;
}
async function runAllProcessesNow() {
  await runEngineProcesses();
  return {
    success: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    nextScheduledRun: new Date(Date.now() + currentInterval).toISOString()
  };
}
function getEngineStatus() {
  return {
    running: engineRunning,
    lastRun: lastRunTimestamp ? new Date(lastRunTimestamp).toISOString() : null,
    interval: currentInterval,
    intervalMinutes: currentInterval / (1e3 * 60),
    nextScheduledRun: engineRunning && lastRunTimestamp ? new Date(lastRunTimestamp + currentInterval).toISOString() : null
  };
}
function setEngineInterval(minutes) {
  if (minutes < MIN_INTERVAL / (1e3 * 60) || minutes > MAX_INTERVAL / (1e3 * 60)) {
    throw new Error(`Interval must be between ${MIN_INTERVAL / (1e3 * 60)} and ${MAX_INTERVAL / (1e3 * 60)} minutes`);
  }
  const newInterval = minutes * 60 * 1e3;
  currentInterval = newInterval;
  if (engineRunning && engineTimer) {
    clearInterval(engineTimer);
    engineTimer = setInterval(runEngineProcesses, currentInterval);
  }
  return getEngineStatus();
}
var DEFAULT_CHECK_INTERVAL, MIN_INTERVAL, MAX_INTERVAL, engineRunning, lastRunTimestamp, currentInterval, engineTimer;
var init_autonomous_engine = __esm({
  "server/services/autonomous-engine.ts"() {
    "use strict";
    init_storage();
    init_task_management();
    init_calendar_management();
    DEFAULT_CHECK_INTERVAL = 1e3 * 60 * 15;
    MIN_INTERVAL = 1e3 * 60 * 5;
    MAX_INTERVAL = 1e3 * 60 * 60 * 2;
    engineRunning = false;
    lastRunTimestamp = null;
    currentInterval = DEFAULT_CHECK_INTERVAL;
    engineTimer = null;
  }
});

// server/index.ts
import express7 from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/auth.ts
init_storage();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    if (!stored || !stored.includes(".")) {
      console.error("Password comparison error: Invalid stored password format");
      return false;
    }
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Password comparison error: Missing hash or salt");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`Password comparison result: ${result ? "matched" : "no match"} for supplied length: ${supplied.length}`);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}
function setupAuth(app2) {
  const isDev = process.env.NODE_ENV === "development" || (process.env.DISABLE_DOMAIN_OVERRIDE || "").toLowerCase() === "true";
  const isForceProduction = (process.env.FORCE_PRODUCTION_DOMAIN || "").toLowerCase() === "true" && (process.env.DISABLE_DOMAIN_OVERRIDE || "").toLowerCase() !== "true";
  const useCustomDomain = process.env.CUSTOM_DOMAIN && process.env.CUSTOM_DOMAIN.length > 0 || isForceProduction;
  console.log("\n===== SESSION CONFIGURATION =====");
  console.log("Environment Mode:", isDev ? "Development" : "Production");
  console.log("Force Production Domain:", isForceProduction ? "Yes" : "No");
  console.log("Custom Domain:", process.env.CUSTOM_DOMAIN || "Not set");
  console.log("Using Cross-Domain Settings:", useCustomDomain ? "Yes" : "No");
  console.log("================================\n");
  let cookieSettings = {
    maxAge: 1e3 * 60 * 60 * 24 * 7,
    // 1 week
    httpOnly: true
  };
  if (useCustomDomain) {
    console.log("\n===== CROSS-DOMAIN AUTHENTICATION MODE =====");
    console.log("Using cross-domain authentication configuration");
    console.log("Cookie sameSite policy: None (allows cross-domain)");
    console.log("Using secure cookies: Yes");
    console.log("============================================\n");
    cookieSettings = {
      ...cookieSettings,
      sameSite: "none",
      secure: true
    };
    const isProduction = false;
    if (isProduction && process.env.CUSTOM_DOMAIN && !process.env.DISABLE_DOMAIN_COOKIE) {
      cookieSettings.domain = `.${process.env.CUSTOM_DOMAIN}`;
      console.log("Production mode: Cookie domain set to:", cookieSettings.domain);
    } else {
      console.log("Development/Preview mode: Cookie domain not set (using origin-matching cookies)");
    }
  } else {
    console.log("\n===== STANDARD AUTHENTICATION MODE =====");
    console.log("Using standard authentication configuration");
    console.log("Cookie sameSite policy: Lax (default)");
    console.log("Using secure cookies:", isDev ? "No" : "Yes");
    console.log("========================================\n");
    cookieSettings = {
      ...cookieSettings,
      sameSite: "lax",
      secure: !isDev
    };
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "binate-ai-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: cookieSettings
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Trying to authenticate user:", username);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log("Authentication failed: User not found");
          return done(null, false);
        }
        console.log("User found, checking password. Hash starts with:", user.password.substring(0, 20));
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          console.log("Authentication failed: Password does not match");
          return done(null, false);
        } else {
          console.log("Password matched successfully");
          return done(null, user);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Login failed - user not found or password incorrect");
        return res.status(401).json({
          message: "Authentication failed. Username or password is incorrect."
        });
      }
      req.login(user, (err2) => {
        if (err2) {
          console.error("Session login error:", err2);
          return next(err2);
        }
        console.log("Login successful for user:", user.username);
        console.log("Session established with ID:", req.sessionID);
        if (req.session) {
          console.log("Session cookie settings:", {
            path: req.session.cookie.path,
            httpOnly: req.session.cookie.httpOnly,
            secure: req.session.cookie.secure,
            sameSite: req.session.cookie.sameSite,
            domain: req.session.cookie.domain
          });
        }
        return res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          preferences: user.preferences
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      preferences: user.preferences
      // Add any other non-sensitive fields
    });
  });
  app2.get("/api/auth/status", (req, res) => {
    console.log("Auth status check - isAuthenticated:", req.isAuthenticated());
    console.log("Auth status check - sessionID:", req.sessionID);
    console.log("Auth status check - session:", req.session ? "exists" : "null");
    if (req.user) {
      console.log("Auth status check - user:", req.user.username);
    } else {
      console.log("Auth status check - user: not logged in");
    }
    const sessionInfo = req.session ? {
      id: req.session.id,
      cookie: {
        originalMaxAge: req.session.cookie?.originalMaxAge,
        maxAge: req.session.cookie?.maxAge,
        secure: req.session.cookie?.secure,
        httpOnly: req.session.cookie?.httpOnly,
        domain: req.session.cookie?.domain,
        path: req.session.cookie?.path,
        sameSite: req.session.cookie?.sameSite
      }
    } : null;
    console.log("Auth status - Received cookies:", req.headers.cookie);
    res.json({
      authenticated: req.isAuthenticated(),
      session: sessionInfo,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username
        // Don't include sensitive info like password hash
      } : null,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        userAgent: req.headers["user-agent"],
        cookie: req.headers.cookie,
        requestTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  });
  app2.post("/api/auth/test-login", (req, res, next) => {
    console.log("TEST LOGIN attempt for username:", req.body.username);
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("TEST LOGIN authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.log("TEST LOGIN failed - user not found or password incorrect");
        return res.status(401).json({
          message: "Authentication failed. Username or password is incorrect."
        });
      }
      req.login(user, (err2) => {
        if (err2) {
          console.error("TEST LOGIN session login error:", err2);
          return next(err2);
        }
        console.log("TEST LOGIN successful for user:", user.username);
        console.log("TEST LOGIN - session established with ID:", req.sessionID);
        if (req.session) {
          console.log("TEST LOGIN - session cookie settings:", {
            path: req.session.cookie.path,
            httpOnly: req.session.cookie.httpOnly,
            secure: req.session.cookie.secure,
            sameSite: req.session.cookie.sameSite,
            domain: req.session.cookie.domain
          });
        }
        return res.status(200).json({
          user: {
            id: user.id,
            username: user.username
          },
          sessionId: req.sessionID,
          message: "Test login successful"
        });
      });
    })(req, res, next);
  });
  app2.post("/api/user/preferences", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const preferences = req.body;
      const updatedUser = await storage.updateUserPreferences(userId, preferences);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
}

// server/routes.ts
init_config();

// server/routes/slack-routes.ts
init_storage();
init_slack_service();
import { Router } from "express";
var router = Router();
router.get("/test-config", async (req, res) => {
  try {
    const SLACK_CLIENT_ID2 = process.env.SLACK_CLIENT_ID;
    const SLACK_CLIENT_SECRET2 = process.env.SLACK_CLIENT_SECRET;
    const SLACK_SIGNING_SECRET2 = process.env.SLACK_SIGNING_SECRET;
    const SLACK_BOT_TOKEN3 = process.env.SLACK_BOT_TOKEN;
    const SLACK_DEFAULT_CHANNEL3 = process.env.SLACK_CHANNEL_ID;
    if (SLACK_CLIENT_ID2 && SLACK_CLIENT_SECRET2 && SLACK_SIGNING_SECRET2) {
      res.status(200).json({
        message: "Slack configuration present",
        configured: true,
        systemBotToken: !!SLACK_BOT_TOKEN3,
        defaultChannel: !!SLACK_DEFAULT_CHANNEL3
      });
    } else {
      const missingConfigs = [];
      if (!SLACK_CLIENT_ID2) missingConfigs.push("SLACK_CLIENT_ID");
      if (!SLACK_CLIENT_SECRET2) missingConfigs.push("SLACK_CLIENT_SECRET");
      if (!SLACK_SIGNING_SECRET2) missingConfigs.push("SLACK_SIGNING_SECRET");
      res.status(200).json({
        message: "Slack configuration incomplete",
        configured: false,
        missingConfigs,
        systemBotToken: !!SLACK_BOT_TOKEN3,
        defaultChannel: !!SLACK_DEFAULT_CHANNEL3
      });
    }
  } catch (error) {
    let errorMessage = "Unknown error checking Slack configuration";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error checking Slack configuration:", errorMessage);
    res.status(500).json({
      error: "Failed to check Slack configuration",
      errorCode: "configuration_check_failed",
      details: errorMessage
    });
  }
});
router.get("/authorize", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const authUrl = generateSlackOAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error generating Slack OAuth URL:", errorMessage);
    res.status(500).json({
      error: "Failed to generate Slack authorization URL",
      errorCode: "oauth_url_generation_failed",
      details: errorMessage
    });
  }
});
router.get("/callback", async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect("/app/settings?slack_error=" + encodeURIComponent(error));
    }
    if (!code) {
      return res.redirect("/app/settings?slack_error=missing_code");
    }
    if (!req.isAuthenticated()) {
      return res.redirect("/app/auth?slack_error=session_expired");
    }
    const userId = req.user.id;
    const tokenData = await exchangeCodeForToken(code);
    await saveSlackIntegration(userId, tokenData);
    res.redirect("/app/settings?slack_connected=true");
  } catch (error) {
    let errorMessage = "Unknown error";
    let errorCode = "unknown_error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    if (errorMessage.includes("invalid_code")) {
      errorCode = "invalid_code";
    } else if (errorMessage.includes("invalid_client")) {
      errorCode = "invalid_client";
    } else if (errorMessage.includes("access_denied")) {
      errorCode = "access_denied";
    }
    console.error("Error handling Slack OAuth callback:", {
      userId: req.user?.id,
      errorCode,
      errorDetails: errorMessage
    });
    res.redirect(`/app/settings?slack_error=${encodeURIComponent(errorCode)}&slack_error_details=${encodeURIComponent(errorMessage.substring(0, 100))}`);
  }
});
router.get("/status", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const integration = await getSlackIntegration(userId);
    res.json({
      connected: !!integration,
      integration
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error getting Slack integration status:", {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    res.status(500).json({
      error: "Failed to get Slack integration status",
      errorCode: "integration_status_error",
      details: errorMessage
    });
  }
});
router.post("/disconnect", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const result = await disconnectSlackIntegration(userId);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({
        error: "Failed to disconnect Slack integration",
        details: result.errorMessage,
        errorCode: result.errorCode
      });
    }
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error disconnecting Slack integration:", {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    res.status(500).json({
      error: "Failed to disconnect Slack integration",
      errorCode: "disconnect_integration_error",
      details: errorMessage
    });
  }
});
router.post("/sync-channels", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    await syncSlackChannels(userId);
    const integration = await getSlackIntegration(userId);
    res.json({ success: true, channels: integration.availableChannels });
  } catch (error) {
    let errorMessage = "Unknown error";
    let errorCode = "channel_sync_error";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes("token_revoked")) {
        errorCode = "token_revoked";
      } else if (errorMessage.includes("invalid_auth")) {
        errorCode = "invalid_auth";
      } else if (errorMessage.includes("account_inactive")) {
        errorCode = "account_inactive";
      }
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error syncing Slack channels:", {
      userId: req.user?.id,
      errorCode,
      errorDetails: errorMessage
    });
    res.status(500).json({
      error: "Failed to sync Slack channels",
      errorCode,
      details: errorMessage
    });
  }
});
router.post("/preferences", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const preferences = req.body;
    await storage.updateUserPreferences(userId, {
      slackNotifications: preferences
    });
    res.json({ success: true });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error updating Slack preferences:", {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    res.status(500).json({
      error: "Failed to update Slack preferences",
      errorCode: "update_preferences_error",
      details: errorMessage
    });
  }
});
router.post("/test-message", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const { channel, notificationType } = req.body;
    const integration = await getSlackIntegration(userId);
    const useFallback = !integration || !integration.connected;
    const message = useFallback ? "\u{1F44B} This is a test message from Binate AI. Using system-level Slack integration as fallback!" : "\u{1F44B} This is a test message from Binate AI. Your Slack integration is working correctly!";
    let notificationTypeEnum = void 0;
    if (notificationType && Object.keys(NotificationType).includes(notificationType)) {
      notificationTypeEnum = NotificationType[notificationType];
    }
    const testChannel = channel || process.env.SLACK_CHANNEL_ID;
    if (!testChannel) {
      return res.status(500).json({
        error: "Failed to send test message",
        details: "No Slack channel specified and no default system channel configured"
      });
    }
    console.log(`Attempting to send Slack test message to channel: ${testChannel}`);
    const result = await sendSlackMessage(
      userId,
      message,
      testChannel,
      notificationTypeEnum
    );
    if (result.success) {
      res.json({
        success: true,
        usedFallback: useFallback,
        message: useFallback ? "Message sent using system fallback" : "Message sent using your Slack integration"
      });
    } else {
      res.status(500).json({
        error: "Failed to send test message",
        details: result.errorMessage || "No Slack integration is available. Please connect Slack or ensure system fallback is configured.",
        errorCode: result.errorCode || "unknown_error",
        debugDetails: result.debugDetails || "No additional debug information available"
      });
    }
  } catch (error) {
    console.error("Error sending test message:", error);
    let errorDetails = "Unknown error";
    let errorCode = "unknown_error";
    let debugDetails = "No detailed error available";
    if (error instanceof Error) {
      debugDetails = error.message;
    } else if (error !== null && error !== void 0) {
      debugDetails = String(error);
    }
    const slackError = error;
    if (slackError?.data?.error === "not_in_channel") {
      errorDetails = "The Slack bot needs to be invited to the channel. Please add the bot to your channel with /invite @BinateAI.";
      errorCode = "not_in_channel";
    } else if (slackError?.data?.error === "channel_not_found") {
      errorDetails = "The specified Slack channel could not be found. Please check the channel ID.";
      errorCode = "channel_not_found";
    } else if (slackError?.data?.error === "invalid_auth") {
      errorDetails = "Invalid Slack authentication. Please reconnect your Slack account.";
      errorCode = "invalid_auth";
    } else if (slackError?.data?.error === "token_revoked") {
      errorDetails = "Slack access has been revoked. Please reconnect your Slack account.";
      errorCode = "token_revoked";
    } else if (error instanceof Error) {
      errorDetails = error.message;
    }
    res.status(500).json({
      error: "Failed to send test message",
      details: errorDetails,
      errorCode,
      debugDetails
    });
  }
});
router.get("/default-channel", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const defaultChannel = await storage.getDefaultSlackChannel(userId);
    res.json({
      defaultChannel: defaultChannel || null
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error getting default Slack channel:", {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    res.status(500).json({
      error: "Failed to get default Slack channel",
      errorCode: "default_channel_fetch_error",
      details: errorMessage
    });
  }
});
router.post("/default-channel", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = req.user.id;
    const { channelId } = req.body;
    if (!channelId) {
      return res.status(400).json({
        error: "Missing required field",
        details: "Channel ID is required"
      });
    }
    const success = await storage.setDefaultSlackChannel(userId, channelId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({
        error: "Failed to set default Slack channel",
        details: "Database operation failed"
      });
    }
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== void 0) {
      errorMessage = String(error);
    }
    console.error("Error setting default Slack channel:", {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    res.status(500).json({
      error: "Failed to set default Slack channel",
      errorCode: "default_channel_update_error",
      details: errorMessage
    });
  }
});
var slack_routes_default = router;

// server/routes/notifications.ts
init_storage();
init_notification_scheduler();
import express from "express";
var router2 = express.Router();
router2.post("/test/digest", async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const result = await manualTriggers.triggerDigestForUser(userId);
    if (result) {
      res.json({ success: true, message: "Digest notification sent successfully" });
    } else {
      res.status(400).json({ success: false, message: "Failed to send digest notification" });
    }
  } catch (error) {
    console.error("Error testing digest notification:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the notification",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router2.post("/test/task/:taskId", async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const taskId = parseInt(req.params.taskId, 10);
    const clientId = req.body.clientId ? parseInt(req.body.clientId, 10) : null;
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }
    const task = await storage.getTask(taskId);
    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    const result = await manualTriggers.triggerUrgentTaskNotification(userId, clientId, taskId);
    if (result) {
      res.json({ success: true, message: "Task notification sent successfully" });
    } else {
      res.status(400).json({ success: false, message: "Failed to send task notification" });
    }
  } catch (error) {
    console.error("Error testing task notification:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the notification",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router2.get("/settings", async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const userSettings2 = await storage.getUserSettings(userId);
    let slackIntegrations2 = [];
    try {
      slackIntegrations2 = await storage.getAllSlackIntegrations(userId);
    } catch (error) {
      console.error("Error fetching Slack integrations:", error);
    }
    res.json({
      success: true,
      settings: {
        preferredChannels: {
          slack: slackIntegrations2.length > 0,
          email: userSettings2?.emailNotificationsEnabled || false
        },
        digests: {
          enabled: true,
          times: [
            { hour: 7, minute: 0, label: "7:00 AM" },
            { hour: 12, minute: 0, label: "12:00 PM" },
            { hour: 17, minute: 0, label: "5:00 PM" }
          ]
        },
        realTimeNotifications: {
          urgentTasks: true,
          imminentMeetings: true,
          highPriorityLeads: true
        },
        slackIntegrations: slackIntegrations2.map((integration) => ({
          id: integration.id,
          clientId: integration.clientId,
          clientName: integration.clientName || "Default",
          teamName: integration.teamName,
          isDefault: integration.isDefault
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching notification settings",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
var notifications_default = router2;

// server/routes/slack-test-routes.ts
init_storage();
import { Router as Router2 } from "express";

// server/services/slack/controller.ts
init_slack_service();
async function sendTaskNotification(userId, clientId, task, notificationType = "task_reminder" /* TASK_REMINDER */) {
  return { success: true };
}

// server/services/slack/multi-tenant.ts
init_storage();
import { WebClient as WebClient2 } from "@slack/web-api";
var SLACK_BOT_TOKEN2 = process.env.SLACK_BOT_TOKEN;
var SLACK_DEFAULT_CHANNEL2 = process.env.SLACK_CHANNEL_ID;
var systemWebClient2 = SLACK_BOT_TOKEN2 ? new WebClient2(SLACK_BOT_TOKEN2) : null;
async function getAllClientIntegrations(userId) {
  try {
    const integrations = await storage.getAllSlackIntegrations(userId);
    return integrations.map((integration) => ({
      id: integration.id,
      userId: integration.userId,
      clientId: integration.clientId || 0,
      // Default to 0 if not set
      clientName: integration.clientName || "Default",
      teamId: integration.teamId,
      teamName: integration.teamName || "Unknown Team",
      accessToken: integration.accessToken,
      channels: integration.availableChannels || [],
      isDefault: integration.isDefault || false
    }));
  } catch (error) {
    console.error("Error getting client integrations:", error);
    return [];
  }
}
async function getClientIntegration(userId, clientId) {
  try {
    const integrations = await getAllClientIntegrations(userId);
    return integrations.find((integration) => integration.clientId === clientId) || null;
  } catch (error) {
    console.error("Error getting client integration:", error);
    return null;
  }
}
async function getDefaultIntegration(userId) {
  try {
    const integrations = await getAllClientIntegrations(userId);
    const defaultIntegration = integrations.find((integration) => integration.isDefault);
    if (defaultIntegration) return defaultIntegration;
    return integrations.length > 0 ? integrations[0] : null;
  } catch (error) {
    console.error("Error getting default integration:", error);
    return null;
  }
}
async function sendClientNotification(userId, clientId, message, channelId, options) {
  try {
    let client = null;
    let targetChannelId = channelId || null;
    if (clientId) {
      const clientConfig = await getClientIntegration(userId, clientId);
      if (clientConfig && clientConfig.accessToken) {
        client = new WebClient2(clientConfig.accessToken);
        if (!targetChannelId && clientConfig.channels && clientConfig.channels.length > 0) {
          targetChannelId = clientConfig.channels[0].id;
        }
      }
    } else {
      const defaultConfig = await getDefaultIntegration(userId);
      if (defaultConfig && defaultConfig.accessToken) {
        client = new WebClient2(defaultConfig.accessToken);
        if (!targetChannelId && defaultConfig.channels && defaultConfig.channels.length > 0) {
          targetChannelId = defaultConfig.channels[0].id;
        }
      }
    }
    if (!client && systemWebClient2) {
      client = systemWebClient2;
      if (!targetChannelId) {
        targetChannelId = SLACK_DEFAULT_CHANNEL2 || null;
      }
    }
    if (!client) {
      return {
        success: false,
        error: "No Slack integration available"
      };
    }
    if (!targetChannelId) {
      return {
        success: false,
        error: "No Slack channel available to send notification"
      };
    }
    const messageParams = {
      channel: targetChannelId,
      text: message
    };
    if (options) {
      if (options.blocks) messageParams.blocks = options.blocks;
      if (options.attachments) messageParams.attachments = options.attachments;
      if (options.thread_ts) messageParams.thread_ts = options.thread_ts;
      if (options.mrkdwn !== void 0) messageParams.mrkdwn = options.mrkdwn;
    }
    const result = await client.chat.postMessage(messageParams);
    return { success: !!result.ok };
  } catch (error) {
    console.error("Error sending client notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// server/routes/slack-test-routes.ts
var router3 = Router2();
router3.get("/status", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = req.session.userId;
    const isPreviewEnv = req.headers.host?.includes(".replit.dev") || req.headers.host?.includes(".repl.co");
    if (isPreviewEnv) {
      console.log("Preview environment detected, providing sample Slack integration data");
      return res.json({
        success: true,
        integrations: [
          {
            id: 1,
            clientId: 101,
            clientName: "Demo Client 1",
            teamName: "Demo Workspace 1",
            isDefault: true,
            channelCount: 3
          },
          {
            id: 2,
            clientId: 102,
            clientName: "Demo Client 2",
            teamName: "Demo Workspace 2",
            isDefault: false,
            channelCount: 2
          }
        ],
        hasSystemIntegration: true
      });
    }
    const integrations = await getAllClientIntegrations(userId);
    const hasSystemIntegration = process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID;
    return res.json({
      success: true,
      integrations: integrations.map((int) => ({
        id: int.id,
        clientId: int.clientId,
        clientName: int.clientName,
        teamName: int.teamName,
        isDefault: int.isDefault,
        channelCount: int.channels?.length || 0
      })),
      hasSystemIntegration
    });
  } catch (error) {
    console.error("Error checking Slack status:", error);
    return res.status(500).json({ success: false, error: "Failed to check Slack status" });
  }
});
router3.post("/send-client-message", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = req.session.userId;
    const { clientId, message } = req.body;
    const isPreviewEnv = req.headers.host?.includes(".replit.dev") || req.headers.host?.includes(".repl.co");
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }
    if (isPreviewEnv) {
      console.log("Preview environment detected, simulating successful message send");
      console.log(`Would send message "${message}" to client ID: ${clientId || "system default"}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return res.json({
        success: true,
        message: "Test message sent successfully (Preview Environment)",
        details: {
          success: true,
          clientId: clientId || "system",
          messageContent: message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    const testTask = {
      id: Date.now(),
      // Use timestamp as a fake ID
      title: "Test Task",
      description: message || "This is a test notification",
      dueDate: new Date(Date.now() + 60 * 60 * 1e3),
      // Due in 1 hour
      priority: "high",
      flagged: true
    };
    const result = await sendTaskNotification(
      userId,
      clientId ? parseInt(clientId) : null,
      testTask
    );
    return res.json({
      success: result.success,
      message: result.success ? "Test message sent successfully" : `Failed to send test message: ${result.error}`,
      details: result
    });
  } catch (error) {
    console.error("Error sending test message:", error);
    return res.status(500).json({ success: false, error: "Failed to send test message" });
  }
});
router3.post("/set-default-integration", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = req.session.userId;
    const { integrationId } = req.body;
    if (!integrationId) {
      return res.status(400).json({ success: false, error: "Integration ID is required" });
    }
    const integrations = await getAllClientIntegrations(userId);
    const targetIntegration = integrations.find((int) => int.id === parseInt(integrationId));
    if (!targetIntegration) {
      return res.status(404).json({ success: false, error: "Integration not found" });
    }
    for (const integration of integrations) {
      await storage.updateSlackIntegration(integration.id, { isDefault: false });
    }
    await storage.updateSlackIntegration(targetIntegration.id, { isDefault: true });
    return res.json({
      success: true,
      message: `Integration for ${targetIntegration.clientName || "default client"} set as default`
    });
  } catch (error) {
    console.error("Error setting default integration:", error);
    return res.status(500).json({ success: false, error: "Failed to set default integration" });
  }
});
router3.post("/send-digest", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = req.session.userId;
    const { clientId } = req.body;
    const isPreviewEnv = req.headers.host?.includes(".replit.dev") || req.headers.host?.includes(".repl.co");
    if (isPreviewEnv) {
      console.log("Preview environment detected, simulating successful digest send");
      console.log(`Would send digest to client ID: ${clientId || "system default"}`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res.json({
        success: true,
        message: "Test digest sent successfully (Preview Environment)",
        details: {
          success: true,
          clientId: clientId || "system",
          digestContent: {
            tasks: 5,
            meetings: 3,
            leads: 2,
            date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    try {
      const tasks2 = await storage.getTasks(userId) || [];
      const events2 = await storage.getEvents(userId) || [];
      const leads2 = await storage.getLeads(userId) || [];
      const now = /* @__PURE__ */ new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Daily Digest: ${formattedDate}*`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `This is a test digest notification ${clientId ? "for a specific client" : ""}.`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Tasks:* ${tasks2.length} total`
            },
            {
              type: "mrkdwn",
              text: `*Meetings:* ${events2.length} scheduled`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View All Tasks",
                emoji: true
              },
              style: "primary",
              value: "view_tasks"
            }
          ]
        }
      ];
      const result = await sendClientNotification(
        userId,
        clientId ? parseInt(clientId) : null,
        "Daily Digest",
        // Fallback text
        void 0,
        // Use default channel
        { blocks }
      );
      return res.json({
        success: result.success,
        message: result.success ? "Test digest sent successfully" : `Failed to send test digest: ${result.error}`,
        details: result
      });
    } catch (storageError) {
      console.error("Error getting data for digest:", storageError);
      return res.status(500).json({
        success: false,
        error: "Failed to get data for digest"
      });
    }
  } catch (error) {
    console.error("Error sending test digest:", error);
    return res.status(500).json({ success: false, error: "Failed to send test digest" });
  }
});
var slack_test_routes_default = router3;

// server/routes/clients.ts
init_storage();
import { Router as Router3 } from "express";
var router4 = Router3();
router4.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = req.session.userId;
    const clients = await storage.getClientsByUserId(userId);
    const slackIntegrations2 = await storage.getSlackIntegrationsByUserId(userId);
    const clientsWithIntegrations = clients.map((client) => {
      const hasIntegration = slackIntegrations2.some(
        (integration) => integration.clientId === client.id
      );
      return {
        id: client.id,
        name: client.name || `Client ${client.id}`,
        hasSlackIntegration: hasIntegration
      };
    });
    return res.json(clientsWithIntegrations);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch clients" });
  }
});
router4.get("/:id", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = req.session.userId;
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, error: "Invalid client ID" });
    }
    const client = await storage.getClientById(clientId);
    if (!client || client.userId !== userId) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }
    const slackIntegration = await storage.getSlackIntegrationByClientId(clientId);
    return res.json({
      id: client.id,
      name: client.name || `Client ${client.id}`,
      hasSlackIntegration: !!slackIntegration
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch client" });
  }
});
var clients_default = router4;

// server/routes/microsoft-routes.ts
init_outlook_service();
init_config();
init_storage();
import express2 from "express";
console.log("Microsoft routes loaded successfully");
var router5 = express2.Router();
router5.get("/auth-url", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    console.log("Microsoft OAuth Environment Details:");
    console.log(`- Base URL: ${config_default.baseUrl}`);
    console.log(`- User ID: ${userId}`);
    console.log(`- Microsoft Client ID exists: ${!!process.env.MICROSOFT_CLIENT_ID}`);
    console.log(`- Microsoft Client Secret exists: ${!!process.env.MICROSOFT_CLIENT_SECRET}`);
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      console.error("Microsoft OAuth credentials missing");
      return res.status(500).json({
        error: "Microsoft API credentials are not configured properly on the server"
      });
    }
    const redirectUri = `${config_default.baseUrl}/api/auth/microsoft/callback`;
    console.log(`Redirect URI for Microsoft OAuth: ${redirectUri}`);
    try {
      const authUrl = await generateMicrosoftAuthUrl(userId, redirectUri);
      console.log(`Successfully generated Microsoft auth URL: ${authUrl}`);
      return res.json({ url: authUrl, authUrl });
    } catch (msalError) {
      console.error("MSAL Error generating auth URL:", msalError);
      return res.status(500).json({
        error: "Failed to generate Microsoft authentication URL",
        details: msalError.message || "Unknown MSAL error"
      });
    }
  } catch (error) {
    console.error("Error in Microsoft auth URL route:", error);
    res.status(500).json({
      error: "Failed to generate Microsoft auth URL",
      details: error.message || "Unknown server error"
    });
  }
});
router5.get("/callback", async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    console.log(`Microsoft OAuth callback received with state: ${state}`);
    console.log(`Code present: ${!!code}, Error present: ${!!error}`);
    if (error) {
      console.error(`Microsoft OAuth error: ${error}, Description: ${error_description}`);
      return res.redirect("/app/settings/email?error=microsoft_auth_failed&reason=" + encodeURIComponent(String(error_description || error)));
    }
    console.log("Microsoft OAuth callback received:", {
      code: code ? "[REDACTED]" : void 0,
      state,
      error,
      error_description
    });
    if (error) {
      console.error(`Microsoft OAuth error: ${error}: ${error_description}`);
      return res.redirect(`/app/settings/email?error=${encodeURIComponent(error_description || "Authentication failed")}`);
    }
    if (!code || !state) {
      return res.redirect("/app/settings/email?error=Missing%20required%20parameters");
    }
    const userId = parseInt(state, 10);
    if (isNaN(userId)) {
      return res.redirect("/app/settings/email?error=Invalid%20state%20parameter");
    }
    const redirectUri = `${config_default.baseUrl}/api/auth/microsoft/callback`;
    console.log("Using redirect URI:", redirectUri);
    const tokenData = await exchangeCodeForToken2(code, redirectUri);
    console.log("Successfully obtained Microsoft token data");
    await storeOutlookCredentials(userId, tokenData);
    console.log("Microsoft credentials stored for user:", userId);
    try {
      const { syncRecentEmails: syncRecentEmails2 } = await Promise.resolve().then(() => (init_outlook_service(), outlook_service_exports));
      console.log("Starting initial Microsoft email sync after connection...");
      syncRecentEmails2(userId, 50).then((result) => {
        console.log(`Initial Microsoft email sync completed with ${result.count} emails imported`);
      }).catch((syncError) => {
        console.error("Error during initial Microsoft email sync:", syncError);
      });
    } catch (syncInitError) {
      console.error("Failed to start initial Microsoft email sync:", syncInitError);
    }
    try {
      const userProfile = await getUserProfile(userId);
      console.log(`Successfully verified Microsoft connection for ${userProfile.email || "user"}`);
      const userEmail = encodeURIComponent(userProfile.email || "");
      res.redirect(`/app/settings/email?microsoft=connected&email=${userEmail}`);
    } catch (profileError) {
      console.error("Error getting Microsoft user profile:", profileError);
      res.redirect("/app/settings/email?microsoft=connected");
    }
  } catch (error) {
    console.error("Error in Microsoft OAuth callback:", error);
    const errorMessage = error.message || "Failed to authenticate with Microsoft";
    res.redirect(`/app/settings/email?error=${encodeURIComponent(errorMessage)}`);
  }
});
router5.get("/connected", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    console.log(`Checking Microsoft connection status for user ${userId}`);
    const integration = await storage.getEmailIntegration(userId, "microsoft");
    let connectionError = null;
    let connectionDetails = null;
    if (integration && integration.credentials) {
      try {
        const credentials = JSON.parse(integration.credentials);
        connectionDetails = {
          email: credentials.email || "",
          lastRefreshed: credentials.last_refreshed || null,
          expiresAt: credentials.expires_at ? new Date(credentials.expires_at).toISOString() : null
        };
        if (credentials.connection_error) {
          connectionError = credentials.error_message || "Connection requires attention";
          console.log(`Microsoft connection for user ${userId} has error flag: ${connectionError}`);
        }
      } catch (parseError) {
        console.error(`Error parsing Microsoft credentials for user ${userId}:`, parseError);
      }
    }
    const connected = await isOutlookConnected(userId);
    if (connected && integration) {
      try {
        const lastSyncedAt = integration.last_synced_at || null;
        const now = /* @__PURE__ */ new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1e3);
        if (!lastSyncedAt || new Date(lastSyncedAt) < fifteenMinutesAgo) {
          console.log(`Triggering Microsoft email sync for user ${userId} - last sync was ${lastSyncedAt || "never"}`);
          syncRecentEmails(userId).catch((err) => {
            console.error(`Error during auto-sync for Microsoft (user ${userId}):`, err);
          });
          await storage.updateEmailIntegrationLastSynced(userId, "microsoft");
        }
      } catch (syncError) {
        console.error(`Error checking sync status for Microsoft (user ${userId}):`, syncError);
      }
      try {
        const lastSyncTime = integration.lastSynced ? new Date(integration.lastSynced) : null;
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1e3);
        if (!lastSyncTime || lastSyncTime < fifteenMinutesAgo) {
          console.log(`Triggering Microsoft email sync for user ${userId} (last sync was over 15 minutes ago or never)`);
          syncRecentEmails(userId, 20).then((result) => {
            if (result.success) {
              console.log(`Auto-synced ${result.count} Microsoft emails during connection check for user ${userId}`);
              storage.updateEmailIntegrationLastSynced(userId, "microsoft").catch((err) => {
                console.error(`Failed to update last synced time for user ${userId}:`, err);
              });
            }
          }).catch((err) => {
            console.error(`Error syncing emails during connection check for user ${userId}:`, err);
          });
        } else {
          console.log(`Skipping auto-sync for user ${userId}, last sync was less than 15 minutes ago`);
        }
      } catch (syncCheckError) {
        console.error(`Error checking sync state for user ${userId}:`, syncCheckError);
      }
    }
    res.json({
      connected,
      error: connectionError,
      details: connectionDetails,
      provider: "microsoft",
      lastChecked: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error checking Microsoft connection:", error);
    res.status(500).json({
      error: "Failed to check Microsoft connection",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router5.get("/profile", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: "Microsoft profile not found" });
    }
    res.json({ profile });
  } catch (error) {
    console.error("Error getting Microsoft profile:", error);
    res.status(500).json({ error: "Failed to get Microsoft profile" });
  }
});
router5.post("/disconnect", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const success = await disconnectOutlook(userId);
    if (!success) {
      return res.status(500).json({ error: "Failed to disconnect from Microsoft" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting from Microsoft:", error);
    res.status(500).json({ error: "Failed to disconnect from Microsoft" });
  }
});
router5.post("/sync-emails", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const connected = await isOutlookConnected(userId);
    if (!connected) {
      return res.status(400).json({
        success: false,
        error: "Microsoft account not connected",
        count: 0
      });
    }
    const { maxResults = 100 } = req.body || {};
    console.log(`Syncing Microsoft emails for user ${userId}, max results: ${maxResults}`);
    const result = await syncRecentEmails(userId, maxResults);
    res.json(result);
  } catch (error) {
    console.error("Error syncing Microsoft emails:", error);
    res.status(500).json({
      success: false,
      error: `Failed to sync Microsoft emails: ${error.message || "Unknown error"}`,
      count: 0
    });
  }
});
var microsoft_routes_default = router5;

// server/preview-auth.ts
var DEMO_USER = {
  id: 999,
  email: "demo@preview.test",
  fullName: "Preview Test User",
  avatar: "",
  role: "admin",
  createdAt: /* @__PURE__ */ new Date(),
  updatedAt: /* @__PURE__ */ new Date(),
  settings: {
    theme: "light",
    emailNotifications: true,
    aiResponseStyle: "friendly"
  },
  google: {
    connected: true,
    username: "demo@gmail.com",
    displayName: "Demo Google User"
  },
  stripe: {
    connected: false
  },
  slack: {
    connected: true,
    username: "demo-slack-workspace",
    displayName: "Demo Slack",
    channel: "general"
  }
};
function isReplitPreview(req) {
  const host = req.headers.host || "";
  return host.includes(".replit.dev") || host.includes(".repl.co");
}
function previewAuthMiddleware(req, res, next) {
  if (!isReplitPreview(req)) {
    return next();
  }
  if (req.path.startsWith("/api/")) {
    if (req.path === "/api/auth/login" || req.path === "/api/auth/register" || req.path.startsWith("/api/auth/google")) {
      return next();
    }
    req.user = DEMO_USER;
    if (req.session) {
      req.session.userId = DEMO_USER.id;
    }
    if (req.path.startsWith("/api/slack-test/")) {
      console.log("Preview environment: Using mock data for Slack test route:", req.path);
    }
  }
  next();
}
function handlePreviewLogin(req, res) {
  if (!isReplitPreview(req)) {
    return res.status(404).json({ error: "Not available in production" });
  }
  req.session.userId = DEMO_USER.id;
  return res.json({
    success: true,
    user: DEMO_USER
  });
}

// server/routes.ts
init_schema();
import { ZodError } from "zod";

// server/services/google-auth.ts
init_storage();
init_config();
import { google as google2 } from "googleapis";
var LOG_PREFIX = "[OAUTH]";
console.log(`Google OAuth is using redirect URI: ${config_default.google.callbackUrl}`);
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("CRITICAL ERROR: GOOGLE_CLIENT_ID is not set in environment");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("CRITICAL ERROR: GOOGLE_CLIENT_SECRET is not set in environment");
}
var oauth2Client = new google2.auth.OAuth2(
  config_default.google.clientId,
  config_default.google.clientSecret,
  config_default.google.callbackUrl
);
if (process.env.GOOGLE_CLIENT_ID) {
  const visiblePart = process.env.GOOGLE_CLIENT_ID.substring(0, 8);
  const maskedPart = "..." + process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 4);
  console.log(`Using Google Client ID: ${visiblePart}${maskedPart}`);
}
var SCOPES2 = [
  // Gmail API scopes
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  // Calendar API scopes
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  // User profile scope - needed for basic profile information
  "profile",
  "email",
  // Add openid for standard authentication
  "openid"
];
function getGoogleAuthUrl() {
  const dynamicCallbackUrl = process.env.TEMP_CALLBACK_URL;
  let callbackUrl;
  if (dynamicCallbackUrl) {
    callbackUrl = dynamicCallbackUrl;
    console.log(`[OAuth Debug] Using DYNAMIC callback URL from environment: ${callbackUrl}`);
  } else {
    callbackUrl = config_default.google.callbackUrl;
    console.log(`[OAuth Debug] Using FIXED callback URL from config: ${callbackUrl}`);
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    console.error("CRITICAL: Missing Google OAuth credentials");
    console.error("GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID);
    console.error("GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
    throw new Error("Google OAuth credentials not configured");
  }
  console.log(`[OAuth Debug] getGoogleAuthUrl using callback URL: ${callbackUrl}`);
  console.log(`[OAuth Debug] Using client ID (starts with): ${clientId.substring(0, 6)}...`);
  const oauth2Client2 = new google2.auth.OAuth2(
    clientId,
    clientSecret,
    callbackUrl
  );
  const url = oauth2Client2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES2,
    prompt: "consent",
    // Force showing the consent screen to get refresh token every time
    include_granted_scopes: true
  });
  console.log("[OAuth Debug] Generated auth URL (partial):", url.substring(0, 100) + "...");
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  const urlRedirectUri = params.get("redirect_uri");
  const urlClientId = params.get("client_id");
  console.log("[OAuth Debug] URL contains client_id:", urlClientId?.substring(0, 6) + "...");
  console.log("[OAuth Debug] Expected client_id:", clientId.substring(0, 6) + "...");
  if (urlClientId !== clientId) {
    console.warn("WARNING: Client ID mismatch in auth URL");
    console.warn(`Expected: ${clientId.substring(0, 10)}...`);
    console.warn(`Got: ${urlClientId?.substring(0, 10)}...`);
  }
  if (urlRedirectUri !== callbackUrl) {
    console.warn("WARNING: Redirect URI mismatch in auth URL");
    console.warn(`Expected: ${callbackUrl}`);
    console.warn(`Got: ${urlRedirectUri}`);
  } else {
    console.log("[OAuth Debug] Redirect URI verification passed");
  }
  return url;
}
async function getTokensFromCode(code) {
  try {
    console.log(`${LOG_PREFIX} Attempting to exchange auth code for tokens. Code length: ${code.length}`);
    console.log(`${LOG_PREFIX} Code starts with: ${code.substring(0, 5)}...`);
    const callbackUrl = config_default.google.callbackUrl;
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    if (!clientId || !clientSecret) {
      console.error(`${LOG_PREFIX} CRITICAL: Missing Google OAuth credentials`);
      console.error(`${LOG_PREFIX} GOOGLE_CLIENT_ID present:`, !!process.env.GOOGLE_CLIENT_ID);
      console.error(`${LOG_PREFIX} GOOGLE_CLIENT_SECRET present:`, !!process.env.GOOGLE_CLIENT_SECRET);
      throw new Error("Google OAuth credentials not configured");
    }
    console.log(`${LOG_PREFIX} Token exchange using callback URL: ${callbackUrl}`);
    console.log(`${LOG_PREFIX} Using client ID (starts with): ${clientId.substring(0, 6)}...`);
    const tokenExchangeClient = new google2.auth.OAuth2(
      clientId,
      clientSecret,
      callbackUrl
      // Use the fixed callback URL
    );
    console.log(`${LOG_PREFIX} Token exchange parameters:`, {
      code_length: code.length,
      code_prefix: code.substring(0, 5) + "...",
      redirect_uri: callbackUrl,
      client_id_prefix: clientId.substring(0, 6) + "..."
    });
    let exchangedTokens;
    try {
      console.log(`${LOG_PREFIX} Calling getToken with redirect_uri: ${callbackUrl}`);
      const { tokens } = await tokenExchangeClient.getToken({
        code,
        redirect_uri: callbackUrl
        // Critical: Must match what was used to get the auth code
      });
      exchangedTokens = tokens;
      console.log(`${LOG_PREFIX} Token exchange SUCCESS:`, {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        has_expiry: !!tokens.expiry_date,
        token_type: tokens.token_type || "none"
      });
      if (!tokens.access_token) {
        throw new Error("No access token returned from Google");
      }
      if (tokens.access_token) {
        const accessTokenStart = tokens.access_token.substring(0, 5);
        const accessTokenEnd = tokens.access_token.substring(tokens.access_token.length - 3);
        console.log(`${LOG_PREFIX} Access token received: ${accessTokenStart}...${accessTokenEnd}`);
      }
      if (tokens.refresh_token) {
        console.log(`${LOG_PREFIX} Refresh token received successfully`);
      } else {
        console.log(`${LOG_PREFIX} WARNING: No refresh token received. The user may have previously authorized this app.`);
      }
    } catch (tokenError) {
      console.error(`${LOG_PREFIX} Token exchange error:`, tokenError);
      if (tokenError.message?.includes("invalid_grant")) {
        console.error(`${LOG_PREFIX} Invalid grant error - code may be expired or used`);
        throw new Error(`Invalid authorization code. The code may have expired or been used already.`);
      }
      if (tokenError.message?.includes("redirect_uri_mismatch")) {
        console.error(`${LOG_PREFIX} Redirect URI mismatch during token exchange`);
        console.error(`${LOG_PREFIX} Callback URL used:`, callbackUrl);
        console.error(`${LOG_PREFIX} Registered redirect URIs in Google Console should include:`);
        console.error(`${LOG_PREFIX} 1. https://workspace.binateai25.repl.co/api/auth/google/callback`);
        console.error(`${LOG_PREFIX} 2. https://binateai.com/api/auth/google/callback`);
        console.error(`${LOG_PREFIX} 3. https://www.binateai.com/api/auth/google/callback`);
        console.error(`${LOG_PREFIX} 4. https://binateai.replit.app/api/auth/google/callback`);
        throw new Error(`Redirect URI mismatch. The redirect URI used for token exchange doesn't match what was used to get the code.`);
      }
      if (tokenError.message?.includes("deleted_client") || tokenError.message?.includes("401")) {
        console.error(`${LOG_PREFIX} Client ID error - the OAuth client may have been deleted or is invalid`);
        throw new Error(`Google OAuth client error: The client ID appears to be invalid or deleted. Please check your Google Cloud Console configuration.`);
      }
      throw tokenError;
    }
    if (!exchangedTokens) {
      throw new Error("No tokens received from Google");
    }
    return {
      access_token: exchangedTokens.access_token,
      refresh_token: exchangedTokens.refresh_token,
      expiry_date: exchangedTokens.expiry_date || 0
    };
  } catch (error) {
    console.error(`Error exchanging code for tokens:`, error);
    if (error.message?.includes("invalid_grant")) {
      throw new Error(`Invalid authorization code. This may be because the code has expired or already been used.`);
    }
    if (error.message?.includes("redirect_uri_mismatch")) {
      throw new Error(`Redirect URI mismatch. The redirect URI in this request doesn't match the one used to get the authorization code.`);
    }
    throw error;
  }
}
async function getUserInfo(authClient) {
  try {
    console.log(`${LOG_PREFIX} Attempting to get user info from Google...`);
    const credentials = authClient.credentials;
    const accessToken = credentials.access_token;
    console.log(`${LOG_PREFIX} Auth client credentials structure:`, JSON.stringify({
      has_access_token: !!credentials.access_token,
      has_refresh_token: !!credentials.refresh_token,
      has_expiry_date: !!credentials.expiry_date,
      token_type: credentials.token_type || "none",
      scope: credentials.scope || "none"
    }));
    if (!accessToken) {
      throw new Error("Auth client has no access token");
    }
    try {
      console.log(`${LOG_PREFIX} First approach: Using Google People API...`);
      const people = google2.people({
        version: "v1",
        auth: authClient
      });
      const peopleResponse = await people.people.get({
        resourceName: "people/me",
        personFields: "emailAddresses,names,photos"
      });
      const profile = peopleResponse.data;
      if (profile) {
        console.log(`${LOG_PREFIX} Successfully retrieved user info from People API`);
        const email = profile.emailAddresses && profile.emailAddresses[0] ? profile.emailAddresses[0].value || "" : "";
        const name = profile.names && profile.names[0] ? profile.names[0].displayName || "" : "";
        const picture = profile.photos && profile.photos[0] ? profile.photos[0].url || "" : "";
        console.log(`${LOG_PREFIX} People API returned email: ${email}`);
        return { email, name, picture };
      }
      console.log(`${LOG_PREFIX} People API didn't return profile data, trying userinfo endpoint...`);
    } catch (peopleError) {
      console.log(`${LOG_PREFIX} People API approach failed, trying userinfo endpoint...`, peopleError);
    }
    console.log(`${LOG_PREFIX} Second approach: Using direct fetch to userinfo endpoint`);
    const userinfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";
    console.log(`${LOG_PREFIX} Making request to ${userinfoEndpoint}`);
    const response = await fetch(userinfoEndpoint, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${LOG_PREFIX} Error response from Google:`, {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      if (response.status === 401) {
        throw new Error(`Authentication error: The access token may be invalid or expired.`);
      }
      throw new Error(`Google API error (${response.status}): ${response.statusText}`);
    }
    const userData = await response.json();
    if (!userData) {
      throw new Error("No user data returned from Google");
    }
    console.log(`${LOG_PREFIX} Successfully retrieved user info for email: ${userData.email || "unknown"}`);
    return {
      email: userData.email || "",
      name: userData.name || "",
      picture: userData.picture || ""
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting user info from Google:`, error);
    if (error.message?.includes("invalid_token")) {
      throw new Error(`Invalid access token. The token may have expired.`);
    }
    if (error.code === 401 || error.status === 401 || error.message?.includes("401")) {
      throw new Error(`Unauthorized request to Google API. The access token may be invalid or expired.`);
    }
    throw error;
  }
}

// server/routes.ts
import { google as google4 } from "googleapis";

// server/services/file-service.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/receipts");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || "unknown";
    const timestamp2 = Date.now();
    const fileExtension = path.extname(file.originalname);
    const sanitizedFilename = path.basename(file.originalname, fileExtension).replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `receipt_${userId}_${timestamp2}_${sanitizedFilename}${fileExtension}`;
    cb(null, filename);
  }
});
function getPublicFileUrl(filename) {
  return `/uploads/receipts/${filename}`;
}
var fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, WEBP images and PDF files are allowed."));
  }
};
var upload = multer({
  storage: storage2,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB file size limit
  }
});
function downloadFile(req, res) {
  const { filename } = req.params;
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), "uploads/receipts", sanitizedFilename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send("File not found");
    return;
  }
  if (req.user && req.user.id) {
    const userId = req.user.id;
    const filenameParts = sanitizedFilename.split("_");
    if (filenameParts.length >= 3 && filenameParts[1] !== userId.toString()) {
      res.status(403).send("Unauthorized access to file");
      return;
    }
  } else {
    res.status(401).send("Authentication required");
    return;
  }
  res.download(filePath);
}

// server/routes.ts
init_ai_service();
init_gmail();

// server/services/lead-management.ts
init_storage();
init_ai_service();
async function detectLeadsFromEmails(userId) {
  try {
    console.log(`Processing emails for user ${userId} to detect new leads`);
    let leadsCreated = 0;
    try {
      const { fetchEmails: fetchEmails3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
      const emails3 = await fetchEmails3(userId, 50);
      if (!emails3.length) {
        console.log(`No emails found for lead detection for user ${userId}`);
        return 0;
      }
      for (const email of emails3) {
        if (email.from?.includes("noreply") || email.from?.includes("no-reply") || !email.body || email.body.trim().length < 30) {
          continue;
        }
        const emailContent = `
          From: ${email.from}
          Subject: ${email.subject}
          Date: ${email.date ? new Date(email.date).toISOString() : "Unknown"}
          
          ${email.body}
        `;
        const leadData = await extractLeadFromEmail(emailContent);
        if (leadData && leadData.name && leadData.email) {
          const existingLeads = await storage.getLeadsByUserId(userId);
          const alreadyExists = existingLeads.some(
            (lead) => lead.email === leadData.email || lead.name === leadData.name
          );
          if (!alreadyExists) {
            await storage.createLead({
              userId,
              name: leadData.name,
              email: leadData.email,
              source: "email",
              status: "new",
              priority: leadData.priority || "medium",
              value: leadData.value || 0,
              nextContactDate: leadData.nextContactDate ? new Date(leadData.nextContactDate) : null,
              notes: leadData.notes || `Lead created automatically from email.
Original Message:
${email.body.substring(0, 500)}...`,
              tags: ["auto-detected"],
              metadata: {
                sourceEmailId: email.id,
                detectionConfidence: leadData.confidence || 0.8
              }
            });
            leadsCreated++;
            await storage.createTask({
              userId,
              title: `Follow up with new lead: ${leadData.name}`,
              description: `This lead was automatically detected from an email. Review and follow up as needed.`,
              priority: leadData.priority || "medium",
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1e3),
              // Due in 1 day
              assignedTo: "me",
              estimatedTime: 30,
              aiGenerated: true,
              completed: false
              // leadId will be added later after the lead is created
            });
          }
        }
      }
    } catch (error) {
      if (error.message && error.message.includes("Google account not connected")) {
        console.log(`User ${userId} doesn't have Google account connected. Skipping email-based lead detection.`);
        return 0;
      }
      throw error;
    }
    console.log(`Created ${leadsCreated} leads from emails for user ${userId}`);
    return leadsCreated;
  } catch (error) {
    console.error(`Error detecting leads from emails for user ${userId}:`, error);
    return 0;
  }
}
async function updateLeadPriority(userId, leadId) {
  try {
    const lead = await storage.getLead(leadId);
    if (!lead || lead.userId !== userId) {
      console.error(`Lead ${leadId} not found or does not belong to user ${userId}`);
      return false;
    }
    try {
      const { fetchEmails: fetchEmails3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
      const allEmails = await fetchEmails3(userId, 100);
      const emails3 = allEmails.filter(
        (email) => email.from?.toLowerCase().includes(lead.email.toLowerCase()) || email.to?.toLowerCase().includes(lead.email.toLowerCase())
      );
      if (emails3.length === 0) {
        console.log(`No emails found for lead ${leadId} with email ${lead.email}`);
        return false;
      }
      const emailsContent = emails3.map((email) => `
        Subject: ${email.subject || "No Subject"}
        Date: ${email.date ? new Date(email.date).toISOString() : "Unknown"}
        
        ${email.body || "No content"}
      `).join("\n\n---\n\n");
      const leadInfo = `
        Name: ${lead.name}
        Email: ${lead.email}
        Status: ${lead.status}
        Current Priority: ${lead.priority}
        Last Contact: ${lead.lastContactDate ? new Date(lead.lastContactDate).toISOString() : "Unknown"}
        Notes: ${lead.notes || "No notes available"}
      `;
      const suggestedPriority = await suggestLeadPriority(leadInfo, emailsContent);
      if (suggestedPriority && suggestedPriority !== lead.priority) {
        await storage.updateLead(userId, leadId, {
          priority: suggestedPriority,
          updatedAt: /* @__PURE__ */ new Date()
        });
        console.log(`Updated lead ${leadId} priority from ${lead.priority} to ${suggestedPriority}`);
        return true;
      }
      return false;
    } catch (error) {
      if (error.message && error.message.includes("Google account not connected")) {
        console.log(`User ${userId} doesn't have Google account connected. Skipping email-based priority update.`);
        return false;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error updating priority for lead ${leadId}:`, error);
    return false;
  }
}
async function processLeadsForUser(userId) {
  try {
    console.log(`Starting autonomous lead management for user ${userId}`);
    console.log(`Processing emails for user ${userId} to detect new leads`);
    await detectLeadsFromEmails(userId);
    const leads2 = await storage.getLeadsByUserId(userId);
    console.log(`Found ${leads2.length} leads to process for user ${userId}`);
    let processed = 0;
    let priorityUpdated = 0;
    let followUpSent = 0;
    let errors = 0;
    for (const lead of leads2) {
      try {
        console.log(`Processing lead: ${lead.name} (${lead.email})`);
        const shouldUpdatePriority = !lead.updatedAt || (/* @__PURE__ */ new Date()).getTime() - new Date(lead.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1e3;
        if (shouldUpdatePriority) {
          const updated = await updateLeadPriority(userId, lead.id);
          if (updated) {
            priorityUpdated++;
          }
        }
        const needsFollowUp = lead.nextContactDate && new Date(lead.nextContactDate) <= /* @__PURE__ */ new Date();
        if (needsFollowUp) {
          try {
            const { fetchEmails: fetchEmails3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
            const allEmails = await fetchEmails3(userId, 100);
            const emails3 = allEmails.filter(
              (email) => email.from?.toLowerCase().includes(lead.email.toLowerCase()) || email.to?.toLowerCase().includes(lead.email.toLowerCase())
            );
            let lastEmailDate = null;
            if (emails3.length > 0) {
              const sortedEmails = [...emails3].sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
              });
              if (sortedEmails[0].date) {
                lastEmailDate = new Date(sortedEmails[0].date);
              }
            }
            if (lastEmailDate && (/* @__PURE__ */ new Date()).getTime() - lastEmailDate.getTime() < 3 * 24 * 60 * 60 * 1e3) {
              console.log(`Skipping follow-up for lead ${lead.id} - recently contacted`);
            } else {
              await storage.createTask({
                userId,
                title: `Follow up with lead: ${lead.name}`,
                description: `This lead is due for follow-up. Last contact date: ${lead.lastContactDate || "Unknown"}`,
                priority: lead.priority || "medium",
                dueDate: /* @__PURE__ */ new Date(),
                assignedTo: "me",
                estimatedTime: 15,
                aiGenerated: true,
                completed: false,
                leadId: lead.id
              });
              await storage.updateLead(userId, lead.id, {
                nextContactDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3),
                updatedAt: /* @__PURE__ */ new Date()
              });
              followUpSent++;
            }
          } catch (error) {
            if (error.message && error.message.includes("Google account not connected")) {
              console.log(`User ${userId} doesn't have Google account connected. Creating follow-up task anyway.`);
              await storage.createTask({
                userId,
                title: `Follow up with lead: ${lead.name}`,
                description: `This lead is due for follow-up. Last contact date: ${lead.lastContactDate || "Unknown"}`,
                priority: lead.priority || "medium",
                dueDate: /* @__PURE__ */ new Date(),
                assignedTo: "me",
                estimatedTime: 15,
                aiGenerated: true,
                completed: false,
                leadId: lead.id
              });
              await storage.updateLead(userId, lead.id, {
                nextContactDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3),
                updatedAt: /* @__PURE__ */ new Date()
              });
              followUpSent++;
            } else {
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
async function processLeadsForAllUsers() {
  try {
    const users2 = await storage.getAllUsers();
    let usersProcessed = 0;
    let leadsProcessed = 0;
    let priorityUpdates = 0;
    let followUpsSent = 0;
    let errors = 0;
    for (const user of users2) {
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
    console.error("Error processing leads for all users:", error);
    return {
      usersProcessed: 0,
      leadsProcessed: 0,
      priorityUpdates: 0,
      followUpsSent: 0,
      errors: 1
    };
  }
}

// server/services/auto-calendar.ts
init_storage();
init_ai_service();

// server/vite.ts
import express3 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  base: "./"
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath2 = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath2)) {
    throw new Error(
      `Could not find the build directory: ${distPath2}, make sure to build the client first`
    );
  }
  app2.use(express3.static(distPath2));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath2, "index.html"));
  });
}

// server/services/auto-calendar.ts
async function scanEmailsForMeetings(userId) {
  try {
    const emails3 = await storage.getEmailsByUserId(userId);
    if (!emails3 || emails3.length === 0) {
      return [];
    }
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    log(`Scanning ${emails3.length} emails for meeting requests for user ${userId}`);
    let preferences = {};
    try {
      if (user.preferences) {
        preferences = typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences;
      }
    } catch (e) {
      log(`Error parsing user preferences: ${e}`, "error");
    }
    const autoScheduleEnabled = preferences && preferences.autoScheduleMeetings === true;
    if (!autoScheduleEnabled) {
      log(`Auto meeting scheduling is disabled for user ${userId}`);
      return [];
    }
    const suggestedEvents = [];
    for (const email of emails3) {
      if (email.processed || !email.body) continue;
      const event = await detectMeetingRequest(email, user);
      if (event) {
        suggestedEvents.push(event);
        await storage.updateEmail(userId, email.id, { processed: true });
      }
    }
    log(`Found ${suggestedEvents.length} meeting suggestions in emails for user ${userId}`);
    return suggestedEvents;
  } catch (error) {
    log(`Error in scanEmailsForMeetings: ${error}`, "error");
    return [];
  }
}
async function detectMeetingRequest(email, user) {
  try {
    const meetingKeywords = [
      // Direct meeting terms
      "meeting",
      "call",
      "discussion",
      "appointment",
      "schedule",
      "meet",
      "sync",
      "catch up",
      "talk",
      "conference",
      "interview",
      "zoom",
      "google meet",
      "teams",
      "webex",
      // Indirect meeting intentions
      "availability",
      "when are you free",
      "let's connect",
      "get together",
      "let me know when",
      "would you have time",
      "find a time",
      "calendar",
      // Time-related terms that suggest scheduling
      "next week",
      "this week",
      "tomorrow",
      "morning",
      "afternoon",
      "evening",
      // Days of week that might indicate scheduling
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday"
    ];
    const subjectLower = email.subject.toLowerCase();
    const bodyLower = email.body.toLowerCase();
    let containsMeetingKeywords = meetingKeywords.some(
      (keyword) => subjectLower.includes(keyword) || bodyLower.includes(keyword)
    );
    const timePatterns = [
      /\b\d{1,2}[\s]?(am|pm)\b/i,
      // 3pm, 3 pm, 11am
      /\b\d{1,2}:\d{2}[\s]?(am|pm)?\b/i,
      // 3:30pm, 15:00, 3:30 PM
      /\b(at|from|between)[\s]+\d{1,2}[\s]?(am|pm|:\d{2})/i
      // at 3pm, from 3:30
    ];
    const containsTimePatterns = timePatterns.some(
      (pattern) => pattern.test(bodyLower)
    );
    const datePatterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(st|nd|rd|th)?\b/i,
      // Jan 15th, December 3
      /\b\d{1,2}(st|nd|rd|th)?[\s]+(of[\s]+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i,
      // 15th of January, 3 Dec
      /\bnext (mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i,
      // next Monday
      /\b(this|next) week\b/i,
      // this week, next week
      /\btomorrow\b/i,
      // tomorrow
      /\b\d{4}-\d{2}-\d{2}\b/
      // ISO format: 2025-04-22
    ];
    const containsDatePatterns = datePatterns.some(
      (pattern) => pattern.test(bodyLower)
    );
    const mightBeMeetingRequest = containsMeetingKeywords || containsTimePatterns && containsDatePatterns;
    if (!mightBeMeetingRequest) {
      return null;
    }
    const prompt = `
    You are an intelligent executive assistant that analyzes emails to detect and extract meeting requests.
    
    Email Subject: ${email.subject}
    Email Body: ${email.body}
    Sender: ${email.from}
    
    First, determine if this email contains or implies a meeting request, call, appointment, or any form of scheduled discussion.
    Look for both explicit and implicit meeting requests. An implicit request might be someone asking about availability or suggesting a discussion without specifically using the word "meeting".
    
    If you detect a meeting request, extract the following information with high precision:
    1. Meeting title (make it descriptive and professional)
    2. Proposed date(s) and time(s) - extract ALL possible options mentioned
    3. Expected duration (default to 30 minutes if not specified)
    4. Proposed location or virtual meeting link
    5. All potential attendees mentioned (emails or names)
    6. Meeting purpose/agenda (be detailed and specific)
    7. Priority level (high, medium, low) based on language urgency and sender importance
    
    Return your response in JSON format:
    {
      "isMeetingRequest": true/false,
      "confidence": 0.0-1.0,
      "title": "Meeting title",
      "proposedTimes": ["YYYY-MM-DDTHH:MM:SS", ...],
      "duration": "minutes",
      "location": "location or link",
      "attendees": ["email1", "email2", ...],
      "agenda": "brief description of meeting purpose",
      "priority": "high/medium/low",
      "followUpNeeded": true/false,
      "suggestedResponse": "A brief suggested response to confirm the meeting time"
    }
    
    If it's not a meeting request, return { "isMeetingRequest": false, "confidence": 0.0-1.0 }
    
    Be especially careful with date and time extraction - make sure to handle relative dates like "tomorrow", "next Tuesday", etc. correctly.
    For time zones, assume the recipient's local time if not specified.
    If multiple times are suggested, include all of them in proposedTimes.
    `;
    const response = await getClaudeResponse(prompt);
    const { extractJsonFromResponse: extractJsonFromResponse2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
    const result = extractJsonFromResponse2(response);
    if (!result.isMeetingRequest || result.confidence < 0.6) {
      return null;
    }
    let startTime = /* @__PURE__ */ new Date();
    if (result.proposedTimes && result.proposedTimes.length > 0) {
      startTime = new Date(result.proposedTimes[0]);
    }
    let endTime = new Date(startTime);
    const durationMinutes = parseInt(result.duration) || 30;
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    let attendees = result.attendees || [email.from];
    if (user.email && !attendees.includes(user.email)) {
      attendees.push(user.email);
    }
    const contextNotes = `
Detected from email: "${email.subject}" from ${email.from}
Confidence score: ${result.confidence.toFixed(2)}
${result.proposedTimes.length > 1 ? `Alternative times: ${result.proposedTimes.slice(1).join(", ")}` : ""}
${result.suggestedResponse ? `Suggested response: ${result.suggestedResponse}` : ""}
${result.followUpNeeded ? "Follow-up recommended after meeting" : ""}
Priority: ${result.priority || "medium"}
    `.trim();
    const event = {
      userId: user.id,
      title: result.title || `Meeting: ${email.subject}`,
      description: result.agenda || "",
      startTime,
      endTime,
      location: result.location || "",
      meetingUrl: result.location?.startsWith("http") ? result.location : "",
      attendees,
      emailId: email.id,
      aiNotes: `Auto-detected from email with ${(result.confidence * 100).toFixed(0)}% confidence.`,
      contextNotes,
      // Mark as temporary by default for confirmation flow
      temporary: true,
      // Store AI confidence as integer percentage (0-100)
      aiConfidence: Math.round(result.confidence * 100)
    };
    const prepNotes = await generateMeetingPrep(event);
    if (prepNotes) {
      event.aiNotes = prepNotes.summary;
      event.contextNotes = prepNotes.context + "\n\n" + contextNotes;
    }
    const formattedEvent = {
      userId: event.userId,
      title: event.title,
      description: event.description || "",
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || "",
      meetingUrl: event.meetingUrl || "",
      attendees: event.attendees || [],
      emailId: event.emailId || void 0,
      // Use undefined instead of null
      aiNotes: event.aiNotes || "",
      contextNotes: event.contextNotes || "",
      temporary: true,
      aiConfidence: event.aiConfidence || 0
      // Provide a default confidence
    };
    return formattedEvent;
  } catch (error) {
    log(`Error in detectMeetingRequest: ${error}`, "error");
    return null;
  }
}
async function prepareMeetingNotes(userId) {
  try {
    const events2 = await storage.getEventsByUserId(userId);
    if (!events2 || events2.length === 0) {
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const in24Hours = new Date(now);
    in24Hours.setHours(in24Hours.getHours() + 24);
    const upcomingEvents = events2.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate > now && eventDate < in24Hours && !event.aiNotes;
    });
    if (upcomingEvents.length === 0) {
      return;
    }
    log(`Generating meeting prep notes for ${upcomingEvents.length} upcoming events for user ${userId}`);
    for (const event of upcomingEvents) {
      const prepNotes = await generateMeetingPrep(event);
      if (prepNotes) {
        await storage.updateEvent(userId, event.id, {
          aiNotes: prepNotes.summary,
          contextNotes: prepNotes.context
        });
      }
    }
  } catch (error) {
    log(`Error in prepareMeetingNotes: ${error}`, "error");
  }
}
async function runAutoCalendarManagement() {
  try {
    const users2 = await storage.getAllUsers();
    for (const user of users2) {
      let preferences = {};
      try {
        if (user.preferences) {
          preferences = typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences;
        }
      } catch (e) {
        log(`Error parsing user preferences: ${e}`, "error");
      }
      const autoScheduleEnabled = preferences && preferences.autoScheduleMeetings === true;
      if (!autoScheduleEnabled) {
        continue;
      }
      const suggestedEvents = await scanEmailsForMeetings(user.id);
      for (const event of suggestedEvents) {
        if (!event.userId) {
          log(`Missing userId for event ${event.title}, skipping...`, "error");
          continue;
        }
        const eventToInsert = {
          userId: event.userId,
          title: event.title || "Untitled Meeting",
          description: event.description || "",
          startTime: event.startTime || /* @__PURE__ */ new Date(),
          endTime: event.endTime || new Date(Date.now() + 30 * 60 * 1e3),
          // Add 30 mins if missing
          location: event.location || "",
          meetingUrl: event.meetingUrl || "",
          attendees: event.attendees || [],
          emailId: typeof event.emailId === "number" ? event.emailId : void 0,
          aiNotes: event.aiNotes || "",
          contextNotes: event.contextNotes || "",
          temporary: event.temporary === true,
          aiConfidence: event.aiConfidence || 0
          // Provide a default confidence
        };
        await storage.createEvent(eventToInsert);
      }
      await prepareMeetingNotes(user.id);
    }
    log("Automated calendar management completed");
  } catch (error) {
    log(`Error in runAutoCalendarManagement: ${error}`, "error");
  }
}

// server/services/task-service.ts
init_db();
init_schema();
init_ai_service();
import { eq as eq2, and as and2, or } from "drizzle-orm";
async function createTaskFromEmail(userId, emailId, emailData) {
  try {
    const taskData = await extractTaskFromEmail(emailData);
    if (!taskData) {
      console.log(`No task detected in email ID: ${emailId}`);
      return null;
    }
    const insertData = {
      userId,
      title: taskData.title,
      description: taskData.description || "",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : void 0,
      priority: taskData.priority || "medium",
      aiGenerated: true,
      assignedTo: "me",
      estimatedTime: taskData.estimatedTime || 30,
      emailId,
      source: "email"
    };
    const [newTask] = await db.insert(tasks).values(insertData).returning();
    console.log(`Created task "${newTask.title}" from email ID: ${emailId}`);
    return newTask;
  } catch (error) {
    console.error("Error creating task from email:", error);
    return null;
  }
}
async function createTaskFromChat(userId, chatContent, parsedTask) {
  try {
    let taskData = parsedTask || {};
    if (!taskData.title) {
      const extractedData = await extractTaskFromText(chatContent);
      if (extractedData) {
        taskData = {
          ...taskData,
          title: extractedData.title || taskData.title,
          description: taskData.description || extractedData.description || "",
          dueDate: taskData.dueDate || extractedData.dueDate,
          priority: taskData.priority || extractedData.priority || "medium",
          estimatedTime: taskData.estimatedTime || extractedData.estimatedTime || 30
        };
      }
      if (!taskData.title) {
        taskData.title = `Task from chat: ${chatContent.substring(0, 30)}${chatContent.length > 30 ? "..." : ""}`;
        taskData.description = taskData.description || chatContent.substring(0, 200);
        taskData.priority = taskData.priority || "medium";
        taskData.estimatedTime = taskData.estimatedTime || 30;
      }
    }
    const insertData = {
      userId,
      title: taskData.title,
      description: taskData.description || "",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : void 0,
      priority: taskData.priority || "medium",
      aiGenerated: true,
      assignedTo: "me",
      estimatedTime: taskData.estimatedTime || 30,
      source: "chat"
    };
    const [newTask] = await db.insert(tasks).values(insertData).returning();
    console.log(`Created task "${newTask.title}" from chat`);
    return newTask;
  } catch (error) {
    console.error("Error creating task from chat:", error);
    return null;
  }
}
async function extractTaskFromEmail(emailData) {
  try {
    const cleanBody = emailData.body.replace(/<[^>]*>/g, " ");
    if (!process.env.ANTHROPIC_API_KEY) {
      const keywords = ["todo", "task", "action item", "follow up", "deadline", "assignment", "please do"];
      const cleanText = (emailData.subject + " " + cleanBody).toLowerCase();
      const containsTask = keywords.some((keyword) => cleanText.includes(keyword.toLowerCase()));
      if (containsTask) {
        return {
          title: emailData.subject,
          description: cleanBody.substring(0, 200),
          priority: "medium",
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
${cleanBody.substring(0, 3e3)} // Truncate long emails

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
    const response = await getClaudeResponse(prompt);
    if (!response) throw new Error("Failed to get AI response");
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
        return null;
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      return null;
    }
  } catch (error) {
    console.error("Error in extractTaskFromEmail:", error);
    return null;
  }
}
async function extractTaskFromText(text2) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      const words = text2.split(" ");
      const title = words.slice(0, Math.min(8, words.length)).join(" ");
      return {
        title: title || "New Task",
        description: text2.substring(0, 200),
        priority: "medium",
        estimatedTime: 30
      };
    }
    const prompt = `
You are an AI assistant that helps extract task information from user messages.
Analyze the following text and determine if it contains a task request or action item:

${text2.substring(0, 500)} // Truncate long inputs

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
    const response = await getClaudeResponse(prompt);
    if (!response) throw new Error("Failed to get AI response");
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
        return null;
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      return {
        title: text2.substring(0, 50) || "New Task",
        description: text2.substring(0, 200),
        priority: "medium",
        estimatedTime: 30
      };
    }
  } catch (error) {
    console.error("Error in extractTaskFromText:", error);
    return {
      title: text2.substring(0, 50) || "New Task",
      description: text2.substring(0, 200),
      priority: "medium",
      estimatedTime: 30
    };
  }
}
async function getTasksForEmailThread(userId, threadId) {
  try {
    const emailsInThread = await db.select().from(emails).where(and2(
      eq2(emails.userId, userId),
      eq2(emails.threadId, threadId)
    ));
    const emailIds = emailsInThread.map((email) => email.id);
    let linkedTasks = [];
    if (emailIds.length > 0) {
      linkedTasks = await db.select().from(tasks).where(
        and2(
          eq2(tasks.userId, userId),
          // Handle multiple email IDs using OR conditions
          emailIds.length === 1 ? eq2(tasks.emailId, emailIds[0]) : or(...emailIds.map((id) => eq2(tasks.emailId, id)))
        )
      );
    }
    if (linkedTasks.length > 0) {
      return linkedTasks;
    }
    const emailSubjects = emailsInThread.map((email) => email.subject.toLowerCase());
    const userTasks = await db.select().from(tasks).where(eq2(tasks.userId, userId));
    return userTasks.filter((task) => {
      const taskTitle = task.title.toLowerCase();
      return emailSubjects.some(
        (subject) => subject.split(" ").some(
          (word) => word.length > 3 && taskTitle.includes(word)
        )
      );
    });
  } catch (error) {
    console.error("Error getting tasks for email thread:", error);
    return [];
  }
}

// server/routes/leads.ts
init_storage();
init_schema();
import { Router as Router4 } from "express";
import { z as z3 } from "zod";
var router6 = Router4();
router6.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const userId = req.user.id;
    const leads2 = await storage.getLeadsByUserId(userId);
    res.json(leads2);
  } catch (error) {
    console.error("Error getting leads:", error);
    res.status(500).json({ error: "Failed to get leads" });
  }
});
router6.get("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const userId = req.user.id;
    const leadId = parseInt(req.params.id);
    const lead = await storage.getLead(leadId);
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    console.error("Error getting lead:", error);
    res.status(500).json({ error: "Failed to get lead" });
  }
});
router6.post("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const userId = req.user.id;
    const validatedData = insertLeadSchema.safeParse({ ...req.body, userId });
    if (!validatedData.success) {
      return res.status(400).json({
        error: "Invalid lead data",
        details: validatedData.error.format()
      });
    }
    const lead = await storage.createLead(validatedData.data);
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});
router6.patch("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const userId = req.user.id;
    const leadId = parseInt(req.params.id);
    const updateSchema = z3.object({
      name: z3.string().optional(),
      email: z3.string().email().optional(),
      company: z3.string().optional().nullable(),
      status: z3.string().optional(),
      priority: z3.string().optional(),
      nextContactDate: z3.string().optional().transform((val) => val ? new Date(val) : void 0),
      notes: z3.string().optional().nullable(),
      tags: z3.array(z3.string()).optional(),
      value: z3.number().optional().nullable()
    });
    const validatedData = updateSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: "Invalid lead data",
        details: validatedData.error.format()
      });
    }
    const updatedLead = await storage.updateLead(userId, leadId, validatedData.data);
    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});
router6.delete("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const userId = req.user.id;
    const leadId = parseInt(req.params.id);
    const success = await storage.deleteLead(userId, leadId);
    if (!success) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});
var leads_default = router6;

// server/routes/google-auth.ts
import { Router as Router5 } from "express";
init_config();
var router7 = Router5();
router7.get("/url", (req, res) => {
  try {
    const actualHost = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const actualOrigin = `${protocol}://${actualHost}`;
    const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
    console.log(`Dynamic Google Auth: Detected origin ${actualOrigin}`);
    console.log(`Dynamic Google Auth: Using callback URL ${dynamicCallbackUrl}`);
    process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
    const authUrl = getGoogleAuthUrl();
    delete process.env.TEMP_CALLBACK_URL;
    res.json({
      url: authUrl,
      callbackUrl: dynamicCallbackUrl
    });
  } catch (error) {
    console.error("Error generating dynamic Google auth URL:", error);
    res.status(500).json({
      error: "Failed to generate authorization URL",
      details: error.message || String(error)
    });
  }
});
router7.get("/", (req, res) => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    res.status(500).json({ error: "Failed to generate authorization URL" });
  }
});
router7.get("/debug", (req, res) => {
  const actualHost = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const actualOrigin = `${protocol}://${actualHost}`;
  const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
  const configuredCallbackUrl = config_default.google.callbackUrl;
  res.json({
    request: {
      headers: {
        host: req.headers.host,
        "x-forwarded-proto": req.headers["x-forwarded-proto"],
        "x-forwarded-host": req.headers["x-forwarded-host"],
        origin: req.headers.origin,
        referer: req.headers.referer
      },
      url: req.url,
      originalUrl: req.originalUrl,
      detectedOrigin: actualOrigin,
      dynamicCallbackUrl
    },
    config: {
      baseUrl: config_default.baseUrl,
      googleCallbackUrl: configuredCallbackUrl,
      googleCallbackPath: config_default.google.callbackPath,
      environment: process.env.NODE_ENV,
      isReplit: config_default.isReplit,
      customDomain: process.env.CUSTOM_DOMAIN || null,
      usingCustomDomain: !!process.env.CUSTOM_DOMAIN
    },
    env: {
      REPL_ID: process.env.REPL_ID,
      REPL_SLUG: process.env.REPL_SLUG,
      REPL_OWNER: process.env.REPL_OWNER
    }
  });
});
var google_auth_default = router7;

// server/routes/google-diagnostic.ts
init_config();
import express4 from "express";
var router8 = express4.Router();
router8.get("/diagnostic", (req, res) => {
  try {
    const authConfig = {
      baseUrl: config.baseUrl,
      callbackUrl: `${config.baseUrl}/api/auth/google/callback`,
      clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID : "Not configured"
    };
    console.log("Returning OAuth diagnostic information:", {
      baseUrl: authConfig.baseUrl,
      callbackUrl: authConfig.callbackUrl,
      clientId: authConfig.clientId.substring(0, 10) + "..." + authConfig.clientId.substring(authConfig.clientId.length - 10)
    });
    res.json(authConfig);
  } catch (error) {
    console.error("Error in Google OAuth diagnostic endpoint:", error);
    res.status(500).json({
      error: "Failed to retrieve OAuth configuration",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
var google_diagnostic_default = router8;

// server/routes/db-diagnostic.ts
init_db();
import express5 from "express";
var router9 = express5.Router();
router9.get("/status", async (req, res) => {
  try {
    console.log("Checking database connection status");
    const startTime = Date.now();
    const result = await pool.query("SELECT now()");
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const connectionInfo = {
      connected: true,
      dbTime: result.rows[0].now,
      responseTimeMs: responseTime,
      platform: process.env.REPL_ID ? "Replit" : "Production",
      host: req.headers.host
    };
    try {
      const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
      connectionInfo["userCount"] = userCount.rows[0].count;
    } catch (err) {
      console.error("Error counting users:", err);
      connectionInfo["userCount"] = "Error fetching count";
    }
    console.log("Database connection successful:", connectionInfo);
    res.json({
      status: "ok",
      database: connectionInfo
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
      host: req.headers.host,
      platform: process.env.REPL_ID ? "Replit" : "Production"
    });
  }
});
router9.post("/create-test-user", async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        status: "error",
        message: "This endpoint is only available in development mode"
      });
    }
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required"
      });
    }
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Username already exists"
      });
    }
    const result = await pool.query(
      "INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email",
      [username, password, email || null]
    );
    res.status(201).json({
      status: "success",
      message: "Test user created successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create test user",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
var db_diagnostic_default = router9;

// server/routes/domain-sync-check.ts
init_db();
import express6 from "express";
var router10 = express6.Router();
router10.get("/check", async (req, res) => {
  try {
    console.log("Domain synchronization check requested");
    const hostInfo = {
      host: req.headers.host,
      forwarded: req.headers["x-forwarded-host"],
      protocol: req.headers["x-forwarded-proto"] || "https",
      origin: req.headers.origin,
      referer: req.headers.referer
    };
    console.log("Request host info:", hostInfo);
    const startTime = Date.now();
    const result = await pool.query("SELECT now(), version() as pg_version");
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const userCountResult = await pool.query("SELECT COUNT(*) as count FROM users");
    const userCount = userCountResult.rows[0].count;
    const usersSample = await pool.query(
      "SELECT id, username, email, created_at FROM users LIMIT 5"
    );
    const syncInfo = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      request: {
        host: hostInfo.host,
        protocol: hostInfo.protocol,
        fullUrl: `${hostInfo.protocol}://${hostInfo.host}${req.originalUrl}`
      },
      database: {
        connected: true,
        responseTimeMs: responseTime,
        postgresVersion: result.rows[0].pg_version,
        serverTime: result.rows[0].now,
        userCount,
        usersSample: usersSample.rows
      },
      isProductionDomain: hostInfo.host === "binateai.com",
      environment: process.env.NODE_ENV || "development",
      diagnosticNote: "If this same data appears when accessing from both Replit and binateai.com domains, they're using the same database."
    };
    res.json(syncInfo);
  } catch (error) {
    console.error("Domain sync check error:", error);
    res.status(500).json({
      error: "Failed to check domain synchronization",
      message: error instanceof Error ? error.message : String(error),
      host: req.headers.host
    });
  }
});
var domain_sync_check_default = router10;

// server/routes.ts
var scheduledTasks = {};
async function registerRoutes(app2) {
  app2.get("/api/healthcheck", (req, res) => {
    console.log("\n===== HEALTHCHECK ENVIRONMENT VARS =====");
    console.log("FORCE_PRODUCTION_DOMAIN:", process.env.FORCE_PRODUCTION_DOMAIN);
    console.log("DISABLE_DOMAIN_OVERRIDE:", process.env.DISABLE_DOMAIN_OVERRIDE);
    console.log("CUSTOM_DOMAIN:", process.env.CUSTOM_DOMAIN);
    console.log("======================================\n");
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      server: "Binate AI",
      environment: process.env.NODE_ENV || "development",
      request: {
        host: req.get("host"),
        origin: req.get("origin"),
        forwarded: req.get("x-forwarded-host"),
        protocol: req.protocol,
        ip: req.ip,
        fullUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`
      },
      replit: {
        replId: process.env.REPL_ID,
        replSlug: process.env.REPL_SLUG,
        replOwner: process.env.REPL_OWNER
      },
      config: {
        baseUrl: config_default.baseUrl,
        forceProductionDomain: process.env.FORCE_PRODUCTION_DOMAIN === "true",
        customDomain: process.env.CUSTOM_DOMAIN,
        disableDomainOverride: process.env.DISABLE_DOMAIN_OVERRIDE === "true"
      },
      env_variables: {
        FORCE_PRODUCTION_DOMAIN: process.env.FORCE_PRODUCTION_DOMAIN,
        DISABLE_DOMAIN_OVERRIDE: process.env.DISABLE_DOMAIN_OVERRIDE,
        CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
        BASE_URL: process.env.BASE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  });
  app2.get("/api/config", (req, res) => {
    res.json({
      baseUrl: config_default.baseUrl,
      google: {
        callbackUrl: config_default.google.callbackUrl,
        callbackPath: config_default.google.callbackPath
      }
    });
  });
  app2.post("/api/preview-login", (req, res) => {
    handlePreviewLogin(req, res);
  });
  app2.use(previewAuthMiddleware);
  setupAuth(app2);
  app2.get("/api/debug/google/test", (req, res) => {
    try {
      console.log("Testing Google OAuth configuration");
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const environmentCheck = {
        googleClientIdPresent: !!googleClientId,
        googleClientSecretPresent: !!googleClientSecret,
        googleClientIdPrefix: googleClientId ? `${googleClientId.substring(0, 8)}...` : "missing",
        nodeEnv: process.env.NODE_ENV || "not set",
        platform: process.env.REPL_SLUG ? "Replit" : "Other",
        hostname: req.headers.host,
        protocol: req.headers["x-forwarded-proto"] || "https"
      };
      const configCallbackUrl = config_default.google.callbackUrl;
      const actualHost = req.headers.host;
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const actualOrigin = `${protocol}://${actualHost}`;
      const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
      const redirectUriTest = {
        configuredCallbackUrl: configCallbackUrl,
        detectedCallbackUrl: dynamicCallbackUrl,
        match: configCallbackUrl === dynamicCallbackUrl,
        headers: {
          host: req.headers.host,
          "x-forwarded-proto": req.headers["x-forwarded-proto"],
          "x-forwarded-host": req.headers["x-forwarded-host"],
          "x-replit-user-name": req.headers["x-replit-user-name"]
        }
      };
      const defaultAuthUrl = getGoogleAuthUrl();
      process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
      const dynamicAuthUrl = getGoogleAuthUrl();
      delete process.env.TEMP_CALLBACK_URL;
      const defaultUrlParams = new URL(defaultAuthUrl).searchParams;
      const dynamicUrlParams = new URL(dynamicAuthUrl).searchParams;
      const urlComparison = {
        defaultRedirectUri: defaultUrlParams.get("redirect_uri"),
        dynamicRedirectUri: dynamicUrlParams.get("redirect_uri"),
        redirectUriMatches: defaultUrlParams.get("redirect_uri") === dynamicUrlParams.get("redirect_uri"),
        defaultClientId: defaultUrlParams.get("client_id")?.substring(0, 8) + "...",
        dynamicClientId: dynamicUrlParams.get("client_id")?.substring(0, 8) + "...",
        clientIdMatches: defaultUrlParams.get("client_id") === dynamicUrlParams.get("client_id")
      };
      res.json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: environmentCheck,
        redirectUri: redirectUriTest,
        urlGeneration: urlComparison,
        status: "OK",
        message: "Google OAuth configuration test completed"
      });
    } catch (error) {
      console.error("Debug Google OAuth test error:", error);
      res.status(500).json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.get("/api/show-all-redirect-uris", (req, res) => {
    try {
      console.log("Generating all possible redirect URIs for Google Cloud Console");
      const actualHost = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const actualOrigin = `${protocol}://${actualHost}`;
      const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
      const configuredCallbackUrl = config_default.google.callbackUrl;
      const replitRandomDomain = actualHost;
      const replitRandomCallbackUrl = `${protocol}://${replitRandomDomain}/api/auth/google/callback`;
      const binateaiCallbackUrl = "https://binateai.replit.dev/api/auth/google/callback";
      const replitPreviewCallbackUrl = "https://binateai.replit.app/api/auth/google/callback";
      console.log("Detected host:", actualHost);
      console.log("Using protocol:", protocol);
      console.log("Full origin:", actualOrigin);
      res.json({
        current_request_info: {
          host: actualHost,
          protocol,
          origin: actualOrigin
        },
        possibleRedirectURIs: [
          {
            type: "configured",
            url: configuredCallbackUrl,
            description: "The URL configured in config.ts"
          },
          {
            type: "dynamic",
            url: dynamicCallbackUrl,
            description: "The URL dynamically detected from this request"
          },
          {
            type: "replit_random",
            url: replitRandomCallbackUrl,
            description: "The URL with Replit's random domain pattern"
          },
          {
            type: "binateai_domain",
            url: binateaiCallbackUrl,
            description: "The binateai.replit.dev domain"
          },
          {
            type: "replit_preview",
            url: replitPreviewCallbackUrl,
            description: "The Replit preview domain"
          }
        ],
        instructions: "Add ALL of these URLs to the Authorized Redirect URIs in Google Cloud Console to ensure OAuth works in all environments",
        next_steps: "Open the Google Cloud Console, go to the OAuth consent screen, and add these URIs to the list of authorized redirect URIs"
      });
    } catch (error) {
      console.error("Error generating redirect URIs:", error);
      res.status(500).json({
        error: "Failed to generate redirect URIs",
        message: error.message
      });
    }
  });
  app2.get("/api/google-oauth-test", async (req, res) => {
    try {
      console.log("Google OAuth test endpoint accessed");
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const environmentCheck = {
        googleClientIdSet: !!googleClientId,
        googleClientSecretSet: !!googleClientSecret,
        googleClientIdPrefix: googleClientId ? googleClientId.substring(0, 8) + "..." : "Not set",
        nodeEnv: process.env.NODE_ENV || "Not set",
        isReplit: !!(process.env.REPLIT_SLUG || process.env.REPL_ID || process.env.REPLIT_OWNER)
      };
      let redirectUrl = "https://binateai.replit.dev/api/auth/google/callback";
      const redirectUriTest = {
        redirectUriUsed: redirectUrl,
        redirectUriEncoded: encodeURIComponent(redirectUrl)
      };
      const authUrl = await getGoogleAuthUrl();
      const urlParams = new URL(authUrl).searchParams;
      const urlTest = {
        clientIdMatches: urlParams.get("client_id") === googleClientId,
        redirectUriEncoded: urlParams.get("redirect_uri"),
        redirectUriDecoded: decodeURIComponent(urlParams.get("redirect_uri") || ""),
        redirectUriMatches: decodeURIComponent(urlParams.get("redirect_uri") || "") === redirectUrl,
        scopeIncludes: {
          gmail: !!urlParams.get("scope")?.includes("gmail"),
          calendar: !!urlParams.get("scope")?.includes("calendar")
        },
        promptConsent: urlParams.get("prompt") === "consent"
      };
      res.json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: environmentCheck,
        redirectUri: redirectUriTest,
        urlGeneration: urlTest,
        status: "OK",
        message: "Google OAuth configuration test completed"
      });
    } catch (error) {
      console.error("Google OAuth test error:", error);
      res.status(500).json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.get("/api/debug/google/auth", (req, res) => {
    try {
      console.log("Generating debug Google auth URL without authentication");
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment");
        return res.status(500).json({
          error: "Google integration is not properly configured. Please contact support."
        });
      }
      const headers = {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        "x-forwarded-proto": req.headers["x-forwarded-proto"],
        "x-forwarded-host": req.headers["x-forwarded-host"]
      };
      console.log("Debug headers:", headers);
      const actualHost = req.headers.host;
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const actualOrigin = `${protocol}://${actualHost}`;
      const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
      console.log(`Debug detected host: ${actualHost}`);
      console.log(`Debug using callback URL: ${dynamicCallbackUrl}`);
      if (req.query.useDefault === "true") {
        console.log("[Debug] Using default configuration (from config.ts) for OAuth");
      } else {
        process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
        if (req.query.origin) {
          const originFromQuery = req.query.origin;
          process.env.TEMP_CALLBACK_URL = `${originFromQuery}/api/auth/google/callback`;
          console.log(`Debug using origin from query: ${process.env.TEMP_CALLBACK_URL}`);
        }
      }
      const authUrl = getGoogleAuthUrl();
      delete process.env.TEMP_CALLBACK_URL;
      res.json({
        requestInfo: {
          headers,
          detectedOrigin: actualOrigin,
          url: req.url,
          query: req.query
        },
        authUrl,
        note: "This endpoint is for debugging only"
      });
    } catch (error) {
      console.error("Error generating debug Google auth URL:", error);
      res.status(500).json({
        error: error.message,
        details: "There was an error setting up Google authentication"
      });
    }
  });
  app2.get("/api/google-auth-direct", async (req, res) => {
    try {
      const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
      console.log("Google Auth Direct endpoint - User authenticated:", isAuthenticated);
      if (isAuthenticated && req.user) {
        console.log("Authenticated user:", {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email || "not set"
        });
      }
      let redirectUrl = process.env.GOOGLE_REDIRECT_URI || "https://binateai.replit.dev/api/auth/google/callback";
      console.log("Using redirect URL:", redirectUrl);
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment variables:");
        console.error("GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID);
        console.error("GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
        return res.status(500).json({
          error: "Google integration is not properly configured",
          authConfigured: false,
          isAuthenticated,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const authUrl = await getGoogleAuthUrl();
      console.log("FULL GOOGLE AUTH URL:", authUrl);
      console.log("REDIRECT URI parameter:", redirectUrl);
      const match = authUrl.match(/redirect_uri=([^&]+)/);
      console.log("Original match:", match ? match[1] : "No match found");
      res.json({
        authUrl,
        redirectUrl,
        isAuthenticated,
        userId: isAuthenticated && req.user ? req.user.id : null,
        userEmail: isAuthenticated && req.user ? req.user.email : null,
        authConfigured: true,
        note: isAuthenticated ? "You're logged in. Use this URL to connect your Google account directly" : "WARNING: You are not logged in. Authentication is required to save Google connection",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Google Auth Direct error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    const leadId = req.query.leadId ? parseInt(req.query.leadId) : void 0;
    if (leadId) {
      const tasks2 = await storage.getTasksByLeadId(userId, leadId);
      res.json(tasks2);
    } else {
      const tasks2 = await storage.getTasksByUserId(userId);
      res.json(tasks2);
    }
  });
  app2.get("/api/leads/:leadId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    try {
      const tasks2 = await storage.getTasksByLeadId(userId, leadId);
      res.json(tasks2);
    } catch (error) {
      console.error("Error fetching tasks by lead ID:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  app2.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const taskData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const taskId = parseInt(req.params.id);
      const task = await storage.updateTask(userId, taskId, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const taskId = parseInt(req.params.id);
      const success = await storage.deleteTask(userId, taskId);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/tasks/from-chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const { chatContent, parsedTask } = req.body;
      if (!chatContent) {
        return res.status(400).json({ error: "Chat content is required" });
      }
      const task = await createTaskFromChat(userId, chatContent, parsedTask);
      if (!task) {
        return res.status(400).json({ error: "Failed to create task from chat" });
      }
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task from chat:", error);
      res.status(500).json({ error: error.message || "Failed to create task from chat" });
    }
  });
  app2.get("/api/emails/:threadId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const threadId = req.params.threadId;
      const tasks2 = await getTasksForEmailThread(userId, threadId);
      res.json(tasks2);
    } catch (error) {
      console.error("Error fetching tasks for email thread:", error);
      res.status(500).json({ error: error.message || "Failed to fetch tasks for email thread" });
    }
  });
  app2.post("/api/emails/:emailId/create-task", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const emailId = parseInt(req.params.emailId);
      const email = await storage.getEmailById(emailId);
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      const task = await createTaskFromEmail(
        userId,
        emailId,
        {
          subject: email.subject,
          body: email.body,
          from: email.from,
          date: email.date
        }
      );
      if (!task) {
        return res.status(400).json({ error: "Failed to create task from email" });
      }
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task from email:", error);
      res.status(500).json({ error: error.message || "Failed to create task from email" });
    }
  });
  app2.get("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    const events2 = await storage.getEventsByUserId(userId);
    res.json(events2);
  });
  app2.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const rawEventData = { ...req.body, userId };
      console.log("Received event data:", rawEventData);
      const eventData = insertEventSchema.parse(rawEventData);
      console.log("Parsed event data:", eventData);
      const event = await storage.createEvent(eventData);
      const services = await storage.getConnectedServicesByUserId(userId);
      const googleConnected = services.some((s) => s.service === "google" && s.connected);
      if (googleConnected) {
        try {
          const { syncEventToGoogleCalendar: syncEventToGoogleCalendar2 } = await Promise.resolve().then(() => (init_google_calendar(), google_calendar_exports));
          const synced = await syncEventToGoogleCalendar2(userId, event.id);
          if (synced) {
            console.log(`Event ${event.id} synced to Google Calendar for user ${userId}`);
          } else {
            console.log(`Failed to sync event ${event.id} to Google Calendar for user ${userId}`);
          }
        } catch (syncError) {
          console.error("Error syncing to Google Calendar:", syncError);
        }
      }
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error.message);
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/calendar/auto-detect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const preferences = user.preferences ? JSON.parse(user.preferences) : {};
      const originalPreference = preferences.autoScheduleMeetings || false;
      if (!originalPreference) {
        const updatedPreferences = {
          ...preferences,
          autoScheduleMeetings: true
        };
        await storage.updateUserPreferences(userId, updatedPreferences);
      }
      const suggestedEvents = await scanEmailsForMeetings(userId);
      const detectedEvents = [];
      for (let i = 0; i < suggestedEvents.length; i++) {
        const event = suggestedEvents[i];
        if (!event.userId) {
          console.error(`Missing userId for event, skipping...`);
          continue;
        }
        const currentTimeISO = (/* @__PURE__ */ new Date()).toISOString();
        const thirtyMinLaterISO = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
        const eventToInsert = {
          userId: event.userId,
          title: event.title || "Untitled Meeting",
          description: event.description || "",
          // Make sure dates are strings
          startTime: typeof event.startTime === "string" ? event.startTime : event.startTime instanceof Date ? event.startTime.toISOString() : currentTimeISO,
          endTime: typeof event.endTime === "string" ? event.endTime : event.endTime instanceof Date ? event.endTime.toISOString() : thirtyMinLaterISO,
          location: event.location || "",
          meetingUrl: event.meetingUrl || "",
          attendees: event.attendees || [],
          emailId: typeof event.emailId === "number" ? event.emailId : void 0,
          aiNotes: event.aiNotes || "",
          contextNotes: event.contextNotes || "",
          temporary: true,
          // Mark as temporary for confirmation
          aiConfidence: event.aiConfidence || 0
          // Provide default confidence
        };
        const createdEvent = await storage.createEvent(eventToInsert);
        detectedEvents.push(createdEvent);
      }
      if (!originalPreference) {
        const restoredPreferences = {
          ...preferences,
          autoScheduleMeetings: originalPreference
        };
        await storage.updateUserPreferences(userId, restoredPreferences);
      }
      res.json({
        eventsDetected: suggestedEvents.length,
        eventsCreated: detectedEvents,
        requiresConfirmation: true,
        // Indicate that these events need confirmation
        message: "Please review and confirm the detected meetings"
      });
    } catch (error) {
      console.error("Error in auto-detect meetings:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/calendar/confirm-meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const { meetingIds } = req.body;
      if (!Array.isArray(meetingIds) || meetingIds.length === 0) {
        return res.status(400).json({ error: "No meeting IDs provided" });
      }
      const services = await storage.getConnectedServicesByUserId(userId);
      const googleConnected = services.some((s) => s.service === "google" && s.connected);
      const confirmedEvents = [];
      for (const meetingId of meetingIds) {
        const event = await storage.getEvent(meetingId);
        if (!event) {
          continue;
        }
        if (event.userId !== userId) {
          continue;
        }
        if (!event.aiNotes) {
          try {
            const notes = await generateMeetingPrep(event);
            const updatedEvent = await storage.updateEvent(userId, meetingId, {
              aiNotes: notes.summary || "",
              contextNotes: notes.context || "",
              temporary: false
              // Mark as confirmed/permanent
            });
            confirmedEvents.push(updatedEvent);
          } catch (error) {
            console.error(`Error generating meeting notes for event ${meetingId}:`, error);
            confirmedEvents.push(event);
          }
        } else {
          if (event.temporary) {
            const updatedEvent = await storage.updateEvent(userId, meetingId, {
              temporary: false
            });
            confirmedEvents.push(updatedEvent);
          } else {
            confirmedEvents.push(event);
          }
        }
        if (googleConnected) {
          try {
            const { syncEventToGoogleCalendar: syncEventToGoogleCalendar2 } = await Promise.resolve().then(() => (init_google_calendar(), google_calendar_exports));
            const synced = await syncEventToGoogleCalendar2(userId, event.id);
            if (synced) {
              console.log(`Event ${event.id} synced to Google Calendar for user ${userId}`);
            } else {
              console.log(`Failed to sync event ${event.id} to Google Calendar for user ${userId}`);
            }
          } catch (syncError) {
            console.error(`Error syncing event ${event.id} to Google Calendar:`, syncError);
          }
        }
      }
      res.json({
        success: true,
        confirmedCount: confirmedEvents.length,
        events: confirmedEvents,
        googleCalendarSynced: googleConnected
      });
    } catch (error) {
      console.error("Error confirming meetings:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    const leadId = req.query.leadId ? parseInt(req.query.leadId) : void 0;
    if (leadId) {
      const invoices2 = await storage.getInvoicesByLeadId(userId, leadId);
      res.json(invoices2);
    } else {
      const invoices2 = await storage.getInvoicesByUserId(userId);
      res.json(invoices2);
    }
  });
  app2.get("/api/leads/:leadId/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    try {
      const invoices2 = await storage.getInvoicesByLeadId(userId, leadId);
      res.json(invoices2);
    } catch (error) {
      console.error("Error fetching invoices by lead ID:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });
  app2.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, userId });
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/invoices/generate-from-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { emailId } = req.body;
      const userId = req.user.id;
      const email = await storage.getEmail(emailId);
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      const analysis = await extractInvoiceRequestFromEmail(email);
      if (!analysis.isInvoiceRequest || !analysis.data) {
        return res.status(400).json({
          error: "Email doesn't contain a valid invoice request",
          confidence: analysis.confidence
        });
      }
      const userPreferences2 = req.user.preferences || {};
      const invoiceResult = await generateInvoice(analysis.data, {
        fullName: req.user.fullName,
        email: req.user.email,
        ...userPreferences2
      });
      const invoiceData = {
        userId,
        number: invoiceResult.invoiceNumber,
        client: analysis.data.clientName,
        amount: analysis.data.totalAmount,
        status: "pending",
        dueDate: new Date(analysis.data.dueDate),
        issueDate: /* @__PURE__ */ new Date(),
        items: invoiceResult.invoiceItems
      };
      const invoice = await storage.createInvoice(invoiceData);
      const emailReply = await generateInvoiceEmailReply(
        email,
        analysis.data,
        invoiceResult.invoiceNumber,
        {
          fullName: req.user.fullName,
          email: req.user.email,
          ...userPreferences2
        }
      );
      res.status(201).json({
        invoice,
        invoiceHtml: invoiceResult.invoiceHtml,
        emailReply
      });
    } catch (error) {
      console.error("Error generating invoice from email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/invoices/:id/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
      const { emailBody, recipient } = req.body;
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      const googleService = await storage.getConnectedService(userId, "google");
      if (!googleService || !googleService.connected) {
        return res.status(400).json({ error: "Google service not connected" });
      }
      const updatedInvoice = await storage.updateInvoice(userId, invoiceId, {
        status: "sent",
        lastEmailDate: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, invoice: updatedInvoice });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/invoices/:id/follow-up", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      if (invoice.status !== "sent" && invoice.status !== "overdue") {
        return res.status(400).json({ error: "Invoice must be in 'sent' or 'overdue' status to send a follow-up" });
      }
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : /* @__PURE__ */ new Date();
      const now = /* @__PURE__ */ new Date();
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
      if (daysPastDue <= 0) {
        return res.status(400).json({ error: "Invoice is not past due yet" });
      }
      const userPreferences2 = req.user.preferences || {};
      const invoiceData = {
        clientName: invoice.client,
        totalAmount: invoice.amount,
        currency: "USD",
        // Default to USD for now
        dueDate: dueDate.toISOString().split("T")[0]
      };
      const emailContent = await generateInvoiceFollowUpEmail(
        invoiceData,
        invoice.number,
        daysPastDue,
        {
          fullName: req.user.fullName,
          email: req.user.email,
          ...userPreferences2
        }
      );
      if (invoice.status !== "overdue") {
        await storage.updateInvoice(userId, invoiceId, {
          status: "overdue"
        });
      }
      res.json({
        emailContent,
        invoiceId,
        daysPastDue
      });
    } catch (error) {
      console.error("Error generating follow-up email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/invoices/:id/send-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
      const { recipientEmail } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      const { sendInvoiceEmail: sendInvoiceEmail2 } = await Promise.resolve().then(() => (init_email_sender(), email_sender_exports));
      const sentEmail = await sendInvoiceEmail2(req.user, invoice, recipientEmail);
      if (!sentEmail) {
        return res.status(500).json({ error: "Failed to send invoice email" });
      }
      await storage.updateInvoice(userId, invoiceId, {
        status: "sent",
        lastEmailDate: /* @__PURE__ */ new Date()
      });
      res.json({
        success: true,
        sentEmailId: sentEmail.id,
        message: `Invoice ${invoice.number} sent to ${recipientEmail}`
      });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/invoices/:id/send-reminder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user.id;
      const { recipientEmail } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      if (invoice.status !== "sent" && invoice.status !== "overdue") {
        return res.status(400).json({ error: "Invoice must be in 'sent' or 'overdue' status to send a reminder" });
      }
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : /* @__PURE__ */ new Date();
      const now = /* @__PURE__ */ new Date();
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
      const { sendPaymentReminder: sendPaymentReminder2 } = await Promise.resolve().then(() => (init_email_sender(), email_sender_exports));
      const sentEmail = await sendPaymentReminder2(req.user, invoice, recipientEmail);
      if (!sentEmail) {
        return res.status(500).json({ error: "Failed to send payment reminder" });
      }
      await storage.updateInvoice(userId, invoiceId, {
        status: "overdue",
        lastEmailDate: /* @__PURE__ */ new Date(),
        remindersSent: (invoice.remindersSent || 0) + 1,
        reminderDates: [...invoice.reminderDates || [], /* @__PURE__ */ new Date()]
      });
      res.json({
        success: true,
        sentEmailId: sentEmail.id,
        message: `Payment reminder for invoice ${invoice.number} sent to ${recipientEmail}`,
        reminderCount: (invoice.remindersSent || 0) + 1,
        daysPastDue
      });
    } catch (error) {
      console.error("Error sending payment reminder:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/invoices/auto-follow-up", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const { daysPastDue = 7 } = req.body;
      const allInvoices = await storage.getInvoicesByUserId(userId);
      const overdueInvoices = allInvoices.filter(
        (invoice) => (invoice.status === "sent" || invoice.status === "overdue") && invoice.dueDate && new Date(invoice.dueDate) < /* @__PURE__ */ new Date()
      );
      const results = [];
      for (const invoice of overdueInvoices) {
        if (invoice.lastEmailDate && (/* @__PURE__ */ new Date()).getTime() - new Date(invoice.lastEmailDate).getTime() < 3 * 24 * 60 * 60 * 1e3) {
          results.push({
            invoiceId: invoice.id,
            result: "skipped",
            reason: "Follow-up sent recently"
          });
          continue;
        }
        const daysPast = invoice.dueDate ? Math.ceil(((/* @__PURE__ */ new Date()).getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1e3)) : 0;
        if (daysPast < daysPastDue) {
          results.push({
            invoiceId: invoice.id,
            result: "skipped",
            reason: `Only ${daysPast} days past due, threshold is ${daysPastDue}`
          });
          continue;
        }
        try {
          const { generateInvoiceFollowUpEmail: generateInvoiceFollowUpEmail2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
          const invoiceData = {
            client: invoice.client,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            items: invoice.items
          };
          const followUpEmail = await generateInvoiceFollowUpEmail2(
            invoiceData,
            invoice.number,
            daysPast,
            {
              fullName: req.user.fullName,
              email: req.user.email,
              preferences: req.user.preferences
            }
          );
          const googleService = await storage.getConnectedService(userId, "google");
          if (!googleService || !googleService.connected) {
            results.push({
              invoiceId: invoice.id,
              result: "error",
              reason: "Google service not connected"
            });
            continue;
          }
          const { getGmailClient: getGmailClient2, sendEmail: sendEmail3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
          const gmail = await getGmailClient2(userId);
          if (!gmail) {
            results.push({
              invoiceId: invoice.id,
              result: "error",
              reason: "Gmail client unavailable"
            });
            continue;
          }
          await storage.updateInvoice(userId, invoice.id, {
            status: "overdue",
            lastEmailDate: /* @__PURE__ */ new Date()
          });
          results.push({
            invoiceId: invoice.id,
            result: "success",
            emailBody: followUpEmail
          });
        } catch (error) {
          results.push({
            invoiceId: invoice.id,
            result: "error",
            reason: error.message
          });
        }
      }
      res.json({ results });
    } catch (error) {
      console.error("Error sending automated follow-ups:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/expenses", async (req, res) => {
    console.log("GET /api/expenses - Authentication status:", req.isAuthenticated());
    if (!req.isAuthenticated()) {
      console.log("GET /api/expenses - User not authenticated, returning 401");
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    console.log(`GET /api/expenses - Fetching expenses for user ${userId}`);
    const expenses2 = await storage.getExpensesByUserId(userId);
    console.log(`GET /api/expenses - Found ${expenses2.length} expenses`);
    res.json(expenses2);
  });
  app2.get("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
    const expense = await storage.getExpense(expenseId);
    if (!expense) return res.status(404).send("Expense not found");
    if (expense.userId !== req.user.id) return res.sendStatus(403);
    res.json(expense);
  });
  app2.post("/api/receipts/upload", upload.single("receipt"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const downloadUrl = getPublicFileUrl(req.file.filename);
      console.log("File uploaded successfully:", {
        filename: req.file.filename,
        downloadUrl,
        path: req.file.path
      });
      res.status(201).json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        downloadUrl,
        message: "Receipt uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({
        error: "Error uploading receipt",
        message: error.message
      });
    }
  });
  app2.get("/api/receipts/download/:filename", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      downloadFile(req, res);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      res.status(500).json({
        error: "Error downloading receipt",
        message: error.message
      });
    }
  });
  app2.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId
      });
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).send("Error creating expense");
    }
  });
  app2.patch("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
    try {
      const userId = req.user.id;
      const updates = req.body;
      const updatedExpense = await storage.updateExpense(userId, expenseId, updates);
      if (!updatedExpense) {
        return res.status(404).send("Expense not found or not owned by user");
      }
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).send("Error updating expense");
    }
  });
  app2.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
    try {
      const userId = req.user.id;
      const success = await storage.deleteExpense(userId, expenseId);
      if (!success) {
        return res.status(404).send("Expense not found or not owned by user");
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).send("Error deleting expense");
    }
  });
  app2.get("/api/user-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user.id;
    let settings = await storage.getUserSettings(userId);
    if (!settings) {
      const defaultSettings = {
        userId,
        country: "US",
        defaultTaxRate: 0,
        defaultCurrency: "USD",
        fiscalYearStart: "01-01"
      };
      settings = await storage.createUserSettings(defaultSettings);
    }
    res.json(settings);
  });
  app2.patch("/api/user-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const updates = req.body;
      const updatedSettings = await storage.updateUserSettings(userId, updates);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).send("Error updating user settings");
    }
  });
  app2.use("/api/leads", leads_default);
  app2.use("/api/auth/google", google_auth_default);
  app2.use("/api/auth/google", google_diagnostic_default);
  app2.use("/api/db", db_diagnostic_default);
  app2.use("/api/domain-sync", domain_sync_check_default);
  app2.get("/api/activity-log", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const activities = await storage.getActivityLog(req.user.id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });
  app2.post("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.body.fullName || req.body.email) {
        await storage.updateUser(userId, {
          fullName: req.body.fullName || user.fullName,
          email: req.body.email || user.email
        });
      }
      if (req.body.preferences) {
        const updatedUser2 = await storage.updateUserPreferences(userId, req.body.preferences);
        return res.json(updatedUser2);
      }
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/user/connected-services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const services = await storage.getConnectedServicesByUserId(userId);
      const enhancedServices = services.map((service) => {
        if (service.service === "google") {
          return {
            ...service,
            connectionValid: !!service.credentials && service.connected,
            displayName: "Google (Gmail, Calendar)",
            icon: "google"
          };
        } else if (service.service === "stripe") {
          return {
            ...service,
            connectionValid: !!service.credentials && service.connected,
            displayName: "Stripe",
            icon: "stripe"
          };
        }
        return service;
      });
      res.json(enhancedServices);
    } catch (error) {
      console.error("Error fetching connected services:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/disconnect-service/:service", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const service = req.params.service.toLowerCase();
      await storage.updateConnectedService(userId, service, {
        connected: false,
        credentials: null
      });
      console.log(`Successfully disconnected ${service} for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error(`Error disconnecting service ${req.params.service}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/leads/auto-process", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      console.log(`Manual lead processing triggered for user ${userId}`);
      const result = await processLeadsForUser(userId);
      res.json({
        success: true,
        processed: result.processed,
        priorityUpdated: result.priorityUpdated,
        followUpSent: result.followUpSent,
        errors: result.errors
      });
    } catch (error) {
      console.error("Error in manual lead processing:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/connected-services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const services = await storage.getConnectedServicesByUserId(userId);
      let enhancedServices = [];
      for (const service of services) {
        if (service.service === "google") {
          let connectionValid = false;
          let username = "Not connected";
          if (service.credentials && service.connected) {
            try {
              const { getGmailClient: getGmailClient2 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
              const gmail = await getGmailClient2(userId);
              if (gmail) {
                try {
                  const profile = await gmail.users.getProfile({ userId: "me" });
                  if (profile.data && profile.data.emailAddress) {
                    connectionValid = true;
                    username = profile.data.emailAddress;
                    await storage.updateConnectedService(userId, "google", {
                      username: profile.data.emailAddress
                    });
                  }
                } catch (profileError) {
                  console.error(`Gmail API profile fetch error for user ${userId}:`, profileError);
                  connectionValid = false;
                }
              }
            } catch (googleError) {
              console.error(`Error testing Google connection for user ${userId}:`, googleError);
              connectionValid = false;
            }
          }
          enhancedServices.push({
            ...service,
            connectionValid,
            displayName: service.displayName || "Google (Gmail, Calendar)",
            username: service.username || username,
            icon: "google"
          });
        } else if (service.service === "stripe") {
          enhancedServices.push({
            ...service,
            connectionValid: !!service.credentials && service.connected,
            displayName: service.displayName || "Stripe",
            username: service.username || "Not connected",
            icon: "stripe"
          });
        } else {
          enhancedServices.push(service);
        }
      }
      res.json(enhancedServices);
    } catch (error) {
      console.error("Error fetching connected services:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/auth/google/url", (req, res) => {
    try {
      console.log("Generating Google auth URL for client");
      const origin = req.headers.origin;
      let dynamicRedirectUri = null;
      if (origin) {
        try {
          const originUrl = new URL(origin);
          dynamicRedirectUri = `${originUrl.origin}/api/auth/google/callback`;
          console.log(`Using dynamic callback URL from browser origin: ${dynamicRedirectUri}`);
          process.env.TEMP_CALLBACK_URL = dynamicRedirectUri;
        } catch (e) {
          console.error(`Failed to parse origin ${origin}:`, e);
        }
      }
      if (!dynamicRedirectUri) {
        console.log(`Using fixed callback URL from config: ${config_default.google.callbackUrl}`);
      }
      const authUrl = getGoogleAuthUrl();
      console.log("Generated auth URL");
      return res.json({ url: authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });
  app2.get("/api/auth/google", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized attempt to access Google auth URL");
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      console.log(`Generating Google auth URL for user ${req.user.id} (${req.user.username})`);
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment");
        return res.status(500).json({
          error: "Google integration is not properly configured. Please contact support."
        });
      }
      console.log(`Using fixed callback URL from config: ${config_default.google.callbackUrl}`);
      const authUrl = getGoogleAuthUrl();
      console.log(`Generated Google auth URL for user ${req.user.id}`);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({
        error: error.message,
        details: "There was an error setting up Google authentication"
      });
    }
  });
  app2.get("/api/auth/google/callback", async (req, res) => {
    try {
      console.log("=== GOOGLE OAUTH CALLBACK RECEIVED ===");
      console.log("Full request URL:", req.originalUrl);
      console.log("Query parameters:", JSON.stringify(req.query));
      if (req.headers.referer) {
        console.log("Referrer:", req.headers.referer);
      }
      const relevantHeaders = {
        host: req.headers.host,
        origin: req.headers.origin,
        "user-agent": req.headers["user-agent"]
      };
      console.log("Selected request headers:", JSON.stringify(relevantHeaders, null, 2));
      console.log("Request isAuthenticated:", req.isAuthenticated());
      if (req.isAuthenticated()) {
        console.log("User info:", {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email
        });
      }
      const { code, error, state } = req.query;
      console.log("Auth code received:", code ? "YES (length: " + code.toString().length + ")" : "NO");
      console.log("Error code:", error || "none");
      console.log("State parameter:", state || "none");
      if (error) {
        console.error(`Google returned an OAuth error: ${error}`);
        let errorMessage = `Google OAuth error: ${error}`;
        if (error === "access_denied") {
          errorMessage = "You declined to give permission to access your Google account.";
        } else if (error === "redirect_uri_mismatch") {
          errorMessage = "There is a configuration issue with the redirect URI. Please contact support.";
        } else if (error === "deleted_client" || error === "invalid_client") {
          errorMessage = "The Google OAuth client appears to be invalid or deleted. Please check your Google Cloud Console configuration.";
        }
        const referer = req.headers.referer || "";
        if (referer.includes("oauth-external-test.html") || req.query.from === "oauth-external-test") {
          console.log("Redirecting to oauth-external-test.html with error");
          return res.redirect(`/oauth-external-test.html?error=${encodeURIComponent(errorMessage)}`);
        } else if (referer.includes("google-connect.html")) {
          console.log("Redirecting to google-connect.html with error");
          return res.redirect(`/google-connect.html?error=${encodeURIComponent(errorMessage)}`);
        } else if (referer.includes("google-test")) {
          console.log("Redirecting to google-test page with error");
          return res.redirect(`/google-test?error=${encodeURIComponent(errorMessage)}`);
        }
        return res.redirect(`/settings?error=${encodeURIComponent(errorMessage)}`);
      }
      if (!code || typeof code !== "string") {
        console.error("No valid authorization code received from Google");
        const redirectURL = `/settings?error=${encodeURIComponent("Invalid or missing authorization code")}`;
        console.log("Redirecting to:", redirectURL);
        return res.redirect(redirectURL);
      }
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment variables:");
        console.error("GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID);
        console.error("GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
        return res.redirect("/settings?error=Google integration is not properly configured");
      }
      console.log("Attempting to exchange authorization code for tokens");
      try {
        console.log(`[Callback] Using fixed callback URL from config: ${config_default.google.callbackUrl}`);
        const tokens = await getTokensFromCode(code);
        console.log("Successfully exchanged code for tokens:", {
          access_token_prefix: tokens.access_token ? tokens.access_token.substring(0, 10) + "..." : "missing",
          has_refresh_token: !!tokens.refresh_token,
          expiry_date: tokens.expiry_date
        });
        console.log(`[Routes] Creating fresh OAuth client for token usage`);
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          console.error("CRITICAL ERROR: Missing Google OAuth credentials in callback handler");
          throw new Error("Google OAuth credentials not properly configured");
        }
        console.log(`[OAuth Debug] Using client ID in callback (starts with): ${clientId.substring(0, 6)}...`);
        const oauth2Client2 = new google4.auth.OAuth2(
          clientId,
          clientSecret,
          config_default.google.callbackUrl
        );
        oauth2Client2.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          token_type: "Bearer",
          scope: "email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly"
        });
        console.log(`[OAuth Debug] Access token prefix: ${tokens.access_token.substring(0, 10)}...`);
        const storedCredentials = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          token_type: "Bearer",
          scope: "email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly"
        };
        try {
          console.log("Getting user info from Google");
          const userInfo = await getUserInfo(oauth2Client2);
          console.log("Successfully retrieved user info for:", userInfo.email);
          const referer = req.headers.referer || "";
          const from = req.query.from || "";
          if (from === "simple-connect") {
            console.log("Request originated from simple-connect page");
            if (req.isAuthenticated()) {
              const userId = req.user.id;
              console.log(`User ${userId} is authenticated, saving Google connection`);
              await storage.updateConnectedService(userId, "google", {
                connected: true,
                username: userInfo.email,
                displayName: userInfo.name || userInfo.email,
                credentials: storedCredentials,
                lastUpdated: /* @__PURE__ */ new Date()
              });
              console.log("Google connection saved successfully from simple-connect page");
              return res.redirect("/google-connect-simple.html?success=true");
            } else {
              console.log("UNUSUAL: Got Google tokens from simple-connect but user is not authenticated");
              return res.redirect("/google-connect-simple.html?error=Not logged in. Please log in before connecting Google");
            }
          }
          if (referer.includes("oauth-external-test.html") || from === "oauth-external-test") {
            console.log("Request originated from oauth-external-test.html");
            if (req.isAuthenticated()) {
              const userId = req.user.id;
              console.log(`User ${userId} is authenticated, saving Google connection`);
              await storage.updateConnectedService(userId, "google", {
                connected: true,
                username: userInfo.email,
                displayName: userInfo.name || userInfo.email,
                credentials: storedCredentials,
                lastUpdated: /* @__PURE__ */ new Date()
              });
              console.log("Google connection saved successfully from external test page");
              return res.redirect("/oauth-external-test.html?success=true");
            } else {
              console.log("UNUSUAL: Got Google tokens but user is not authenticated");
              return res.redirect("/oauth-external-test.html?error=Not logged in. Please log in before connecting Google");
            }
          }
          if (referer.includes("google-connect.html")) {
            console.log("Request originated from standalone connect page");
            if (req.isAuthenticated()) {
              const userId = req.user.id;
              console.log(`User ${userId} is authenticated, saving Google connection`);
              await storage.updateConnectedService(userId, "google", {
                connected: true,
                username: userInfo.email,
                displayName: userInfo.name || userInfo.email,
                credentials: storedCredentials,
                lastUpdated: /* @__PURE__ */ new Date()
              });
              console.log("Google connection saved successfully from standalone page");
              return res.redirect("/google-connect.html?success=true");
            } else {
              console.log("UNUSUAL: Got Google tokens but user is not authenticated");
              return res.redirect("/google-connect.html?error=Not logged in. Please log in before connecting Google");
            }
          }
          if (req.isAuthenticated()) {
            const userId = req.user.id;
            console.log(`User ${userId} is authenticated, saving Google connection`);
            if (!req.user.email) {
              await storage.updateUser(userId, { email: userInfo.email });
            }
            await storage.updateConnectedService(userId, "google", {
              connected: true,
              username: userInfo.email,
              displayName: userInfo.name || userInfo.email,
              credentials: storedCredentials,
              lastUpdated: /* @__PURE__ */ new Date()
            });
            console.log("Google connection saved successfully");
            if (referer.includes("/google-test")) {
              console.log("Redirecting to google-test page with success message");
              return res.redirect("/google-test?success=google_connected");
            }
            console.log("Redirecting to settings page with success message");
            return res.redirect("/integrations?success=google_connected");
          } else {
            console.log("User not authenticated, redirecting to login");
            return res.redirect("/auth?error=Please log in first before connecting Google");
          }
        } catch (userInfoError) {
          console.error("Error getting user info from Google:", userInfoError);
          console.error("Error stack:", userInfoError.stack);
          return res.redirect(`/settings?error=${encodeURIComponent(`Error getting user info: ${userInfoError.message}`)}`);
        }
      } catch (tokenError) {
        console.error("Error exchanging code for tokens:", tokenError);
        console.error("Error details:", tokenError.stack);
        const referer = req.headers.referer || "";
        const from = req.query.from || "";
        if (referer.includes("oauth-external-test.html") || from === "oauth-external-test") {
          return res.redirect(`/oauth-external-test.html?error=${encodeURIComponent(`Error exchanging code for tokens: ${tokenError.message}`)}`);
        } else if (referer.includes("google-connect.html")) {
          return res.redirect(`/google-connect.html?error=${encodeURIComponent(`Error exchanging code for tokens: ${tokenError.message}`)}`);
        }
        return res.redirect(`/settings?error=${encodeURIComponent(`Error exchanging code for tokens: ${tokenError.message}`)}`);
      }
    } catch (error) {
      console.error("Unexpected error in Google auth callback:", error);
      console.error("Stack trace:", error.stack);
      const referer = req.headers.referer || "";
      const from = req.query.from || "";
      if (referer.includes("oauth-external-test.html") || from === "oauth-external-test") {
        return res.redirect(`/oauth-external-test.html?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
      } else if (referer.includes("google-connect.html")) {
        return res.redirect(`/google-connect.html?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
      } else if (referer.includes("google-test")) {
        return res.redirect(`/google-test?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
      }
      res.redirect(`/settings?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
    }
  });
  app2.post("/api/connected-services/:service", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const service = req.params.service;
      const connected = true;
      const credentials = req.body.credentials || {};
      const connectedService = await storage.updateConnectedService(userId, service, {
        connected,
        credentials
      });
      res.status(200).json(connectedService);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.post("/api/disconnect-service/:service", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const service = req.params.service.toLowerCase();
      if (!["google", "stripe"].includes(service)) {
        return res.status(400).json({ error: `Invalid service: ${service}` });
      }
      await storage.updateConnectedService(userId, service, {
        connected: false,
        credentials: null,
        username: null,
        displayName: null,
        lastUpdated: /* @__PURE__ */ new Date()
      });
      res.status(200).json({ success: true, message: `Successfully disconnected from ${service}` });
    } catch (error) {
      console.error(`Error disconnecting service:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/estimate-task-time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const taskDetails = req.body;
      if (!taskDetails.title) {
        return res.status(400).json({
          error: "Task title is required for time estimation"
        });
      }
      const estimation = await estimateTaskTime({
        title: taskDetails.title,
        description: taskDetails.description || void 0
      });
      res.json({
        estimatedTime: estimation.estimatedTime,
        confidence: estimation.confidence,
        reasoning: estimation.reasoning
      });
    } catch (error) {
      console.error("Error in /api/ai/estimate-task-time:", error);
      res.status(500).json({ error: error.message || "Failed to estimate task time" });
    }
  });
  app2.post("/api/ai/draft-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const emailContent = req.body.emailContent;
      const userPreferences2 = req.user?.preferences || {};
      const response = await generateEmailReply(emailContent, userPreferences2);
      res.json(response);
    } catch (error) {
      console.error("Error in /api/ai/draft-email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/client-id-check", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const maskedId = clientId ? `${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 5)}` : "Not set";
    res.json({
      clientId,
      maskedId,
      present: !!clientId
    });
  });
  app2.get("/api/oauth-diagnostics", async (req, res) => {
    try {
      const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        REPL_ID: process.env.REPL_ID,
        REPL_SLUG: process.env.REPL_SLUG,
        REPL_OWNER: process.env.REPL_OWNER,
        HOST: process.env.HOST,
        isReplit: !!(process.env.REPLIT_SLUG || process.env.REPL_ID || process.env.REPLIT_OWNER)
      };
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const knownRedirectURIs = [
        "https://binateai.replit.app/api/auth/google/callback",
        "https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev/api/auth/google/callback"
      ];
      const currentCallbackUrl = config_default.google.callbackUrl;
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "";
      const dynamicCallbackUrl = `${protocol}://${host}/api/auth/google/callback`;
      const standardAuthUrl = getGoogleAuthUrl();
      const standardUrlObj = new URL(standardAuthUrl);
      const standardClientId = standardUrlObj.searchParams.get("client_id");
      const standardRedirectUri = standardUrlObj.searchParams.get("redirect_uri");
      process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
      const dynamicAuthUrl = getGoogleAuthUrl();
      delete process.env.TEMP_CALLBACK_URL;
      const dynamicUrlObj = new URL(dynamicAuthUrl);
      const dynamicClientId = dynamicUrlObj.searchParams.get("client_id");
      const dynamicRedirectUri = dynamicUrlObj.searchParams.get("redirect_uri");
      const dynamicUriMatches = knownRedirectURIs.some(
        (uri) => uri.toLowerCase() === dynamicRedirectUri.toLowerCase()
      );
      res.json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: envInfo,
        credentials: {
          clientIdPresent: !!clientId,
          clientIdPrefix: clientId ? clientId.substring(0, 10) + "..." : "Not set",
          clientSecretPresent: !!clientSecret
        },
        redirectUris: {
          configured: currentCallbackUrl,
          dynamic: dynamicCallbackUrl,
          known: knownRedirectURIs,
          dynamicUriKnown: dynamicUriMatches
        },
        authUrls: {
          standard: {
            clientId: standardClientId,
            redirectUri: standardRedirectUri,
            matchesEnv: standardClientId === clientId,
            redirectMatches: standardRedirectUri === currentCallbackUrl
          },
          dynamic: {
            clientId: dynamicClientId,
            redirectUri: dynamicRedirectUri,
            matchesEnv: dynamicClientId === clientId,
            redirectMatches: dynamicRedirectUri === dynamicCallbackUrl
          }
        },
        requestInfo: {
          headers: {
            host: req.headers.host,
            origin: req.headers.origin,
            referer: req.headers.referer,
            "x-forwarded-proto": req.headers["x-forwarded-proto"],
            "x-forwarded-host": req.headers["x-forwarded-host"]
          },
          url: req.originalUrl
        }
      });
    } catch (error) {
      console.error("Error in OAuth diagnostics:", error);
      res.status(500).json({
        error: "Failed to generate OAuth diagnostics",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.post("/api/debug/token-exchange", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({
          success: false,
          error: "Authorization code is required"
        });
      }
      console.log(`[Debug] Attempting token exchange with code: ${code.substring(0, 10)}...`);
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "";
      const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;
      console.log(`[Debug] Using callback URL: ${callbackUrl}`);
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({
          success: false,
          error: "Missing OAuth credentials"
        });
      }
      console.log(`[Debug] Using client ID: ${clientId.substring(0, 10)}...`);
      process.env.TEMP_CALLBACK_URL = callbackUrl;
      try {
        const tokens = await getTokensFromCode(code);
        delete process.env.TEMP_CALLBACK_URL;
        res.json({
          success: true,
          access_token: tokens.access_token,
          refresh_token: !!tokens.refresh_token,
          expiry_date: tokens.expiry_date
        });
      } catch (exchangeError) {
        delete process.env.TEMP_CALLBACK_URL;
        console.error("[Debug] Token exchange error:", exchangeError);
        res.status(400).json({
          success: false,
          error: exchangeError.message || "Failed to exchange code for tokens",
          details: exchangeError.stack
        });
      }
    } catch (error) {
      console.error("[Debug] Unexpected error in token exchange endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  });
  app2.post("/api/debug/test-token", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Access token is required"
        });
      }
      console.log(`[Debug] Testing token: ${token.substring(0, 10)}...`);
      const oauth2Client2 = new google4.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client2.setCredentials({
        access_token: token
      });
      try {
        console.log("[Debug] Making API request to get user info...");
        const oauth2 = google4.oauth2({
          auth: oauth2Client2,
          version: "v2"
        });
        const userInfo = await oauth2.userinfo.get();
        if (!userInfo.data) {
          throw new Error("No user data returned");
        }
        console.log("[Debug] Successfully retrieved user info");
        res.json({
          success: true,
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture
        });
      } catch (apiError) {
        console.error("[Debug] API error:", apiError);
        res.status(400).json({
          success: false,
          error: "API request failed",
          details: apiError.message,
          code: apiError.code,
          status: apiError.status
        });
      }
    } catch (error) {
      console.error("[Debug] Unexpected error in test token endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  });
  app2.post("/api/ai/summarize-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const emailBody = req.body.body || "";
      const summary = await summarizeEmail(emailBody);
      res.json({ summary });
    } catch (error) {
      console.error("Error in /api/ai/summarize-email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/meeting-prep", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const eventId = req.body.eventId;
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const eventDetails = {
        title: event.title,
        date: new Date(event.startTime).toLocaleDateString(),
        time: new Date(event.startTime).toLocaleTimeString(),
        attendees: event.attendees || [],
        description: event.description || ""
      };
      const response = await generateMeetingPrep(eventDetails);
      res.json(response);
    } catch (error) {
      console.error("Error in /api/ai/meeting-prep:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/generate-task", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const context = req.body;
      const taskData = await generateTask(context);
      const userId = req.user.id;
      const task = await storage.createTask({
        userId,
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        priority: taskData.priority || "medium",
        assignedTo: taskData.assignedTo || "me",
        // Use the AI-assigned value or default to "me"
        aiGenerated: true,
        completed: false,
        estimatedTime: taskData.estimatedTime || 30
        // Store the estimated time
      });
      res.status(201).json(task);
    } catch (error) {
      console.error("Error in /api/ai/generate-task:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/query", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { query, history } = req.body;
      const userPreferences2 = req.user?.preferences || {};
      const response = await handleAssistantQuery(query, history, userPreferences2);
      res.json({ response });
    } catch (error) {
      console.error("Error in /api/ai/query:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/ai/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const chats = await storage.getAIChatsByUserId(userId);
      const sortedChats = chats.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const dateA = a.updatedAt ? new Date(a.updatedAt) : /* @__PURE__ */ new Date();
        const dateB = b.updatedAt ? new Date(b.updatedAt) : /* @__PURE__ */ new Date();
        return dateB.getTime() - dateA.getTime();
      });
      res.json(sortedChats);
    } catch (error) {
      console.error("Error in /api/ai/chats:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const chatData = insertAIChatSchema.parse({ ...req.body, userId });
      const chat = await storage.createAIChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error in creating chat:", error);
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/ai/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getAIChat(chatId);
      if (!chat || chat.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error in /api/ai/chats/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.patch("/api/ai/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const chatId = parseInt(req.params.id);
      const updates = req.body;
      const updatedChat = await storage.updateAIChat(userId, chatId, updates);
      if (!updatedChat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(updatedChat);
    } catch (error) {
      console.error("Error in updating chat:", error);
      res.status(400).json({ error: error.message });
    }
  });
  app2.delete("/api/ai/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const chatId = parseInt(req.params.id);
      const success = await storage.deleteAIChat(userId, chatId);
      if (!success) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error in deleting chat:", error);
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/ai/chats/:chatId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const chatId = parseInt(req.params.chatId);
      const chat = await storage.getAIChat(chatId);
      if (!chat || chat.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat not found" });
      }
      const messages = await storage.getAIMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error in /api/ai/chats/:chatId/messages:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/chats/:chatId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const chatId = parseInt(req.params.chatId);
      const chat = await storage.getAIChat(chatId);
      if (!chat || chat.userId !== req.user.id) {
        return res.status(404).json({ error: "Chat not found" });
      }
      const messageData = insertAIMessageSchema.parse({
        ...req.body,
        chatId
      });
      const message = await storage.createAIMessage(messageData);
      if (message.role === "user") {
        try {
          const chatHistory = await storage.getAIMessagesByChatId(chatId);
          const response = await handleAssistantQuery(
            message.content,
            chatHistory,
            req.user?.preferences || {}
          );
          const aiMessage = await storage.createAIMessage({
            chatId,
            role: "assistant",
            content: response
          });
          res.status(201).json({
            userMessage: message,
            aiResponse: aiMessage
          });
        } catch (aiError) {
          console.error("Error generating AI response:", aiError);
          res.status(201).json({
            userMessage: message,
            aiError: aiError.message
          });
        }
      } else {
        res.status(201).json(message);
      }
    } catch (error) {
      console.error("Error in chat message creation:", error);
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/emails", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      console.log(`Email request for user ${userId}`);
      const unreadOnly = req.query.unreadOnly === "true";
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const googleService = await storage.getConnectedService(userId, "google");
      const isGoogleConnected = googleService && googleService.connected && googleService.credentials;
      console.log(`Google connection status for user ${userId}: ${isGoogleConnected ? "Connected" : "Not connected"}`);
      if (req.query.fetch === "true") {
        if (isGoogleConnected) {
          try {
            console.log(`Fetching new emails from Gmail for user ${userId}`);
            const { getGmailClient: getGmailClient2, fetchEmails: fetchEmails3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
            const gmail = await getGmailClient2(userId);
            if (gmail) {
              console.log(`Gmail client obtained for user ${userId}, fetching emails...`);
              const fetchedEmails = await fetchEmails3(userId, limit);
              console.log(`Fetched ${fetchedEmails.length} emails from Gmail for user ${userId}`);
              return res.json(fetchedEmails);
            } else {
              console.log(`Failed to get Gmail client for user ${userId} despite having credentials`);
              await storage.updateConnectedService(userId, "google", {
                connected: false,
                lastError: "Failed to get Gmail client despite having credentials"
              });
            }
          } catch (fetchError) {
            console.error(`Error fetching emails from Gmail for user ${userId}:`, fetchError);
          }
        } else {
          console.log(`Cannot fetch from Gmail for user ${userId} because Google is not connected`);
        }
      }
      console.log(`Getting emails from storage for user ${userId}`);
      const emails3 = await storage.getEmailsByUserId(userId, { unreadOnly, limit });
      console.log(`Found ${emails3.length} emails in storage for user ${userId}`);
      return res.json(emails3);
    } catch (error) {
      console.error("Error in /api/emails:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/emails/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const emailId = parseInt(req.params.id);
      const email = await storage.getEmail(emailId);
      if (!email || email.userId !== req.user.id) {
        return res.status(404).json({ error: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      console.error("Error in /api/emails/:id:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/emails/:id/analyze", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const emailIdParam = req.params.id;
      let emailIdOrMessageId;
      if (/^\d+$/.test(emailIdParam) && emailIdParam.length < 10) {
        emailIdOrMessageId = parseInt(emailIdParam);
      } else {
        emailIdOrMessageId = emailIdParam;
      }
      console.log(`Analyzing email with ID/messageId: ${emailIdOrMessageId}`);
      const analysis = await analyzeEmail(userId, emailIdOrMessageId);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing email:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/emails/:id/reply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const emailIdParam = req.params.id;
      let email;
      if (/^\d+$/.test(emailIdParam) && emailIdParam.length < 10) {
        email = await storage.getEmail(parseInt(emailIdParam));
      } else {
        email = await storage.getEmailByMessageId(userId, emailIdParam);
      }
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      const replyContent = req.body.content;
      if (!replyContent) {
        return res.status(400).json({ error: "Reply content is required" });
      }
      const success = await sendReply(userId, email.messageId, replyContent);
      if (success) {
        res.json({ success: true, message: "Reply sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send reply" });
      }
    } catch (error) {
      console.error("Error in /api/emails/:id/reply:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/emails/:id/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const emailIdParam = req.params.id;
      let email;
      if (/^\d+$/.test(emailIdParam) && emailIdParam.length < 10) {
        email = await storage.getEmail(parseInt(emailIdParam));
      } else {
        email = await storage.getEmailByMessageId(userId, emailIdParam);
      }
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      console.log(`Marking email as read, messageId: ${email.messageId}`);
      const success = await markAsRead(userId, email.messageId);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to mark email as read" });
      }
    } catch (error) {
      console.error("Error in /api/emails/:id/mark-read:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/emails/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const { to, subject, message } = req.body;
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "To, subject, and message are required" });
      }
      const { sendEmail: sendEmail3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
      const success = await sendEmail3(userId, to, subject, message);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error in /api/emails/send:", error);
      if (error.message && error.message.includes("Google account not connected")) {
        return res.status(403).json({
          error: error.message,
          action: "connect_google"
        });
      }
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/emails/auto-process", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const result = await autoProcessEmails(userId);
      res.json(result);
    } catch (error) {
      console.error("Error in /api/emails/auto-process:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/pending-email-replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const pendingReplies = await storage.getPendingEmailReplies(userId);
      res.json(pendingReplies);
    } catch (error) {
      console.error("Error getting pending email replies:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/pending-email-replies/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      if (!pendingReply) {
        return res.status(404).json({ error: "Pending email reply not found" });
      }
      if (pendingReply.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this pending reply" });
      }
      res.json(pendingReply);
    } catch (error) {
      console.error("Error getting pending email reply:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/pending-email-replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const { to, ...otherFields } = req.body;
      const pendingReplyData = {
        ...otherFields,
        userId,
        recipient: req.body.recipient || req.body.to,
        // Use recipient if available, otherwise use to
        status: "pending"
        // Force status to be 'pending' for new entries
      };
      const pendingReply = await storage.createPendingEmailReply(pendingReplyData);
      res.json(pendingReply);
    } catch (error) {
      console.error("Error creating pending email reply:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/pending-email-replies/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      if (!pendingReply) {
        return res.status(404).json({ error: "Pending email reply not found" });
      }
      if (pendingReply.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to approve this pending reply" });
      }
      const updatedReply = await storage.updatePendingEmailReply(pendingReplyId, {
        status: "approved",
        actionTaken: "approved",
        actionDate: /* @__PURE__ */ new Date()
      });
      res.json(updatedReply);
    } catch (error) {
      console.error("Error approving pending email reply:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/pending-email-replies/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      if (!pendingReply) {
        return res.status(404).json({ error: "Pending email reply not found" });
      }
      if (pendingReply.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to reject this pending reply" });
      }
      const updatedReply = await storage.updatePendingEmailReply(pendingReplyId, {
        status: "rejected",
        actionTaken: "rejected",
        actionDate: /* @__PURE__ */ new Date()
      });
      res.json(updatedReply);
    } catch (error) {
      console.error("Error rejecting pending email reply:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/pending-email-replies/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      if (!pendingReply) {
        return res.status(404).json({ error: "Pending email reply not found" });
      }
      if (pendingReply.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this pending reply" });
      }
      const result = await storage.deletePendingEmailReply(pendingReplyId);
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting pending email reply:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user.id;
      const tasks2 = await storage.getTasksByUserId(userId);
      const events2 = await storage.getEventsByUserId(userId);
      const invoices2 = await storage.getInvoicesByUserId(userId);
      let unreadEmails = 0;
      try {
        try {
          const emails3 = await storage.getEmailsByUserId(userId, { unreadOnly: true });
          unreadEmails = emails3.length;
        } catch (emailError) {
          console.error("Error getting unread emails count:", emailError);
          const emails3 = Array.from(storage.getEmails().values()).filter((email) => email.userId === userId && !email.isRead);
          unreadEmails = emails3.length;
        }
      } catch (fallbackError) {
        console.error("Error with fallback email count:", fallbackError);
      }
      const pendingTasks = tasks2.filter((task) => !task.completed).length;
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEvents = events2.filter((event) => {
        const eventDate = new Date(event.startTime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      }).length;
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingEvents = events2.filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate.getTime() > Date.now() && eventDate.getTime() < nextWeek.getTime();
      }).length;
      const unpaidInvoices = invoices2.filter((invoice) => invoice.status === "pending").reduce((sum, invoice) => sum + invoice.amount, 0);
      res.json({
        unreadEmails,
        todayMeetings: todayEvents,
        upcomingMeetings: upcomingEvents,
        pendingTasks,
        unpaidInvoices
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const setupScheduledTasks = () => {
    Object.values(scheduledTasks).forEach((timeout) => clearTimeout(timeout));
    const runAutoEmailProcessing = async () => {
      try {
        console.log("Running automated email processing...");
        const users2 = await storage.getAllUsers();
        let emailsProcessed = 0;
        let leadsDetected = 0;
        let invoicesCreated = 0;
        for (const user of users2) {
          try {
            const googleService = await storage.getConnectedService(user.id, "google");
            if (!googleService || !googleService.connected) {
              continue;
            }
            console.log(`Processing emails for user ${user.id}`);
            console.log(`Email processing COMPLETELY DISABLED for user ${user.id} - preventing further API charges`);
            const result = { processed: 0, leadsDetected: 0, invoicesCreated: 0 };
            emailsProcessed += result.processed;
            leadsDetected += result.leadsDetected;
            invoicesCreated += result.invoicesCreated;
          } catch (userError) {
            console.error(`Error processing emails for user ${user.id}:`, userError);
          }
        }
        console.log(`Automated email processing completed:
        - Emails processed: ${emailsProcessed}
        - Leads detected: ${leadsDetected}
        - Invoices created: ${invoicesCreated}`);
      } catch (error) {
        console.error("Error in automated email processing:", error);
      }
      scheduledTasks.emailProcessing = setTimeout(runAutoEmailProcessing, 15 * 60 * 1e3);
    };
    const runAutoInvoiceFollowups = async () => {
      try {
        console.log("Running automated invoice follow-ups...");
        const { checkOverdueInvoices: checkOverdueInvoices2 } = await Promise.resolve().then(() => (init_invoice_management(), invoice_management_exports));
        const users2 = await storage.getAllUsers();
        let totalProcessed = 0;
        let emailNotificationsPending = 0;
        for (const user of users2) {
          try {
            const overdueInvoices = await checkOverdueInvoices2(user.id, false);
            if (overdueInvoices.length > 0) {
              emailNotificationsPending += overdueInvoices.length;
            }
            if (overdueInvoices.length === 0) continue;
            console.log(`Processing ${overdueInvoices.length} overdue invoices for user ${user.id}`);
            for (const invoice of overdueInvoices) {
              if (invoice.lastEmailDate && (/* @__PURE__ */ new Date()).getTime() - new Date(invoice.lastEmailDate).getTime() < 3 * 24 * 60 * 60 * 1e3) {
                continue;
              }
              const daysPast = invoice.dueDate ? Math.ceil(((/* @__PURE__ */ new Date()).getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1e3)) : 0;
              if (daysPast < 7) continue;
              try {
                const { generateInvoiceFollowUpEmail: generateInvoiceFollowUpEmail2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
                const invoiceData = {
                  clientName: invoice.client,
                  totalAmount: invoice.amount,
                  currency: "USD",
                  // Default to USD for now
                  dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split("T")[0] : ""
                };
                const followUpEmail = await generateInvoiceFollowUpEmail2(
                  invoiceData,
                  invoice.number,
                  daysPast,
                  {
                    fullName: user.fullName,
                    email: user.email,
                    preferences: user.preferences
                  }
                );
                const googleService = await storage.getConnectedService(user.id, "google");
                if (!googleService || !googleService.connected) {
                  continue;
                }
                const { sendPaymentReminder: sendPaymentReminder2 } = await Promise.resolve().then(() => (init_email_sender(), email_sender_exports));
                let recipientEmail = "";
                if (invoice.leadId) {
                  const lead = await storage.getLead(invoice.leadId);
                  if (lead && lead.email) {
                    recipientEmail = lead.email;
                  }
                }
                if (!recipientEmail) {
                  const emailMatch = invoice.client.match(/<([^>]+)>/);
                  recipientEmail = emailMatch ? emailMatch[1] : `${invoice.client.replace(/\s+/g, ".").toLowerCase()}@example.com`;
                }
                console.log(`PAYMENT EMAIL REMINDERS DISABLED - Not sending to ${recipientEmail}`);
                await storage.updateInvoice(invoice.id, {
                  ...invoice,
                  status: "overdue",
                  lastEmailDate: /* @__PURE__ */ new Date(),
                  remindersSent: (invoice.remindersSent || 0) + 1,
                  reminderDates: [...invoice.reminderDates || [], /* @__PURE__ */ new Date()]
                });
                console.log(`Updated invoice ${invoice.number} status (NO EMAIL SENT)`);
                totalProcessed++;
              } catch (error) {
                console.error(`Error processing invoice ${invoice.id}:`, error);
              }
            }
          } catch (userError) {
            console.error(`Error processing invoices for user ${user.id}:`, userError);
          }
        }
        console.log(`Automated invoice follow-ups completed:
        - Email reminders processed: ${totalProcessed} invoices
        - Email notifications prepared: ${emailNotificationsPending} invoices`);
      } catch (error) {
        console.error("Error in automated invoice follow-ups:", error);
      }
      scheduledTasks.invoiceFollowUps = setTimeout(runAutoInvoiceFollowups, 24 * 60 * 60 * 1e3);
    };
    const runAutoLeadManagement = async () => {
      try {
        console.log("Running automated lead processing...");
        const result = await processLeadsForAllUsers();
        console.log(`Automated lead processing completed:
        - Users processed: ${result.usersProcessed}
        - Leads processed: ${result.leadsProcessed}
        - Priority updates: ${result.priorityUpdates}
        - Follow-ups sent: ${result.followUpsSent}
        - Errors: ${result.errors}`);
      } catch (error) {
        console.error("Error in automated lead processing:", error);
      }
      scheduledTasks.leadManagement = setTimeout(runAutoLeadManagement, 24 * 60 * 60 * 1e3);
    };
    const runAutoCalendarService = async () => {
      try {
        console.log("Running automated calendar management...");
        await runAutoCalendarManagement();
        console.log("Automated calendar management completed.");
      } catch (error) {
        console.error("Error in automated calendar management:", error);
      }
      scheduledTasks.calendarManagement = setTimeout(runAutoCalendarService, 60 * 60 * 1e3);
    };
    setTimeout(() => {
      runAutoEmailProcessing();
      runAutoInvoiceFollowups();
      runAutoCalendarService();
      setTimeout(runAutoLeadManagement, 12e4);
    }, 6e4);
  };
  setupScheduledTasks();
  const {
    initAutonomousEngine: initAutonomousEngine2,
    stopAutonomousEngine: stopAutonomousEngine2,
    runAllProcessesNow: runAllProcessesNow2,
    getEngineStatus: getEngineStatus2,
    setEngineInterval: setEngineInterval2
  } = await Promise.resolve().then(() => (init_autonomous_engine(), autonomous_engine_exports));
  app2.get("/api/autonomous-engine/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ error: "Only admin can access engine status" });
    }
    try {
      const status = getEngineStatus2();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/autonomous-engine/start", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ error: "Only admin can start the engine" });
    }
    try {
      initAutonomousEngine2();
      const status = getEngineStatus2();
      res.json({
        message: "Autonomous engine started successfully",
        status
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/autonomous-engine/stop", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ error: "Only admin can stop the engine" });
    }
    try {
      stopAutonomousEngine2();
      const status = getEngineStatus2();
      res.json({
        message: "Autonomous engine stopped successfully",
        status
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/autonomous-engine/run-now", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ error: "Only admin can trigger the engine manually" });
    }
    try {
      const result = await runAllProcessesNow2();
      res.json({
        message: "Autonomous engine processes triggered successfully",
        result
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/autonomous-engine/interval", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== 1) {
      return res.status(403).json({ error: "Only admin can change engine interval" });
    }
    try {
      const { minutes } = req.body;
      if (!minutes || typeof minutes !== "number" || minutes < 1) {
        return res.status(400).json({ error: "Valid minutes parameter is required" });
      }
      const status = setEngineInterval2(minutes);
      res.json({
        message: `Autonomous engine interval set to ${minutes} minutes`,
        status
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/user/autonomous-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    try {
      const userId = req.user.id;
      const { settings } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const currentPreferences = user.preferences ? typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences : {};
      const updatedPreferences = {
        ...currentPreferences,
        ...settings
      };
      await storage.updateUserPreferences(userId, updatedPreferences);
      res.json({
        message: "Autonomous settings updated successfully",
        preferences: updatedPreferences
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/beta-signup", async (req, res) => {
    try {
      console.log("=== BETA SIGNUP REQUEST DEBUG ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Request headers:", req.headers);
      console.log("Request IP:", req.ip);
      console.log("================================");
      const signupData = insertBetaSignupSchema.parse(req.body);
      console.log("Parsed signup data:", signupData);
      console.log("Checking for existing signup with email:", signupData.email);
      const existingSignup = await storage.getBetaSignupByEmail(signupData.email);
      console.log("Existing signup found:", existingSignup);
      if (existingSignup) {
        console.log("Duplicate email detected, returning 409");
        return res.status(409).json({
          message: "You're already on our waitlist! We'll be in touch soon.",
          duplicate: true
        });
      }
      if (!signupData.ipAddress) {
        signupData.ipAddress = req.ip;
      }
      if (!signupData.referrer && req.headers.referer) {
        signupData.referrer = req.headers.referer;
      }
      console.log("Final signup data to insert:", signupData);
      console.log("Attempting to create beta signup in database...");
      const betaSignup = await storage.createBetaSignup(signupData);
      console.log("Beta signup created successfully:", betaSignup);
      res.status(201).json({
        message: "Thanks for signing up! We'll be in touch soon.",
        success: true
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid signup data",
          details: error.errors
        });
      }
      console.error("Beta signup error:", error);
      res.status(500).json({ error: "Failed to process signup" });
    }
  });
  app2.get("/api/beta-signups", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    try {
      const signups = await storage.getBetaSignups();
      res.json(signups);
    } catch (error) {
      console.error("Error fetching beta signups:", error);
      res.status(500).json({ error: "Failed to fetch beta signups" });
    }
  });
  app2.get("/api/autonomous/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    try {
      const status = getEngineStatus2();
      res.json(status);
    } catch (error) {
      console.error("Error fetching autonomous engine status:", error);
      res.status(500).json({ error: "Failed to fetch engine status" });
    }
  });
  app2.post("/api/autonomous/run-now", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    try {
      const result = await runAllProcessesNow2();
      res.json(result);
    } catch (error) {
      console.error("Error running autonomous processes:", error);
      res.status(500).json({ error: "Failed to run autonomous processes" });
    }
  });
  app2.post("/api/autonomous/set-interval", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    try {
      const { minutes } = req.body;
      if (!minutes || typeof minutes !== "number" || minutes < 5 || minutes > 120) {
        return res.status(400).json({ error: "Interval must be between 5 and 120 minutes" });
      }
      const status = setEngineInterval2(minutes);
      res.json(status);
    } catch (error) {
      console.error("Error setting autonomous engine interval:", error);
      res.status(500).json({ error: "Failed to set engine interval" });
    }
  });
  console.log(`NOTIFICATION SYSTEM DISABLED: Autonomous engine will not be initialized to prevent excessive notifications`);
  app2.use("/api/integrations/slack", slack_routes_default);
  app2.use("/api/slack-test", slack_test_routes_default);
  app2.use("/api/clients", clients_default);
  app2.get("/api/auth/microsoft/direct-auth", (req, res) => {
    console.log("Microsoft direct-auth route accessed");
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userId = req.user?.id;
    console.log(`User ${userId} accessing Microsoft direct-auth route`);
    const redirectUri = `${config_default.baseUrl}/api/auth/microsoft/callback`;
    console.log(`Using redirect URI: ${redirectUri}`);
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=3e9d9152-c120-4a5c-9bc4-8c6aaca4a3e9&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=offline_access%20User.Read%20Mail.Read%20Mail.ReadWrite%20Mail.Send%20Calendars.Read%20Calendars.ReadWrite&state=${userId}`;
    res.redirect(authUrl);
  });
  app2.use("/api/auth/microsoft", microsoft_routes_default);
  if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET && process.env.SLACK_SIGNING_SECRET) {
    console.log("Slack integration is enabled");
  } else {
    console.warn("Slack integration is disabled due to missing environment variables");
  }
  app2.use("/api/notifications", notifications_default);
  setTimeout(() => {
    console.log("Starting scheduled notification system with daily digests at 7am, 12pm, and 5pm");
    try {
      Promise.resolve().then(() => (init_notification_scheduler(), notification_scheduler_exports)).then((scheduler) => {
        scheduler.startNotificationScheduler();
      });
      console.log("Notification system started successfully");
    } catch (error) {
      console.error("Error starting notification system:", error);
    }
  }, 1e4);
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
    console.log("Slack credentials available but Slack integration temporarily disabled");
  }
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
init_notification_scheduler();
import path4 from "path";
import dotenv from "dotenv";
import cors from "cors";
import fs3 from "fs";
dotenv.config({ override: true });
console.log("\n===== DOTENV LOADED VARIABLES =====");
console.log("FORCE_PRODUCTION_DOMAIN:", process.env.FORCE_PRODUCTION_DOMAIN);
console.log("DISABLE_DOMAIN_OVERRIDE:", process.env.DISABLE_DOMAIN_OVERRIDE);
console.log("CUSTOM_DOMAIN:", process.env.CUSTOM_DOMAIN);
console.log("BASE_URL:", process.env.BASE_URL);
console.log("==================================\n");
console.log("\n===== ENVIRONMENT VARIABLES =====");
console.log("FORCE_PRODUCTION_DOMAIN:", process.env.FORCE_PRODUCTION_DOMAIN || "Not set");
console.log("DISABLE_DOMAIN_OVERRIDE:", process.env.DISABLE_DOMAIN_OVERRIDE || "Not set");
console.log("================================\n");
console.log("\n===== CUSTOM DOMAIN CONFIGURATION =====");
console.log("CUSTOM_DOMAIN:", process.env.CUSTOM_DOMAIN || "Not set");
console.log("BASE_URL:", process.env.BASE_URL || "Not set");
console.log("========================================\n");
console.log("====== REPLIT ENVIRONMENT DEBUG ======");
console.log("REPL_ID:", process.env.REPL_ID);
console.log("REPL_SLUG:", process.env.REPL_SLUG);
console.log("REPL_OWNER:", process.env.REPL_OWNER);
console.log("HOST:", process.env.HOST);
console.log("====================================");
var app = express7();
var corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes(".replit.dev") || origin.includes(".replit.app") || origin.includes(".repl.co") || origin.includes("kirk.replit.dev")) {
      console.log(`CORS: Allowing Replit domain: ${origin}`);
      return callback(null, true);
    }
    const allowedOrigins = [
      "https://binateai.com",
      "https://www.binateai.com",
      "https://binateai.replit.app",
      "https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev",
      "https://004cd0fb-c62b-41f4-9092-516b03c6788b.id.repl.co",
      "https://004cd0fb-c62b-41f4-9092-516b03c6788b.repl.co",
      "http://localhost:5000",
      "http://localhost:3000"
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`CORS blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  // Allow cookies to be sent with requests
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400
  // Cache preflight response for 24 hours
};
console.log("\n===== CORS CONFIGURATION =====");
console.log("Allowed Origins: Dynamic CORS with allow list including binateai.com domains and all Replit preview domains");
console.log("Credentials Allowed:", corsOptions.credentials);
console.log("Methods Allowed:", corsOptions.methods);
console.log("Headers Allowed:", corsOptions.allowedHeaders);
console.log("==============================\n");
app.use(cors(corsOptions));
app.use(express7.json());
app.use(express7.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const host = req.header("host");
  if (host && host.startsWith("www.binateai.com")) {
    const protocol = req.header("x-forwarded-proto") || "https";
    const redirectUrl = `${protocol}://binateai.com${req.url}`;
    console.log(`Redirecting from ${host} to binateai.com`);
    return res.redirect(301, redirectUrl);
  }
  next();
});
var distPath = path4.join(process.cwd(), "dist/public");
if (fs3.existsSync(distPath)) {
  console.log("Production build detected. Serving static files from:", distPath);
  app.use(express7.static(distPath));
} else {
  console.log("No production build found. Setting up development Vite middleware.");
  app.use(express7.static(path4.join(process.cwd(), "client/public")));
}
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || "Unknown";
  const host = req.headers.host || "Unknown";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  if (req.path.includes("/api/auth/google")) {
    console.log(`
Google Auth Request Received:`);
    console.log(`Origin: ${origin}`);
    console.log(`Host: ${host}`);
    console.log(`Protocol: ${protocol}`);
    console.log(`Full URL: ${protocol}://${host}${req.originalUrl}`);
    if (origin) {
      console.log(`Dynamic Google Auth: Detected origin ${origin}`);
      try {
        const originUrl = new URL(origin);
        const browserDomain = originUrl.origin;
        console.log(`Dynamic Google Auth: Using callback URL ${browserDomain}/api/auth/google/callback`);
      } catch (e) {
        console.log(`Dynamic Google Auth: Error parsing origin ${origin}:`, e);
      }
    }
  }
  next();
});
app.use("/uploads", express7.static(path4.join(process.cwd(), "uploads")));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      const isSensitiveEndpoint = path5.includes("/api/user") || path5.includes("/api/login") || path5.includes("/api/auth/") || path5.includes("/api/register");
      if (capturedJsonResponse && !isSensitiveEndpoint) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      } else if (isSensitiveEndpoint) {
        logLine += " :: [Sensitive data redacted]";
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const isReplitEnv = process.env.REPL_ID || process.env.REPL_OWNER;
  if (app.get("env") === "development" || isReplitEnv) {
    console.log("Setting up Vite middleware for development/Replit environment");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving for production environment");
    serveStatic(app);
  }
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    const distIndexPath = path4.join(process.cwd(), "dist/public/index.html");
    const devIndexPath = path4.join(process.cwd(), "client/index.html");
    if (fs3.existsSync(distIndexPath)) {
      res.sendFile(distIndexPath);
    } else if (fs3.existsSync(devIndexPath)) {
      res.sendFile(devIndexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Binate AI</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body>
            <div id="root">
              <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                  <h1>Binate AI</h1>
                  <p>Your intelligent executive assistant platform</p>
                  <p style="color: #666;">Loading application...</p>
                </div>
              </div>
            </div>
            <script type="module" src="/client/src/main.tsx"></script>
          </body>
        </html>
      `);
    }
  });
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    try {
      startNotificationScheduler();
      log("Notification scheduler started successfully");
    } catch (error) {
      console.error("Failed to start notification scheduler:", error);
    }
  });
})();
