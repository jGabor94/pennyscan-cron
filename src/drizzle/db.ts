import 'dotenv/config';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { relations } from './migrations/relations.js';

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) throw new Error(
    'Please define the DATABASE_URL environment variable inside .env.local'
)
const globalForDb = global as unknown as { client: postgres.Sql | undefined }

const client = globalForDb.client ?? postgres(DATABASE_URL, { prepare: false })

export const db = drizzle({ client, relations })

export const closeDatabaseConnection = async (): Promise<void> => {
    await client.end({ timeout: 5 })
}
