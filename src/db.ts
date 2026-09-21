import { Pool, type PoolConfig } from 'pg';

const poolConfig: PoolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'data',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: Number(process.env.DB_POOL_MAX) || 10,
    };

export const db = new Pool(poolConfig);

export const checkDatabaseConnection = async (): Promise<void> => {
    await db.query('SELECT 1');
};

db.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
});