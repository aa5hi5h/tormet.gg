-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameType" ADD VALUE 'CLASH_ROYALE';
ALTER TYPE "GameType" ADD VALUE 'PUBG_PC';
ALTER TYPE "GameType" ADD VALUE 'PUBG_MOBILE';
ALTER TYPE "GameType" ADD VALUE 'CLASH_OF_CLANS';
ALTER TYPE "GameType" ADD VALUE 'BRAWL_STARS';
