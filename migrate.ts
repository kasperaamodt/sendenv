import { migrate } from 'drizzle-orm/mysql2/migrator';
import type { RowDataPacket } from 'mysql2/promise';

import { closeDatabase, db } from './app/lib/db/index.ts';

interface MigrationLockRow extends RowDataPacket {
	acquired: number;
}

const lockName = 'sendenv:database-migrations';
const connection = await db.$client.getConnection();

try {
	const [rows] = await connection.query<MigrationLockRow[]>('SELECT GET_LOCK(?, 60) AS acquired', [
		lockName
	]);
	if (rows[0]?.acquired !== 1) throw new Error('Could not acquire database migration lock');

	await migrate(db, { migrationsFolder: './drizzle' });
} finally {
	await connection.query('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => undefined);
	connection.release();
	await closeDatabase();
}
