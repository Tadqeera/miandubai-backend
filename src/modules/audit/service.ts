import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export const AUDIT_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_LOGIN_FAILED',
  'ADMIN_LOGOUT',
  'ADMIN_PASSWORD_CHANGED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_PUBLISHED',
  'PRODUCT_UNPUBLISHED',
  'PRODUCT_ARCHIVED',
  'PRODUCT_DELETED',
  'PRODUCT_DUPLICATED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DELETED',
  'COLLECTION_CREATED',
  'COLLECTION_UPDATED',
  'COLLECTION_DELETED',
  'MEDIA_UPLOADED',
  'MEDIA_DELETED',
  'SETTING_CHANGED',
  'CONTENT_UPDATED',
  'LEGAL_PAGE_UPDATED',
  'CONTACT_MESSAGE_UPDATED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

interface RecordAuditInput {
  adminUserId?: number | null;
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
}

const SENSITIVE_KEYS = /password|token|secret|hash|cookie|authorization/i;

/** Strips anything that could leak a credential into the audit trail. */
const sanitize = (metadata: unknown): Prisma.InputJsonValue | undefined => {
  if (metadata === undefined || metadata === null) return undefined;
  if (typeof metadata !== 'object') return metadata as Prisma.InputJsonValue;
  if (Array.isArray(metadata)) return metadata.map((entry) => sanitize(entry)) as Prisma.InputJsonValue;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(key)) continue;
    result[key] = typeof value === 'object' && value !== null ? sanitize(value) : value;
  }
  return result as Prisma.InputJsonValue;
};

export const recordAudit = async (input: RecordAuditInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        adminUserId: input.adminUserId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId === null || input.entityId === undefined ? null : String(input.entityId),
        metadata: sanitize(input.metadata),
        ipHash: input.ipHash ?? null,
      },
    });
  } catch (error) {
    // Auditing must never break the operation it is describing.
    logger.error({ err: error, action: input.action }, 'Failed to write audit log');
  }
};

export const listAuditLogs = async (params: { page: number; pageSize: number; action?: string }) => {
  const where: Prisma.AuditLogWhereInput = params.action ? { action: params.action } : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { adminUser: { select: { id: true, displayName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: items.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString(),
      admin: entry.adminUser ? { id: entry.adminUser.id, displayName: entry.adminUser.displayName } : null,
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
};
