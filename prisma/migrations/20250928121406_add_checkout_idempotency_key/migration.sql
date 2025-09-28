/*
  Warnings:

  - A unique constraint covering the columns `[checkoutIdempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "checkoutIdempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_checkoutIdempotencyKey_key" ON "Order"("checkoutIdempotencyKey");
