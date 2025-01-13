"use client";

import { X } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";

export function MainNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="text-primary-foreground">
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
        {/* 상단 X 버튼 */}


        <div className="h-full overflow-y-auto p-4 space-y-6">
          {/* 접근성 컴포넌트 추가 */}
          <DialogTitle>
            <VisuallyHidden>
              <h2>Main Navigation</h2> {/* 접근성을 위한 숨김 처리 */}
            </VisuallyHidden>
          </DialogTitle>
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
              href="/faq"
              className="block text-lg font-semibold text-primary hover:underline"
            >
              FAQ
            </Link>
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
      </SheetContent>
    </Sheet>
  );
}
