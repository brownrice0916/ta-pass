// src/utils/address.ts
export const getNeighborhood = (address: string) => {
    const parts = address
        .split(",")
        .map((part) => part.trim())
        .filter((part) => !part.includes("South Korea"))
        .filter((part) => !part.includes("-dong"));

    return parts
        .filter((part) => part.includes("District") || part === "Seoul")
        .join(", ");
};