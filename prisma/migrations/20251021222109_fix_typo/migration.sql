/*
  Warnings:

  - You are about to drop the column `statsSnapshptAfter` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "statsSnapshptAfter",
ADD COLUMN     "statsSnapshotAfter" JSONB;
