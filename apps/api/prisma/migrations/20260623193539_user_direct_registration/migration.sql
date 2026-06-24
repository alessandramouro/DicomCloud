/*
  Warnings:

  - You are about to drop the column `verificationExpiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "verificationExpiry",
DROP COLUMN "verificationToken",
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
