/*
  Warnings:

  - A unique constraint covering the columns `[companyName]` on the table `IPO` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IPO_companyName_key" ON "IPO"("companyName");
