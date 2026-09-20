/// <reference types="node" />

import 'dotenv/config';
import { Config, defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './src/drizzle/migrations',
    schema: './src/drizzle/schema.ts',
    dialect: 'postgresql',
    verbose: true,
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    schemaFilter: ['public']
}) satisfies Config
