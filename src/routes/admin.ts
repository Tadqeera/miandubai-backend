import { ContactStatus, ProductStatus, WhatsAppSource } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler, hashIp } from '../lib/http.js';
import { csrfGuard, requireAdmin } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { imageUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { authRouter } from '../modules/auth/routes.js';
import { listAuditLogs, recordAudit } from '../modules/audit/service.js';
import { listContactMessages, setContactStatus } from '../modules/contact/service.js';
import { contentWriteSchema, listContentForAdmin, upsertContent } from '../modules/content/service.js';
import { CONTENT_BLOCKS } from '../modules/content/registry.js';
import { getDashboardSummary } from '../modules/dashboard/service.js';
import { legalWriteSchema, listAdminLegalPages, updateLegalPage } from '../modules/legal/service.js';
import { createMediaAsset, deleteMediaAsset, listMediaAssets, serializeMedia } from '../modules/media/service.js';
import { listSubscribers, setSubscriberActive } from '../modules/newsletter/service.js';
import { adminProductQuerySchema, productWriteSchema } from '../modules/products/schemas.js';
import {
  createProduct,
  duplicateProduct,
  getAdminProduct,
  listAdminProducts,
  restoreProduct,
  setProductStatus,
  softDeleteProduct,
  updateProduct,
} from '../modules/products/service.js';
import { listSettingsForAdmin, updateSettings } from '../modules/settings/service.js';
import { getWhatsAppActivity } from '../modules/whatsapp/service.js';
import { SETTING_KEYS } from '../modules/settings/registry.js';
import {
  categoryWriteSchema,
  collectionWriteSchema,
  createCategory,
  createCollection,
  deleteCategory,
  deleteCollection,
  listAdminCategories,
  listAdminCollections,
  updateCategory,
  updateCollection,
} from '../modules/taxonomy/service.js';

export const adminRouter = Router();

// /auth carries its own guards so that /login stays reachable.
adminRouter.use('/auth', authRouter);

// Everything below requires a valid session and a matching CSRF token.
adminRouter.use(requireAdmin, csrfGuard);

const idParams = z.object({ id: z.coerce.number().int().positive() });
const pagination = z.object({
  page: z.coerce.number().int().min(1).max(5000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(25),
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

adminRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    res.json({ data: await getDashboardSummary() });
  }),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

adminRouter.get(
  '/products',
  validate(adminProductQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json({ data: await listAdminProducts(req.query as never) });
  }),
);

adminRouter.get(
  '/products/:id',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    res.json({ data: await getAdminProduct(Number(req.params.id)) });
  }),
);

const allowWithoutImage = (req: { query: Record<string, unknown> }) => req.query.allowWithoutImage === 'true';

adminRouter.post(
  '/products',
  validate(productWriteSchema),
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.body as never, allowWithoutImage(req as never));
    await recordAudit({
      adminUserId: req.admin!.id,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      metadata: { sku: product.sku, status: product.status },
      ipHash: hashIp(req),
    });
    res.status(201).json({ data: product });
  }),
);

adminRouter.put(
  '/products/:id',
  validate(idParams, 'params'),
  validate(productWriteSchema),
  asyncHandler(async (req, res) => {
    const product = await updateProduct(Number(req.params.id), req.body as never, allowWithoutImage(req as never));
    await recordAudit({
      adminUserId: req.admin!.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product.id,
      metadata: { sku: product.sku, status: product.status },
      ipHash: hashIp(req),
    });
    res.json({ data: product });
  }),
);

adminRouter.post(
  '/products/:id/status',
  validate(idParams, 'params'),
  validate(z.object({ status: z.nativeEnum(ProductStatus) })),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: ProductStatus };
    const product = await setProductStatus(Number(req.params.id), status);
    await recordAudit({
      adminUserId: req.admin!.id,
      action: status === 'PUBLISHED' ? 'PRODUCT_PUBLISHED' : status === 'ARCHIVED' ? 'PRODUCT_ARCHIVED' : 'PRODUCT_UNPUBLISHED',
      entityType: 'Product',
      entityId: product.id,
      metadata: { sku: product.sku },
      ipHash: hashIp(req),
    });
    res.json({ data: product });
  }),
);

adminRouter.post(
  '/products/:id/duplicate',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    const product = await duplicateProduct(Number(req.params.id));
    await recordAudit({
      adminUserId: req.admin!.id,
      action: 'PRODUCT_DUPLICATED',
      entityType: 'Product',
      entityId: product.id,
      ipHash: hashIp(req),
    });
    res.status(201).json({ data: product });
  }),
);

