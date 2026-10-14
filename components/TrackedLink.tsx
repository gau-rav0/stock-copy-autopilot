"use client";
import Link from "next/link";
import { trackEvent, type ProductEvent } from "@/lib/product-events";
import type { ReactNode } from "react";
export default function TrackedLink({
  href,
  event,
  className,
  children,
}: {
  href: string;
  event: ProductEvent;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent(event)}>
      {children}
    </Link>
  );
}
