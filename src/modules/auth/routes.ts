import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, hashIp } from '../../lib/http.js';
import { csrfGuard, requireAdmin } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../audit/service.js';
import { authenticateAdmin, changeAdminPassword, serializeAdmin } from './service.js';
import { clearSessionCookies, issueSessionCookies, signSessionToken } from './tokens.js';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.').max(191),
  password: z.string().min(1, 'Enter your password.').max(200),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12, 'Use at least 12 characters.').max(200),
});

export const authRouter = Router();

authRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    try {
      const admin = await authenticateAdmin(email, password);
      const token = signSessionToken({ sub: admin.id, email: admin.email, role: admin.role, tv: admin.tokenVersion });
      const csrfToken = issueSessionCookies(res, token);

      await recordAudit({ adminUserId: admin.id, action: 'ADMIN_LOGIN', ipHash: hashIp(req) });

      res.json({ data: { admin: serializeAdmin(admin), csrfToken } });
    } catch (error) {
      await recordAudit({
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'AdminUser',
        metadata: { email: email.trim().toLowerCase() },
        ipHash: hashIp(req),
      });
      throw error;
    }
  }),
);

authRouter.post(
  '/logout',
  requireAdmin,
  csrfGuard,
  asyncHandler(async (req, res) => {
    await recordAudit({ adminUserId: req.admin?.id, action: 'ADMIN_LOGOUT', ipHash: hashIp(req) });
    clearSessionCookies(res);
    res.json({ data: { ok: true } });
  }),
);

authRouter.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const admin = req.admin!;
    res.json({
      data: {
        admin: { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role },
      },
    });
  }),
);

authRouter.post(
  '/password',
  requireAdmin,
  csrfGuard,
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof passwordSchema>;
    await changeAdminPassword(req.admin!.id, currentPassword, newPassword);
    await recordAudit({ adminUserId: req.admin!.id, action: 'ADMIN_PASSWORD_CHANGED', ipHash: hashIp(req) });
    clearSessionCookies(res);
    res.json({ data: { ok: true, reauthenticate: true } });
  }),
);
