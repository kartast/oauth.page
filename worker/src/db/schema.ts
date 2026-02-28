import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  avatar_url: text("avatar_url"),
  github_id: text("github_id"),
  google_id: text("google_id"),
  created_at: integer("created_at").notNull(),
  plan: text("plan").default("free"),
  deploys_this_month: integer("deploys_this_month").default(0),
  deploys_reset_at: integer("deploys_reset_at"),
  emails_this_month: integer("emails_this_month").default(0),
});

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => users.id),
  slug: text("slug").unique().notNull(),
  origin_url: text("origin_url").notNull(),
  name: text("name").notNull(),
  created_at: integer("created_at").notNull(),
  settings: text("settings", { mode: "json" }),
  thumbnail_status: text("thumbnail_status"),
  thumbnail_at: integer("thumbnail_at"),
  views_this_month: integer("views_this_month").default(0),
  views_reset_at: integer("views_reset_at"),
});

export const accessRequests = sqliteTable("access_requests", {
  id: text("id").primaryKey(),
  site_id: text("site_id")
    .notNull()
    .references(() => sites.id),
  email: text("email").notNull(),
  name: text("name"),
  message: text("message"),
  avatar_url: text("avatar_url"),
  provider: text("provider"), // "github" | "google"
  status: text("status").notNull().default("pending"),
  decided_by: text("decided_by").references(() => users.id),
  decided_at: integer("decided_at"),
  created_at: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").unique().notNull(),
  site_id: text("site_id")
    .notNull()
    .references(() => sites.id),
  email: text("email").notNull(),
  expires_at: integer("expires_at").notNull(),
  created_at: integer("created_at").notNull(),
});
