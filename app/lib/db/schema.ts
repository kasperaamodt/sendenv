import {
	bigint,
	boolean,
	customType,
	mysqlTable,
	text,
	timestamp,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';

const binaryDigest = customType<{ data: Buffer; driverData: Buffer }>({
	dataType: () => 'binary(32)'
});

export const secrets = mysqlTable(
	'secrets',
	{
		id: bigint({ mode: 'number' }).primaryKey().autoincrement(),
		content_id: varchar({ length: 32 }).notNull(),
		data: text().notNull(),
		access_verifier: binaryDigest().notNull(),
		created_at: timestamp().defaultNow().notNull(),
		expires_at: timestamp().notNull(),
		accessed: boolean().default(false).notNull()
	},
	(table) => [uniqueIndex('content_uidx').on(table.content_id)]
);
