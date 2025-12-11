import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const links = sqliteTable('links', {
	id: text('id').primaryKey(),
	url: text('url').notNull(),
	title: text('title'),
	description: text('description'),
	summary: text('summary'),
	favicon: text('favicon'),
	pinned: integer('pinned', { mode: 'boolean' }).default(false).notNull(),
	clickCount: integer('click_count').default(0).notNull(),
	lastClickedAt: integer('last_clicked_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	color: text('color').default('#3b82f6').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const linkTags = sqliteTable('link_tags', {
	linkId: text('link_id')
		.notNull()
		.references(() => links.id, { onDelete: 'cascade' }),
	tagId: text('tag_id')
		.notNull()
		.references(() => tags.id, { onDelete: 'cascade' })
});

export const credentials = sqliteTable('credentials', {
	id: text('id').primaryKey(),
	service: text('service').notNull().unique(),
	type: text('type').notNull(), // 'oauth' | 'pat' | 'api_key'
	encryptedData: text('encrypted_data').notNull(),
	iv: text('iv').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const linksRelations = relations(links, ({ many }) => ({
	linkTags: many(linkTags)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	linkTags: many(linkTags)
}));

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
	link: one(links, {
		fields: [linkTags.linkId],
		references: [links.id]
	}),
	tag: one(tags, {
		fields: [linkTags.tagId],
		references: [tags.id]
	})
}));

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Credential = typeof credentials.$inferSelect;
