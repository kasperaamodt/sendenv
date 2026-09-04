import { and, eq, gt, lt, or } from 'drizzle-orm';

import { db } from '../../db/index.ts';
import { secrets } from '../../db/schema.ts';

export interface NewSecret {
	contentId: string;
	ciphertext: string;
	accessVerifier: Buffer;
	expiresAt: Date;
}

export interface SecretStore {
	create(secret: NewSecret): Promise<boolean>;
	available(contentId: string, accessVerifier: Buffer, now: Date): Promise<boolean>;
	consume(contentId: string, accessVerifier: Buffer, now: Date): Promise<string | null>;
	cleanup(now: Date): Promise<number>;
}

export const secretStore: SecretStore = {
	async create(secret) {
		try {
			const [result] = await db.insert(secrets).values({
				content_id: secret.contentId,
				data: secret.ciphertext,
				access_verifier: secret.accessVerifier,
				expires_at: secret.expiresAt
			});

			return result.affectedRows === 1;
		} catch (error) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				error.code === 'ER_DUP_ENTRY'
			) {
				return false;
			}
			throw error;
		}
	},

	async available(contentId, accessVerifier, now) {
		const [secret] = await db
			.select({ contentId: secrets.content_id })
			.from(secrets)
			.where(
				and(
					eq(secrets.content_id, contentId),
					eq(secrets.access_verifier, accessVerifier),
					eq(secrets.accessed, false),
					gt(secrets.expires_at, now)
				)
			)
			.limit(1);

		return secret !== undefined;
	},

	async consume(contentId, accessVerifier, now) {
		return db.transaction(async (transaction) => {
			const [result] = await transaction
				.update(secrets)
				.set({ accessed: true })
				.where(
					and(
						eq(secrets.content_id, contentId),
						eq(secrets.access_verifier, accessVerifier),
						eq(secrets.accessed, false),
						gt(secrets.expires_at, now)
					)
				);

			if (result.affectedRows !== 1) return null;

			const [secret] = await transaction
				.select({ ciphertext: secrets.data })
				.from(secrets)
				.where(eq(secrets.content_id, contentId));

			return secret?.ciphertext ?? null;
		});
	},

	async cleanup(now) {
		const [result] = await db
			.delete(secrets)
			.where(or(lt(secrets.expires_at, now), eq(secrets.accessed, true)));

		return result.affectedRows;
	}
};
