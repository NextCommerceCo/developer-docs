import type { OperationItem, WebhookItem } from 'fumadocs-openapi';
import { openapi } from '@/lib/openapi';
import { OpenAPIPage } from '@/components/openapi-page';

/**
 * Server wrapper for the `<APIPage />` tag in the generated reference MDX.
 *
 * fumadocs-openapi v11 made the page a client component that needs the schema
 * handed to it, so the server resolves the document here and passes it down as
 * `payload` (the same shape the library's own `getOpenAPIPageProps()` builds).
 */
export async function APIPage({
  document,
  ...props
}: {
  document: string;
  operations?: OperationItem[];
  webhooks?: WebhookItem[];
  showTitle?: boolean;
  showDescription?: boolean;
}) {
  const { bundled } = await openapi.getSchema(document);

  return <OpenAPIPage {...props} payload={{ bundled }} />;
}
