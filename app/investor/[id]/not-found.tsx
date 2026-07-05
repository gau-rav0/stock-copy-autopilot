import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-display text-2xl text-paper">No investor here</h1>
      <p className="mt-2 text-paper-muted">
        This profile doesn't exist or hasn't published anything yet.
      </p>
      <Link href="/explore" className="mt-6 inline-block text-brass hover:underline">
        Back to Explore
      </Link>
    </section>
  );
}
