/*
  Warnings:

  - You are about to drop the column `avatarPath` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "avatarPath",
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'USER';
