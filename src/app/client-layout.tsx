'use client';

import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/header";
import { Search, Compass, Home, Bookmark, User } from "lucide-react";
import Link from "next/link";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <Header />
            {children}
            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-background">
                <nav className="w-full max-w-[393px] bg-white border-t flex justify-around p-4">
                    <button className="flex flex-col items-center">
                        <Search className="w-6 h-6" />
                        <span className="text-xs mt-1">Search</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <Link href='/restaurants'>
                            <Compass className="w-6 h-6" />
                            <span className="text-xs mt-1">Explore</span>
                        </Link>
                    </button>
                    <button className="flex flex-col items-center">
                        <Home className="w-6 h-6" />
                        <span className="text-xs mt-1">Home</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <Bookmark className="w-6 h-6" />
                        <span className="text-xs mt-1">Saved</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <User className="w-6 h-6" />
                        <span className="text-xs mt-1">Profile</span>
                    </button>
                    {/* Safe Area Bottom Spacing */}
                    <div className="absolute bottom-0 left-0 right-0 h-safe-bottom bg-white" />
                </nav>
            </div>
        </SessionProvider>
    );
}