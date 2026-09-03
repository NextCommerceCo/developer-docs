import { capabilitiesForPage, getCapability, MERCHANT_SITE, type Capability } from '@/lib/capabilities';

/**
 * Reciprocal links from a developer page back to the merchant guides for the
 * same capability. Driven entirely by the capability map: a page is linked when
 * the map's developer_docs cite it or its frontmatter declares capability_ids.
 */
export function CapabilityLinks({ pageUrl, declaredIds }: { pageUrl: string; declaredIds?: string[] }) {
  const byId = new Map<string, Capability>();
  for (const c of capabilitiesForPage(pageUrl)) byId.set(c.id, c);
  for (const id of declaredIds ?? []) {
    const c = getCapability(id);
    if (c) byId.set(c.id, c);
  }
  const capabilities = [...byId.values()];
  if (capabilities.length === 0) return null;

  const merchantLinks = capabilities.flatMap((c) =>
    c.operator_docs.map((url) => ({ url, capability: c })),
  );

  return (
    <aside
      aria-label="Related merchant guides"
      className="mt-10 rounded-lg border bg-fd-card p-4 text-sm text-fd-card-foreground"
    >
      <p className="font-medium">
        Capabilit{capabilities.length === 1 ? 'y' : 'ies'}:{' '}
        {capabilities.map((c, i) => (
          <span key={c.id}>
            {i > 0 && ', '}
            <a href={`/docs/capabilities#${c.id}`} className="underline underline-offset-4">
              {c.title}
            </a>
          </span>
        ))}
      </p>
      {merchantLinks.length > 0 && (
        <>
          <p className="mt-2 text-fd-muted-foreground">
            Merchant and operator guides for the same capability on docs.nextcommerce.com:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {merchantLinks.map(({ url }) => (
              <li key={url}>
                <a href={url} className="underline underline-offset-4">
                  {url.replace(MERCHANT_SITE, '')}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
