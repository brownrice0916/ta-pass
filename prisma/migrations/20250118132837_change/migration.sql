/*
  Warnings:

  - The `specialOfferType` column on the `Restaurant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "addressDetail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "region1" TEXT DEFAULT '',
ADD COLUMN     "region2" TEXT DEFAULT '',
ADD COLUMN     "region3" TEXT DEFAULT '',
ADD COLUMN     "region4" TEXT,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "specialOfferType",
ADD COLUMN     "specialOfferType" TEXT[] DEFAULT ARRAY[]::TEXT[];
