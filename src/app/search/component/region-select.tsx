// components/RegionSelect.tsx
"use client";

import { useState, useEffect } from 'react';
import { REGIONS } from '@/lib/regions';
import type { RegionData } from '@/types/regions';

interface RegionSelectProps {
    onRegionChange: (regions: RegionData) => void;
}

export function RegionSelect({ onRegionChange }: RegionSelectProps) {
    const [region1, setRegion1] = useState('');
    const [region2, setRegion2] = useState('');
    const [region3, setRegion3] = useState('');
    const [region4, setRegion4] = useState('');

    useEffect(() => {
        onRegionChange({
            region1,
            region2,
            region3,
            region4: region4 || undefined
        });
    }, [region1, region2, region3, region4, onRegionChange]);

    const handleRegion1Change = (value: string) => {
        setRegion1(value);
        setRegion2('');
        setRegion3('');
        setRegion4('');
    };

    const handleRegion2Change = (value: string) => {
        setRegion2(value);
        setRegion3('');
        setRegion4('');
    };

    const handleRegion3Change = (value: string) => {
        setRegion3(value);
        setRegion4('');
    };

    return (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <select
                value={region1}
                onChange={(e) => handleRegion1Change(e.target.value)}
                className="border rounded-lg px-3 py-2"
            >
                <option value="">시/도 선택</option>
                {Object.keys(REGIONS).map((r1) => (
                    <option key={r1} value={r1}>{r1}</option>
                ))}
            </select>

            {region1 && (
                <select
                    value={region2}
                    onChange={(e) => handleRegion2Change(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value="">구/군 선택</option>
                    {Object.keys(REGIONS[region1] || {}).map((r2) => (
                        <option key={r2} value={r2}>{r2}</option>
                    ))}
                </select>
            )}

            {region2 && (
                <select
                    value={region3}
                    onChange={(e) => handleRegion3Change(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value="">동/읍/면 선택</option>
                    {Object.keys(REGIONS[region1][region2] || {}).map((r3) => (
                        <option key={r3} value={r3}>{r3}</option>
                    ))}
                </select>
            )}

            {region3 && (
                <select
                    value={region4}
                    onChange={(e) => setRegion4(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value="">상세 지역 선택 (선택사항)</option>
                    {REGIONS[region1][region2][region3].map((r4) => (
                        <option key={r4} value={r4}>{r4}</option>
                    ))}
                </select>
            )}
        </div>
    );
}
