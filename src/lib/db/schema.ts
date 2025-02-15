import {
	bigint,
	boolean,
	mysqlTable,
	text,
	timestamp,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';

export const secrets = mysqlTable(
	'secrets',
	{
		id: bigint({ mode: 'number' }).primaryKey().autoincrement(),
		content_id: varchar({ length: 12 }).notNull(),
		data: text().notNull(),
		created_at: timestamp().defaultNow().notNull(),
		expires_at: timestamp().notNull(),
		accessed: boolean().default(false).notNull()
	},
	(table) => [uniqueIndex('content_uidx').on(table.content_id)]
);
