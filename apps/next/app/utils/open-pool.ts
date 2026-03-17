import { Pool } from 'pg'
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.DATABASE_HOST || 'postgres12',
        user: process.env.DATABASE_USER || 'root',
        port: parseInt(process.env.DATABASE_PORT || '5498'),
        password: process.env.DATABASE_SECRET || 'secret',
        database: process.env.DATABASE_NAME || 'starter-app',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
)
export default pool
