import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping existing structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// SEO Audit related schemas
export const auditRequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export const scoreSchema = z.object({
  overall: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  content: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  mobile: z.number().min(0).max(100),
});

export const metaTagItemSchema = z.object({
  name: z.string(),
  status: z.enum(['good', 'warning', 'error']),
  description: z.string(),
  value: z.string().optional(),
  length: z.number().optional(),
});

export const speedResultSchema = z.object({
  performance: z.object({
    score: z.number(),
    strategy: z.string(),
  }).optional(),
  mobile: z.object({
    score: z.number(),
    strategy: z.string(),
  }).optional(),
  coreWebVitals: z.object({
    lcp: z.string(),
    fid: z.string(),
    cls: z.string(),
    fcp: z.string().optional(),
    si: z.string().optional(),
  }).optional(),
});

export const linksResultSchema = z.object({
  internal: z.object({
    links: z.array(z.any()),
    working: z.number(),
    broken: z.number(),
    status: z.enum(['good', 'warning', 'error']),
  }),
  external: z.object({
    links: z.array(z.any()),
    working: z.number(),
    broken: z.number(),
    status: z.enum(['good', 'warning', 'error']),
    total: z.number().optional(),
  }),
});

export const robotsResultSchema = z.object({
  robotsTxt: z.object({
    found: z.boolean(),
    accessible: z.boolean(),
    size: z.number(),
    sitemaps: z.array(z.string()),
  }),
  sitemap: z.object({
    found: z.boolean(),
    accessible: z.boolean(),
    urlCount: z.number(),
    format: z.string().optional(),
  }),
});

export const headersResultSchema = z.object({
  security: z.array(z.object({
    name: z.string(),
    status: z.enum(['good', 'warning', 'error']),
    description: z.string(),
    value: z.string().optional(),
  })),
  caching: z.array(z.object({
    name: z.string(),
    status: z.enum(['good', 'warning', 'error']),
    description: z.string(),
    value: z.string().optional(),
  })).optional(),
});

export const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
});

export const auditResultSchema = z.object({
  url: z.string(),
  timestamp: z.string(),
  scores: scoreSchema,
  meta: z.object({
    items: z.array(metaTagItemSchema),
  }).optional(),
  speed: speedResultSchema.optional(),
  links: linksResultSchema.optional(),
  robots: robotsResultSchema.optional(),
  headers: headersResultSchema.optional(),
  recommendations: z.array(recommendationSchema).optional(),
  errors: z.array(z.string()).optional(),
});

export type AuditRequest = z.infer<typeof auditRequestSchema>;
export type AuditResult = z.infer<typeof auditResultSchema>;
export type SpeedResult = z.infer<typeof speedResultSchema>;
export type LinksResult = z.infer<typeof linksResultSchema>;
export type RobotsResult = z.infer<typeof robotsResultSchema>;
export type HeadersResult = z.infer<typeof headersResultSchema>;
export type MetaTagItem = z.infer<typeof metaTagItemSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
