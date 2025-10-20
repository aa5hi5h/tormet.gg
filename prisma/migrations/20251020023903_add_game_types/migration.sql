-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('CHESS', 'LOL', 'VALORANT', 'DOTA2', 'CSGO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Winner" ADD VALUE 'CREATOR';
ALTER TYPE "Winner" ADD VALUE 'JOINER';

-- DropIndex
DROP INDEX "public"."Match_gameId_key";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "gameType" "GameType" NOT NULL DEFAULT 'CHESS',
ADD COLUMN     "region" TEXT,
ADD COLUMN     "riotMatchId" TEXT,
ADD COLUMN     "summonerName1" TEXT,
ADD COLUMN     "summonerName2" TEXT,
ADD COLUMN     "summonerPuuid1" TEXT,
ADD COLUMN     "summonerPuuid2" TEXT,
ALTER COLUMN "gameId" DROP NOT NULL,
ALTER COLUMN "url" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Match_gameType_status_idx" ON "Match"("gameType", "status");
