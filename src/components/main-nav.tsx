"use client";

import { X } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

export function MainNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="text-primary-foreground">
          <span className="sr-only">Menu</span>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-y-auto">
          <div className="flex justify-end border-b p-4">
            <button onClick={() => setOpen(false)}>
              <X className="w-6 h-6 text-primary" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Stays & Pass */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                Stays & Pass
              </h2>
              <div className="space-y-2">
                <Link
                  href="/about-pass"
                  className="block text-primary hover:underline"
                >
                  About Pass
                </Link>
                <Link
                  href="/reservation"
                  className="block text-primary hover:underline"
                >
                  Reservation
                </Link>
              </div>
            </div>

            {/* Shopping */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">Shopping</h2>
              <div className="space-y-2">
                <Link
                  href="/fashion"
                  className="block text-primary hover:underline"
                >
                  Fashion
                </Link>
                <Link
                  href="/beauty"
                  className="block text-primary hover:underline"
                >
                  Beauty
                </Link>
                <Link
                  href="/activities"
                  className="block text-primary hover:underline"
                >
                  Activities
                </Link>
                <Link
                  href="/food"
                  className="block text-primary hover:underline"
                >
                  Food
                </Link>
              </div>
            </div>

            {/* Single Links */}
            <Link
              href="/partnership"
              className="block text-lg font-semibold text-primary hover:underline"
            >
              Partnership
            </Link>

            <Link
              href="/review"
              className="block text-lg font-semibold text-primary hover:underline"
            >
              Review
            </Link>

            <Link
              href="/k-trends"
              className="block text-lg font-semibold text-primary hover:underline"
            >
              K-Trends
            </Link>

            {/* Footer Links */}
            <div className="pt-6 space-y-3">
              <Link
                href="/support"
                className="block text-lg font-semibold text-primary hover:underline"
              >
                Customer Support
              </Link>
              <Link
                href="/contact"
                className="block text-lg font-semibold text-primary hover:underline"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
