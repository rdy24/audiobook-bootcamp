import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  primaryKey,
  sqliteTableCreator,
  text,
} from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `audiopintar.com_${name}`);

export const users = createTable("user", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name", { length: 255 }),
  email: text("email", { length: 255 }).notNull(),
  emailVerified: int("email_verified", {
    mode: "timestamp",
  }).default(sql`(unixepoch())`),
  image: text("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  {
    userId: text("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: text("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider", { length: 255 }).notNull(),
    providerAccountId: text("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: text("token_type", { length: 255 }),
    scope: text("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: text("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: text("session_token", { length: 255 }).notNull().primaryKey(),
    userId: text("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier", { length: 255 }).notNull(),
    token: text("token", { length: 255 }).notNull(),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);


export const documents = createTable(
  "document",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    createdById: text("created_by", { length: 255 }).notNull().references(() => users.id),
    createdAt: int("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    updatedAt: int("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
  },
  (table) => ({
    createdByIdIdx: index("doc_created_by_idx").on(table.createdById),
    nameIndex: index("doc_name_idx").on(table.name),
  })
);

export const pages = createTable(
  "page",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    documentId: int("document_id").notNull().references(() => documents.id),
    pageNumber: int("page_number").notNull(),
    content: text("content").notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index("page_document_id_idx").on(table.documentId),
    pageNumberIdx: index("page_number_idx").on(table.pageNumber),
  })
);

export const documentsRelations = relations(documents, ({ many, one }) => ({
  pages: many(pages),
  creator: one(users, { fields: [documents.createdById], references: [users.id] }),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  document: one(documents, { fields: [pages.documentId], references: [documents.id] }),
  audioFiles: many(audioFiles)
}));


export const audioFiles = createTable(
  "audio_file",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    pageId: int("page_id").notNull().references(() => pages.id),
    fileName: text("file_name", { length: 256 }).notNull(),
    filePath: text("file_path").notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    pageIdIdx: index("audio_page_id_idx").on(table.pageId),
  })
);

export const audioFilesRelations = relations(audioFiles, ({ one }) => ({
  page: one(pages, { fields: [audioFiles.pageId], references: [pages.id] }),
}));
