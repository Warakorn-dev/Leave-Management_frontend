import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium text-zinc-500">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-zinc-600">The address may be incorrect, or the page may have moved.</p>
      <Link className="rounded-md bg-zinc-900 px-4 py-2 text-white" href="/login">Return to sign in</Link>
    </main>
  );
}
