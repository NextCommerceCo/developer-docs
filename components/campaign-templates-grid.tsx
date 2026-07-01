import { Fragment } from 'react';

type PageLink = {
  label: string;
  url: string;
};

type CampaignTemplate = {
  name: string;
  slug: string;
  description: string;
  link: string;
  page_links: PageLink[];
};

const BASE = 'https://nextcommerce-campaign-templates.netlify.app';

const TEMPLATES: CampaignTemplate[] = [
  {
    name: 'olympus',
    slug: 'olympus',
    description:
      'Default pick. Single-step single-product checkout — lowest-friction conversion, used in most campaigns.',
    link: `${BASE}/olympus/checkout/`,
    page_links: [
      { label: 'Presell', url: `${BASE}/olympus/presell/` },
      { label: 'Landing', url: `${BASE}/olympus/landing/` },
      { label: 'Checkout', url: `${BASE}/olympus/checkout/` },
      { label: 'Upsell — stepper', url: `${BASE}/olympus/upsell-bundle-stepper/` },
      { label: 'pills', url: `${BASE}/olympus/upsell-bundle-tier-pills/` },
      { label: 'cards', url: `${BASE}/olympus/upsell-bundle-tier-cards/` },
      { label: 'Receipt', url: `${BASE}/olympus/receipt/` },
    ],
  },
  {
    name: 'olympus-mv-single-step',
    slug: 'olympus-mv-single-step',
    description: 'Products with variants (size, flavor, color) on a single-step checkout.',
    link: `${BASE}/olympus-mv-single-step/checkout/`,
    page_links: [
      { label: 'Presell', url: `${BASE}/olympus-mv-single-step/presell/` },
      { label: 'Landing', url: `${BASE}/olympus-mv-single-step/landing/` },
      { label: 'Checkout', url: `${BASE}/olympus-mv-single-step/checkout/` },
      { label: 'Upsell — MV', url: `${BASE}/olympus-mv-single-step/upsell-mv/` },
      { label: 'Upsell — stepper', url: `${BASE}/olympus-mv-single-step/upsell-bundle-stepper/` },
      { label: 'pills', url: `${BASE}/olympus-mv-single-step/upsell-bundle-tier-pills/` },
      { label: 'cards', url: `${BASE}/olympus-mv-single-step/upsell-bundle-tier-cards/` },
      { label: 'Receipt', url: `${BASE}/olympus-mv-single-step/receipt/` },
    ],
  },
  {
    name: 'olympus-mv-two-step',
    slug: 'olympus-mv-two-step',
    description: 'Variant-heavy products where selection deserves its own page before checkout.',
    link: `${BASE}/olympus-mv-two-step/select/`,
    page_links: [
      { label: 'Presell', url: `${BASE}/olympus-mv-two-step/presell/` },
      { label: 'Landing', url: `${BASE}/olympus-mv-two-step/landing/` },
      { label: 'Select', url: `${BASE}/olympus-mv-two-step/select/` },
      { label: 'Checkout', url: `${BASE}/olympus-mv-two-step/checkout/` },
      { label: 'Upsell — MV', url: `${BASE}/olympus-mv-two-step/upsell-mv/` },
      { label: 'Upsell — stepper', url: `${BASE}/olympus-mv-two-step/upsell-bundle-stepper/` },
      { label: 'pills', url: `${BASE}/olympus-mv-two-step/upsell-bundle-tier-pills/` },
      { label: 'cards', url: `${BASE}/olympus-mv-two-step/upsell-bundle-tier-cards/` },
      { label: 'Receipt', url: `${BASE}/olympus-mv-two-step/receipt/` },
    ],
  },
  {
    name: 'demeter',
    slug: 'demeter',
    description: 'Single-step checkout with an alternative visual style to Olympus.',
    link: `${BASE}/demeter/checkout/`,
    page_links: [
      { label: 'Presell', url: `${BASE}/demeter/presell/` },
      { label: 'Landing', url: `${BASE}/demeter/landing/` },
      { label: 'Checkout', url: `${BASE}/demeter/checkout/` },
      { label: 'Upsell — stepper', url: `${BASE}/demeter/upsell-bundle-stepper/` },
      { label: 'pills', url: `${BASE}/demeter/upsell-bundle-tier-pills/` },
      { label: 'cards', url: `${BASE}/demeter/upsell-bundle-tier-cards/` },
      { label: 'Receipt', url: `${BASE}/demeter/receipt/` },
    ],
  },
  {
    name: 'shop-single-step',
    slug: 'shop-single-step',
    description: 'Shopify-style single-step layout — familiar ecommerce feel.',
    link: `${BASE}/shop-single-step/checkout/?forcePackageId=1:1`,
    page_links: [
      { label: 'Presell', url: `${BASE}/shop-single-step/presell/` },
      { label: 'Landing', url: `${BASE}/shop-single-step/landing/` },
      { label: 'Checkout', url: `${BASE}/shop-single-step/checkout/?forcePackageId=1:1` },
      { label: 'Upsell — stepper', url: `${BASE}/shop-single-step/upsell-bundle-stepper/` },
      { label: 'pills', url: `${BASE}/shop-single-step/upsell-bundle-tier-pills/` },
      { label: 'cards', url: `${BASE}/shop-single-step/upsell-bundle-tier-cards/` },
      { label: 'Receipt', url: `${BASE}/shop-single-step/receipt/` },
    ],
  },
  {
    name: 'shop-three-step',
    slug: 'shop-three-step',
    description:
      'Shopify-style split flow (information → shipping → billing). Use when split-step converts better on your audience.',
    link: `${BASE}/shop-three-step/information/?forcePackageId=1:1`,
    page_links: [
      { label: 'Presell', url: `${BASE}/shop-three-step/presell/` },
      { label: 'Landing', url: `${BASE}/shop-three-step/landing/` },
      { label: 'Information', url: `${BASE}/shop-three-step/information/?forcePackageId=1:1` },
      { label: 'Shipping', url: `${BASE}/shop-three-step/shipping/` },
      { label: 'Billing', url: `${BASE}/shop-three-step/billing/` },
      { label: 'Upsell — stepper', url: `${BASE}/shop-three-step/upsell-bundle-stepper/` },
      { label: 'pills', url: `${BASE}/shop-three-step/upsell-bundle-tier-pills/` },
      { label: 'cards', url: `${BASE}/shop-three-step/upsell-bundle-tier-cards/` },
      { label: 'Receipt', url: `${BASE}/shop-three-step/receipt/` },
    ],
  },
];

