import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

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

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;