-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "afterSnapshot1" TEXT,
ADD COLUMN     "afterSnapshot2" TEXT,
ADD COLUMN     "beforeSnapshot1" TEXT,
ADD COLUMN     "beforeSnapshot2" TEXT,
ADD COLUMN     "platform1" TEXT,
ADD COLUMN     "platform2" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);
