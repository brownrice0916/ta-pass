// types/regions.ts
export type DetailedRegion = string[];

export type ThirdLevelRegions = {
    [key: string]: DetailedRegion;
};

export type SecondLevelRegions = {
    [key: string]: ThirdLevelRegions;
};

export type Regions = {
    [key: string]: SecondLevelRegions;
};

export interface RegionData {
    region1: string;
    region2: string;
    region3: string;
    region4?: string;
}