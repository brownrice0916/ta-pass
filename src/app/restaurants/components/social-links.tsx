"use client"

import { Facebook, Instagram, Twitter, Youtube, Globe, TypeIcon as type, LucideIcon } from 'lucide-react'

const PLATFORM_ICONS: Record<string, LucideIcon> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    website: Globe,
}

interface SocialLink {
    platform: string
    url: string
}

interface SocialLinksProps {
    links: SocialLink[]
}

export default function SocialLinks({ links }: SocialLinksProps) {
    return (
        <div className="flex gap-3">
            {links.map((link, index) => {
                const Icon = PLATFORM_ICONS[link.platform]

                if (!Icon) return null

                return (
                    <a
                        key={`${link.platform}-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary transition-colors"
                    >
                        <Icon size={20} />
                        <span className="sr-only">{link.platform}</span>
                    </a>
                )
            })}
        </div>
    )
}

