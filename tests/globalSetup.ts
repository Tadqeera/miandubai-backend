import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '..');

/**
 * Creates and migrates the dedicated test database before the suite runs.
 * The development database is never touched.
 */
export default async function setup() {
  const env = dotenv.config({ path: path.join(backendRoot, '.env.test') }).parsed ?? {};

  const database = env.DB_NAME ?? 'miandubai_test';
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error(`Refusing to use test database name "${database}".`);
  }
  if (!database.endsWith('_test')) {
    throw new Error(`The test database name must end with "_test"; got "${database}".`);
  }

  const connection = await mysql.createConnection({
    host: env.DB_ADMIN_HOST ?? '127.0.0.1',
    port: Number.parseInt(env.DB_ADMIN_PORT ?? '3306', 10),
    user: env.DB_ADMIN_USER ?? 'root',
    password: env.DB_ADMIN_PASSWORD ?? '',
  });

  try {
    const [collations] = await connection.query<mysql.RowDataPacket[]>(
      "SHOW COLLATION WHERE Charset = 'utf8mb4' AND Collation IN ('utf8mb4_0900_ai_ci','utf8mb4_unicode_ci','utf8mb4_general_ci')",
    );
    const available = new Set(collations.map((row) => String(row.Collation)));
    const collation =
      ['utf8mb4_0900_ai_ci', 'utf8mb4_unicode_ci', 'utf8mb4_general_ci'].find((name) => available.has(name)) ??
      'utf8mb4_general_ci';

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE ${collation}`);
  } finally {
    await connection.end();
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: backendRoot,
    env: { ...process.env, ...env },
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
}
