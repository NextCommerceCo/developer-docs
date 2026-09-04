import setup from '@/lib/generated/agent-setup.json';

export const revalidate = false;

export function GET() {
  return new Response(setup.prompt, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
