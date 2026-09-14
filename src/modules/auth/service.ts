import argon2 from 'argon2';
import { ApiError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

/**
 * OWASP-aligned Argon2id parameters. Kept in one place so the CLI that creates
 * admins and the login path can never drift apart.
 */
const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * Verified against on unknown emails so that a missing account and a wrong
 * password take the same amount of time.
 */
let decoyHash: string | null = null;
const getDecoyHash = async () => {
  decoyHash ??= await argon2.hash('miandubai-decoy-value', ARGON_OPTIONS);
  return decoyHash;
};

export const hashPassword = (plain: string) => argon2.hash(plain, ARGON_OPTIONS);

export interface PasswordCheck {
  ok: boolean;
  problems: string[];
}

export const checkPasswordStrength = (password: string): PasswordCheck => {
  const problems: string[] = [];
  if (password.length < 12) problems.push('Use at least 12 characters.');
  if (!/[a-z]/.test(password)) problems.push('Include a lowercase letter.');
  if (!/[A-Z]/.test(password)) problems.push('Include an uppercase letter.');
  if (!/\d/.test(password)) problems.push('Include a digit.');
  if (!/[^A-Za-z0-9]/.test(password)) problems.push('Include a symbol.');
  return { ok: problems.length === 0, problems };
};

export const authenticateAdmin = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });

  if (!admin) {
    await argon2.verify(await getDecoyHash(), password).catch(() => false);
    throw ApiError.unauthorized('Incorrect email address or password.');
  }

  const passwordMatches = await argon2.verify(admin.passwordHash, password).catch(() => false);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Incorrect email address or password.');
  }
  if (!admin.isActive) {
    throw ApiError.forbidden('This administrator account is disabled.');
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  return admin;
};

export const changeAdminPassword = async (adminId: number, currentPassword: string, newPassword: string) => {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) throw ApiError.notFound('Administrator not found.');

  const matches = await argon2.verify(admin.passwordHash, currentPassword).catch(() => false);
  if (!matches) throw ApiError.unauthorized('The current password is incorrect.');

  const strength = checkPasswordStrength(newPassword);
  if (!strength.ok) throw ApiError.validation('The new password is not strong enough.', strength.problems);

  // Bumping tokenVersion invalidates every session cookie already issued.
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
  });
};

/** Password hashes are never included in any response. */
export const serializeAdmin = (admin: {
  id: number;
  email: string;
  displayName: string;
  role: string;
  lastLoginAt: Date | null;
}) => ({
  id: admin.id,
  email: admin.email,
  displayName: admin.displayName,
  role: admin.role,
  lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
});