adminRouter.delete(
  '/products/:id',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    // Soft delete only. Media is never destroyed as a side effect.
    const product = await softDeleteProduct(Number(req.params.id));
    await recordAudit({
      adminUserId: req.admin!.id,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: product.id,
      metadata: { slug: product.slug, softDelete: true },
      ipHash: hashIp(req),
    });
    res.json({ data: { id: product.id, softDeleted: true } });
  }),
);

adminRouter.post(
  '/products/:id/restore',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    res.json({ data: await restoreProduct(Number(req.params.id)) });
  }),
);

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

adminRouter.get(
  '/media',
  validate(pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query as unknown as z.infer<typeof pagination>;
    res.json({ data: await listMediaAssets(page, pageSize) });
  }),
);

adminRouter.post(
  '/media',
  uploadLimiter,
  imageUpload.array('files', 12),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw ApiError.badRequest('No files were uploaded.');

    const created = [];
    for (const file of files) {
      const asset = await createMediaAsset(file.buffer, file.originalname);
      created.push(serializeMedia(asset));
      await recordAudit({
        adminUserId: req.admin!.id,
        action: 'MEDIA_UPLOADED',
        entityType: 'MediaAsset',
        entityId: asset.id,
        metadata: { storageKey: asset.storageKey, sizeBytes: asset.sizeBytes },
        ipHash: hashIp(req),
      });
    }

    res.status(201).json({ data: { items: created } });
  }),
);

adminRouter.delete(
  '/media/:id',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await deleteMediaAsset(Number(req.params.id));
    await recordAudit({
      adminUserId: req.admin!.id,
      action: 'MEDIA_DELETED',
      entityType: 'MediaAsset',
      entityId: result.id,
      ipHash: hashIp(req),
    });
    res.json({ data: result });
  }),
);

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

adminRouter.get('/categories', asyncHandler(async (_req, res) => res.json({ data: { items: await listAdminCategories() } })));

adminRouter.post(
  '/categories',
  validate(categoryWriteSchema),
  asyncHandler(async (req, res) => {
    const category = await createCategory(req.body as never);
    await recordAudit({ adminUserId: req.admin!.id, action: 'CATEGORY_CREATED', entityType: 'Category', entityId: category.id, ipHash: hashIp(req) });
    res.status(201).json({ data: category });
  }),
);

adminRouter.put(
  '/categories/:id',
  validate(idParams, 'params'),
  validate(categoryWriteSchema),
  asyncHandler(async (req, res) => {
    const category = await updateCategory(Number(req.params.id), req.body as never);
    await recordAudit({ adminUserId: req.admin!.id, action: 'CATEGORY_UPDATED', entityType: 'Category', entityId: category.id, ipHash: hashIp(req) });
    res.json({ data: category });
  }),
);

adminRouter.delete(
  '/categories/:id',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await deleteCategory(Number(req.params.id));
    await recordAudit({ adminUserId: req.admin!.id, action: 'CATEGORY_DELETED', entityType: 'Category', entityId: result.id, ipHash: hashIp(req) });
    res.json({ data: result });
  }),
);

adminRouter.get('/collections', asyncHandler(async (_req, res) => res.json({ data: { items: await listAdminCollections() } })));

adminRouter.post(
  '/collections',
  validate(collectionWriteSchema),
  asyncHandler(async (req, res) => {
    const collection = await createCollection(req.body as never);
    await recordAudit({ adminUserId: req.admin!.id, action: 'COLLECTION_CREATED', entityType: 'Collection', entityId: collection.id, ipHash: hashIp(req) });
    res.status(201).json({ data: collection });
  }),
);

adminRouter.put(
  '/collections/:id',
  validate(idParams, 'params'),
  validate(collectionWriteSchema),
  asyncHandler(async (req, res) => {
    const collection = await updateCollection(Number(req.params.id), req.body as never);
    await recordAudit({ adminUserId: req.admin!.id, action: 'COLLECTION_UPDATED', entityType: 'Collection', entityId: collection.id, ipHash: hashIp(req) });
    res.json({ data: collection });
  }),
);

adminRouter.delete(
  '/collections/:id',
  validate(idParams, 'params'),
  asyncHandler(async (req, res) => {
    const result = await deleteCollection(Number(req.params.id));
    await recordAudit({ adminUserId: req.admin!.id, action: 'COLLECTION_DELETED', entityType: 'Collection', entityId: result.id, ipHash: hashIp(req) });
    res.json({ data: result });
  }),
);

