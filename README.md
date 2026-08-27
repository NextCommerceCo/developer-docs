# Next Commerce Developer Docs

Developer documentation for the Next Commerce platform, built with [Next.js](https://nextjs.org) and [Fumadocs](https://fumadocs.vercel.app).

This repo powers the public developer docs site, including:

- product docs for Campaigns, Storefront, Apps, and Webhooks
- generated Admin API, Campaigns API, and GraphQL reference docs
- the docs homepage and shared MDX components

## Repository Layout

- `content/docs/` - authored MDX docs and sidebar metadata
- `content/docs/admin-api/`, `content/docs/campaigns/`, `content/docs/webhooks/`, `content/docs/storefront/graphql/` - generated reference docs
- `app/` - Next.js app shell, homepage, layout, sitemap, and favicon
- `components/` - shared MDX, page, and UI components
- `scripts/` - doc generators and link validation
- `public/` - logos, icons, and generated API specs

## Requirements

- Node.js 22+
- npm

## Local Development

Install dependencies:

```bash
npm install
```

Run the docs site locally:

```bash
npm run dev
```

`dev` runs the doc generators first, then starts Next.js with Turbopack.

### Environment variables

Site search needs three Algolia values. They are optional locally — the search bar
is hidden when they are unset, and everything else works. Set them in the deploy
environment so search renders in production. To enable search locally, add them to
`.env.local`:

```bash
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
NEXT_PUBLIC_ALGOLIA_INDEX=
```

Preview a production build locally by serving the `out/` directory with any static file server after `npm run build`.

## Content Workflow

- Edit authored docs in `content/docs/`
- Update section ordering and navigation with the relevant `meta.json` files
- Use `content/docs/admin-api/`, `content/docs/campaigns/`, and `content/docs/webhooks/` for generated API reference content
- Use `content/docs/storefront/graphql/` for generated GraphQL reference content

The generated reference docs are created automatically by:

- `npm run generate-api-docs`
- `npm run generate-graphql-docs`

Those scripts are already wired into `npm run dev` and `npm run build`.

## Validation

Check for broken internal links:

```bash
npm run validate-links
```

## Deployment

The site is built as a static export. Cloudflare Workers Builds runs `npm run build` and serves the `out/` directory as static assets (see `wrangler.jsonc`). Redirects live in `public/_redirects`.

## Search

Site search is powered by Algolia DocSearch. The search index is updated automatically on pushes to `main` through GitHub Actions.

