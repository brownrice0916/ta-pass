"use client"

import Image from 'next/image'

const PLATFORM_ICONS = {
    instagram: "/icons/instagram.svg",
    facebook: "/icons/facebook.svg",
    twitter: "/icons/twitter.svg",
    youtube: "/icons/youtube.svg",
    blog: "/icons/blog.svg",
    website: "/icons/website.svg",
} as const;

export interface SocialLink {
    platform: string
    url: string
}

interface SocialLinksProps {
    links: unknown
}

export default function SocialLinks({ links }: SocialLinksProps) {
    if (!links || typeof links !== 'object' || !Array.isArray(links) || links.length === 0) {
        return null
    }

    const validLinks = links.filter((link): link is SocialLink =>
        typeof link === 'object' &&
        link !== null &&
        'platform' in link &&
        'url' in link &&
        typeof link.platform === 'string' &&
        typeof link.url === 'string'
    )

    if (validLinks.length === 0) {
        return null
    }

    const formatUrl = (url: string) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return `https://${url}`;
    };

    return (
        <div className="flex gap-3">
            {validLinks.map((link, index) => {
                const iconPath = PLATFORM_ICONS[link.platform as keyof typeof PLATFORM_ICONS]
                if (!iconPath) return null

                return (
                    <a
                        key={`${link.platform}-${index}`}
                        href={formatUrl(link.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity"
                    >
                        <div className="w-6 h-6 relative">
                            <Image
                                src={iconPath}
                                alt={link.platform}
                                fill
                                className="object-contain"
                            />
                        </div>
                    </a>
                );
            })}
        </div>
    )
}