// ---------------------------------------------------------------------------
// Content, legal and settings
// ---------------------------------------------------------------------------

adminRouter.get(
  '/content',
  asyncHandler(async (_req, res) => {
    res.json({ data: { blocks: await listContentForAdmin(), definitions: CONTENT_BLOCKS } });
  }),
);

adminRouter.put(
  '/content/:key',
  validate(contentWriteSchema),
  asyncHandler(async (req, res) => {
    const key = String(req.params.key);
    const result = await upsertContent(key, req.body as never);
    await recordAudit({ adminUserId: req.admin!.id, action: 'CONTENT_UPDATED', entityType: 'SiteContent', entityId: key, ipHash: hashIp(req) });
    res.json({ data: result });
  }),
);

adminRouter.get('/legal', asyncHandler(async (_req, res) => res.json({ data: { items: await listAdminLegalPages() } })));

adminRouter.put(
  '/legal/:slug',
  validate(legalWriteSchema),
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);
    const result = await updateLegalPage(slug, req.body as never);
    await recordAudit({ adminUserId: req.admin!.id, action: 'LEGAL_PAGE_UPDATED', entityType: 'LegalPage', entityId: slug, ipHash: hashIp(req) });
    res.json({ data: result });
  }),
);

adminRouter.get('/settings', asyncHandler(async (_req, res) => res.json({ data: { items: await listSettingsForAdmin() } })));

adminRouter.put(
  '/settings',
  validate(z.object({ values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])) })),
  asyncHandler(async (req, res) => {
    const { values } = req.body as { values: Record<string, unknown> };
    const unknownKeys = Object.keys(values).filter((key) => !SETTING_KEYS.includes(key as never));
    if (unknownKeys.length > 0) {
      throw ApiError.badRequest(`Unknown setting key(s): ${unknownKeys.join(', ')}`);
    }

    const changed = await updateSettings(values as never);
    await recordAudit({
      adminUserId: req.admin!.id,
      action: 'SETTING_CHANGED',
      entityType: 'SiteSetting',
      metadata: { keys: changed },
      ipHash: hashIp(req),
    });
    res.json({ data: { items: await listSettingsForAdmin() } });
  }),
);

// ---------------------------------------------------------------------------
// Messages, subscribers and audit
// ---------------------------------------------------------------------------

adminRouter.get(
  '/messages',
  validate(pagination.extend({ status: z.nativeEnum(ContactStatus).optional() }), 'query'),
  asyncHandler(async (req, res) => {
    res.json({ data: await listContactMessages(req.query as never) });
  }),
);

adminRouter.post(
  '/messages/:id/status',
  validate(idParams, 'params'),
  validate(z.object({ status: z.nativeEnum(ContactStatus) })),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: ContactStatus };
    const result = await setContactStatus(Number(req.params.id), status);
    await recordAudit({ adminUserId: req.admin!.id, action: 'CONTACT_MESSAGE_UPDATED', entityType: 'ContactMessage', entityId: result.id, metadata: { status }, ipHash: hashIp(req) });
    res.json({ data: result });
  }),
);

adminRouter.get(
  '/whatsapp',
  validate(
    pagination.extend({
      source: z.nativeEnum(WhatsAppSource).optional(),
      range: z.enum(['1', '7', '30', 'all']).optional(),
    }),
    'query',
  ),
  asyncHandler(async (req, res) => {
    res.json({ data: await getWhatsAppActivity(req.query as never) });
  }),
);

adminRouter.get(
  '/subscribers',
  validate(pagination, 'query'),
  asyncHandler(async (req, res) => {
    if (!env.FEATURE_NEWSLETTER) throw ApiError.notFound('The newsletter feature is disabled.');
    res.json({ data: await listSubscribers(req.query as never) });
  }),
);

adminRouter.post(
  '/subscribers/:id/status',
  validate(idParams, 'params'),
  validate(z.object({ isActive: z.boolean() })),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body as { isActive: boolean };
    res.json({ data: await setSubscriberActive(Number(req.params.id), isActive) });
  }),
);

adminRouter.get(
  '/audit',
  validate(pagination.extend({ action: z.string().max(64).optional() }), 'query'),
  asyncHandler(async (req, res) => {
    res.json({ data: await listAuditLogs(req.query as never) });
  }),
);
