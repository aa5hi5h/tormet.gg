-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "statsSnapshotBefore" JSONB,
ADD COLUMN     "statsSnapshptAfter" JSONB;
