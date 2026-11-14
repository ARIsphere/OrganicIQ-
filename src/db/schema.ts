import { relations } from 'drizzle-orm';
import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gscConnections = pgTable('gsc_connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  propertyUrl: text('property_url').notNull(),
  connected: boolean('connected').default(true).notNull(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gscMonthlyMetrics = pgTable(
  'gsc_monthly_metrics',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    propertyUrl: text('property_url').notNull(),
    monthKey: text('month_key').notNull(), // YYYY-MM
    monthLabel: text('month_label').notNull(), // e.g., "Nov 2026"
    clicks: integer('clicks').notNull(),
    impressions: integer('impressions').notNull(),
    ctr: numeric('ctr', { precision: 5, scale: 2 }).notNull(),
    avgPosition: numeric('avg_position', { precision: 5, scale: 1 }).notNull(),
    indexedPages: integer('indexed_pages').notNull(),
    topQuery: text('top_query').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('gsc_monthly_user_prop_month_idx').on(
      table.userId,
      table.propertyUrl,
      table.monthKey
    ),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  gscConnection: one(gscConnections, {
    fields: [users.id],
    references: [gscConnections.userId],
  }),
  gscMonthlyMetrics: many(gscMonthlyMetrics),
}));

export const gscConnectionsRelations = relations(gscConnections, ({ one }) => ({
  user: one(users, {
    fields: [gscConnections.userId],
    references: [users.id],
  }),
}));

export const gscMonthlyMetricsRelations = relations(gscMonthlyMetrics, ({ one }) => ({
  user: one(users, {
    fields: [gscMonthlyMetrics.userId],
    references: [users.id],
  }),
}));
