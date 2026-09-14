/**
 * Interactive creation of an administrator account.
 *
 *   npm run admin:create
 *
 * No password is ever seeded or printed. If the account already exists you are
 * offered a password reset instead.
 */
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { PrismaClient, type AdminRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

let muted = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});

const rl = readline.createInterface({ input: process.stdin, output, terminal: true });

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

const askSecret = async (question: string): Promise<string> => {
  process.stdout.write(question);
  muted = true;
  const answer = await new Promise<string>((resolve) => rl.question('', (value) => resolve(value)));
  muted = false;
  process.stdout.write('\n');
  return answer;
};

const checkStrength = (password: string): string[] => {
  const problems: string[] = [];
  if (password.length < 12) problems.push('at least 12 characters');
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/\d/.test(password)) problems.push('a digit');
  if (!/[^A-Za-z0-9]/.test(password)) problems.push('a symbol');
  return problems;
};

const run = async () => {
  console.log('\nMian Dubai — create an administrator\n');

  const existingCount = await prisma.adminUser.count();
  if (existingCount > 0) {
    console.log(`There ${existingCount === 1 ? 'is' : 'are'} already ${existingCount} administrator account(s).\n`);
  }

  const email = (await ask('Email address: ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('That is not a valid email address.');
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    const answer = (await ask(`"${email}" already exists. Reset its password instead? (y/N): `)).toLowerCase();
    if (answer !== 'y' && answer !== 'yes') {
      console.log('Nothing was changed.');
      return;
    }
  }

  const displayName = existing
    ? existing.displayName
    : (await ask('Display name: ')) || email.split('@')[0] || 'Administrator';

  // The very first account owns the installation; later ones are plain admins.
  const role: AdminRole = existing ? existing.role : existingCount === 0 ? 'OWNER' : 'ADMIN';

  let password = '';
  for (;;) {
    password = await askSecret('Password (input hidden): ');
    const problems = checkStrength(password);
    if (problems.length > 0) {
      console.log(`  The password needs ${problems.join(', ')}. Please try again.`);
      continue;
    }
    const confirmation = await askSecret('Confirm password: ');
    if (confirmation !== password) {
      console.log('  The passwords did not match. Please try again.');
      continue;
    }
    break;
  }

  const passwordHash = await argon2.hash(password, ARGON_OPTIONS);

  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      // Bumping tokenVersion signs out every existing session for this account.
      data: { passwordHash, isActive: true, tokenVersion: { increment: 1 } },
    });
    console.log(`\nPassword updated for ${email}. Existing sessions have been signed out.`);
  } else {
    await prisma.adminUser.create({ data: { email, displayName, passwordHash, role } });
    console.log(`\nAdministrator created: ${email} (${role}).`);
  }

  console.log('Sign in at the admin application, by default http://localhost:5174\n');
};

run()
  .catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
