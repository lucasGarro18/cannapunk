-- AlterTable: add audit fields to Commission
ALTER TABLE "Commission" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Commission" ADD COLUMN "paidBy" TEXT;
