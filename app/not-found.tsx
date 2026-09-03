import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fd-background px-6 text-fd-foreground">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="text-sm text-fd-muted-foreground">
            The page you asked for does not exist or has moved.
          </p>
        </div>
        <nav aria-label="Recovery links">
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/docs">Browse all docs</Link></li>
            <li><Link href="/docs/admin-api">Admin API</Link></li>
            <li><Link href="/docs/webhooks">Webhooks</Link></li>
            <li><a href="https://docs.nextcommerce.com">Merchant docs</a></li>
            <li><a href="https://docs.nextcommerce.com/changelog">Changelog</a></li>
            <li><Link href="/llms.txt">Agent index (llms.txt)</Link></li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
