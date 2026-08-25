import { createOpenAPI } from 'fumadocs-openapi/server';

/**
 * Server-side OpenAPI schema loader.
 *
 * Lives outside `components/` because `components/openapi-page.tsx` is a client
 * component in fumadocs-openapi v11 and can no longer hold the server instance.
 * The input list must match the specs in `scripts/generate-api-docs.mjs`.
 */
export const openapi = createOpenAPI({
  input: [
    'public/api/admin/2024-04-01.yaml',
    'public/api/admin/2023-02-10.yaml',
    'public/api/admin/unstable.yaml',
    'public/api/campaigns/v1.yaml',
  ],
});
