/**
 * Creates the `miandubai` database if it does not exist.
 *
 * Prisma migrations own the schema; this script only creates the empty
 * database with the right character set, because `prisma migrate` cannot do
 * that itself on MySQL/MariaDB.
 *
 *   npm run db:create
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const host = process.env.DB_ADMIN_HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.DB_ADMIN_PORT ?? '3306', 10);
const user = process.env.DB_ADMIN_USER ?? 'root';
const password = process.env.DB_ADMIN_PASSWORD ?? '';
const database = process.env.DB_NAME ?? 'miandubai';

if (!/^[A-Za-z0-9_]+$/.test(database)) {
  console.error(`Refusing to create database "${database}": names are limited to letters, digits and underscores.`);
  process.exit(1);
}

const run = async () => {
  const connection = await mysql.createConnection({ host, port, user, password });
  try {
    const [versionRows] = await connection.query<mysql.RowDataPacket[]>('SELECT VERSION() AS version');
    const version = String(versionRows[0]?.version ?? '');

    // utf8mb4_0900_ai_ci only exists on MySQL 8+. MariaDB needs unicode_ci.
    const [collations] = await connection.query<mysql.RowDataPacket[]>(
      "SHOW COLLATION WHERE Charset = 'utf8mb4' AND Collation IN ('utf8mb4_0900_ai_ci','utf8mb4_unicode_ci','utf8mb4_general_ci')",
    );
    const available = new Set(collations.map((row) => String(row.Collation)));
    const collation = ['utf8mb4_0900_ai_ci', 'utf8mb4_unicode_ci', 'utf8mb4_general_ci'].find((name) =>
      available.has(name),
    );

    if (!collation) {
      throw new Error('No supported utf8mb4 collation is available on this server.');
    }

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE ${collation}`,
    );
    console.log(`Database "${database}" is ready on ${host}:${port} (${version}, ${collation}).`);
    console.log('Next: npm run db:migrate');
  } finally {
    await connection.end();
  }
};

run().catch((error: unknown) => {
  console.error('Failed to create the database.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
