export type ContentField = 'eyebrow' | 'heading' | 'subheading' | 'body' | 'cta' | 'ctaAlt';

export interface ContentItemField {
  name: string;
  label: string;
  type: 'text' | 'textarea';
}

export interface ContentBlockDefinition {
  key: string;
  group: 'announcement' | 'home' | 'about' | 'contact' | 'faq' | 'footer' | 'legal';
  label: string;
  description?: string;
  sortOrder: number;
  fields: ContentField[];
  items?: { label: string; addLabel: string; fields: ContentItemField[] };
}

/**
 * The editable surface of the storefront. Deliberately narrow — this is not a
 * general purpose CMS, only the copy that the business actually needs to own.
 */
export const CONTENT_BLOCKS: readonly ContentBlockDefinition[] = [
  {
    key: 'announcement',
    group: 'announcement',
    label: 'Announcement bar',
    description:
      'The slim strip above the navigation. The heading is the lead label and the body is the detail after the separator — "California delivery · Estimated 2–5 business days". Shown only while "Show announcement bar" is enabled in Settings.',
    sortOrder: 0,
    fields: ['heading', 'body', 'cta'],
  },
  {
    key: 'home.hero',
    group: 'home',
    label: 'Homepage hero',
    sortOrder: 10,
    fields: ['eyebrow', 'heading', 'subheading', 'cta', 'ctaAlt'],
  },
  {
    key: 'home.featured',
    group: 'home',
    label: 'Signature fragrances section',
    description: 'Heading for the products marked "Featured".',
    sortOrder: 20,
    fields: ['eyebrow', 'heading', 'subheading'],
  },
  {
    key: 'home.story',
    group: 'home',
    label: 'The House of Mian Dubai',
    description: 'Editorial brand narrative. Avoid heritage, award or origin claims that cannot be substantiated.',
    sortOrder: 30,
    fields: ['eyebrow', 'heading', 'body', 'cta'],
  },
  {
    key: 'home.bestsellers',
    group: 'home',
    label: 'Best sellers section',
    sortOrder: 40,
    fields: ['eyebrow', 'heading', 'subheading'],
  },
  {
    key: 'home.newArrivals',
    group: 'home',
    label: 'New arrivals section',
    sortOrder: 50,
    fields: ['eyebrow', 'heading', 'subheading'],
  },
  {
    key: 'home.collections',
    group: 'home',
    label: 'Discover by collection',
    sortOrder: 60,
    fields: ['eyebrow', 'heading', 'subheading'],
  },
  {
    key: 'home.scentArchitecture',
    group: 'home',
    label: 'Scent architecture',
    description: 'Explains top, heart and base notes. Keep it educational — no therapeutic claims.',
    sortOrder: 70,
    fields: ['eyebrow', 'heading', 'subheading'],
    items: {
      label: 'Note layers',
      addLabel: 'Add layer',
      fields: [
        { name: 'title', label: 'Layer title', type: 'text' },
        { name: 'text', label: 'Description', type: 'textarea' },
      ],
    },
  },
  {
    key: 'home.concierge',
    group: 'home',
    label: 'WhatsApp concierge',
    description: 'Hidden automatically while no WhatsApp number is configured.',
    sortOrder: 80,
    fields: ['eyebrow', 'heading', 'body', 'cta'],
  },
  {
    key: 'home.promises',
    group: 'home',
    label: 'Brand promises',
    description: 'Only state what the business can actually deliver.',
    sortOrder: 90,
    fields: ['eyebrow', 'heading'],
    items: {
      label: 'Promises',
      addLabel: 'Add promise',
      fields: [
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'text', label: 'Supporting line', type: 'text' },
      ],
    },
  },
  {
    key: 'home.newsletter',
    group: 'home',
    label: 'Newsletter block',
    description: 'Shown only while the newsletter feature is enabled. Do not promise a discount that does not exist.',
    sortOrder: 100,
    fields: ['eyebrow', 'heading', 'body'],
  },
  {
    key: 'about.intro',
    group: 'about',
    label: 'Our Story — introduction',
    sortOrder: 110,
    fields: ['eyebrow', 'heading', 'subheading', 'body'],
  },
  {
    key: 'about.craft',
    group: 'about',
    label: 'Our Story — composition',
    sortOrder: 120,
    fields: ['heading', 'body'],
  },
  {
    key: 'contact.intro',
    group: 'contact',
    label: 'Contact page introduction',
    sortOrder: 130,
    fields: ['eyebrow', 'heading', 'subheading'],
  },
  {
    key: 'faq',
    group: 'faq',
    label: 'Frequently asked questions',
    description: 'Answers must match the real policies configured in Settings and the legal pages.',
    sortOrder: 140,
    fields: ['eyebrow', 'heading', 'subheading'],
    items: {
      label: 'Questions',
      addLabel: 'Add question',
      fields: [
        { name: 'question', label: 'Question', type: 'text' },
        { name: 'answer', label: 'Answer', type: 'textarea' },
      ],
    },
  },
  {
    key: 'legal.intro',
    group: 'legal',
    label: 'Legal centre introduction',
    description: 'The heading and lead paragraph above the policy cards at /legal.',
    sortOrder: 145,
    fields: ['eyebrow', 'heading', 'subheading'],
  },
  {
    key: 'footer.brand',
    group: 'footer',
    label: 'Footer brand description',
    sortOrder: 150,
    fields: ['body'],
  },
] as const;

export const CONTENT_KEYS = CONTENT_BLOCKS.map((block) => block.key);

export const findContentBlock = (key: string) => CONTENT_BLOCKS.find((block) => block.key === key);