function screenshotUrl(target: string): string {
  return `https://v1.screenshot.11ty.dev/${encodeURIComponent(target)}/large/_wait:2/`;
}

function CampaignTemplateCard({ template }: { template: CampaignTemplate }) {
  return (
    <div className="rounded-xl border bg-fd-card overflow-hidden flex flex-col">
      <a
        href={template.link}
        target="_blank"
        rel="noopener"
        className="block aspect-square bg-fd-muted overflow-hidden"
      >
        <img
          src={screenshotUrl(template.link)}
          alt={`${template.name} preview`}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </a>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="m-0 text-sm font-medium">{template.name}</h3>
        <p className="mt-1 mb-3 text-sm text-fd-muted-foreground">{template.description}</p>
        <div className="mt-auto text-xs text-fd-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
          {template.page_links.map((page, i) => (
            <Fragment key={page.url}>
              {i > 0 && <span>·</span>}
              <a
                href={page.url}
                target="_blank"
                rel="noopener"
                className="text-fd-foreground underline underline-offset-2 decoration-blue-500 hover:opacity-80"
              >
                {page.label}
              </a>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CampaignTemplatesGrid({ slugs }: { slugs?: string[] }) {
  const templates = slugs
    ? slugs
        .map((slug) => TEMPLATES.find((t) => t.slug === slug))
        .filter((t): t is CampaignTemplate => t != null)
    : TEMPLATES;

  return (
    <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {templates.map((template) => (
        <CampaignTemplateCard key={template.slug} template={template} />
      ))}
    </div>
  );
}
