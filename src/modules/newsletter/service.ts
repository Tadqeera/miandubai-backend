import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { SUPPORTED_LOCALES } from '../../lib/locale.js';

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(191),
  locale: z.enum(SUPPORTED_LOCALES).optional().default('en'),
  /** Explicit opt-in; there is no pre-ticked consent anywhere. */
  consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm you would like to receive our notes.' }) }),
  company: z.string().max(200).optional(),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

export const subscribe = async (input: NewsletterSubscribeInput, ipHash: string) => {
  if (input.company && input.company.trim() !== '') {
    return { accepted: true };
  }

  const email = input.email.toLowerCase();
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, locale: input.locale, ipHash },
    update: { isActive: true, unsubscribedAt: null, locale: input.locale },
  });

  return { accepted: true };
};

export const listSubscribers = async (params: { page: number; pageSize: number }) => {
  const [items, total, active] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: { id: true, email: true, locale: true, isActive: true, createdAt: true },
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);

  return {
    items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    total,
    active,
    page: params.page,
    pageSize: params.pageSize,
  };
};

export const setSubscriberActive = (id: number, isActive: boolean) =>
  prisma.newsletterSubscriber.update({
    where: { id },
    data: { isActive, unsubscribedAt: isActive ? null : new Date() },
    select: { id: true, isActive: true },
  });
