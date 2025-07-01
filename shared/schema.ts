import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull(),
  endpoint: text("endpoint").notNull(),
  isActive: boolean("is_active").default(true),
  rateLimitPerMonth: integer("rate_limit_per_month").default(5000),
  usedThisMonth: integer("used_this_month").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  fullName: text("full_name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  company: text("company"),
  companyDomain: text("company_domain"),
  location: text("location"),
  department: text("department"),
  seniority: text("seniority"),
  emailStatus: text("email_status"), // verified, probable, unverified
  source: text("source").notNull(), // apollo-scraper, apollo-api, contact-scraper
  rawData: jsonb("raw_data"),
  searchId: integer("search_id").references(() => searches.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  searchType: text("search_type").notNull(), // company, domain, url
  filters: jsonb("filters"),
  totalResults: integer("total_results").default(0),
  verifiedEmails: integer("verified_emails").default(0),
  apiCallsUsed: integer("api_calls_used").default(0),
  searchTime: integer("search_time_ms").default(0),
  status: text("status").default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const exportHistory = pgTable("export_history", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").references(() => searches.id),
  format: text("format").notNull(), // csv, json
  fileName: text("file_name").notNull(),
  recordCount: integer("record_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  createdAt: true,
});

export const insertExportHistorySchema = createInsertSchema(exportHistory).omit({
  id: true,
  createdAt: true,
});

// Types
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Search = typeof searches.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = z.infer<typeof insertExportHistorySchema>;
