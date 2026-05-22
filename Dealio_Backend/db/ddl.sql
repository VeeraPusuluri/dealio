-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Builder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Builder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "builderId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "description" TEXT,
    "address" TEXT,
    "totalUnits" INTEGER,
    "reraNumber" TEXT,
    "reraExpiry" TEXT,
    "priceFrom" DOUBLE PRECISION,
    "priceTo" DOUBLE PRECISION,
    "possessionDate" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER,
    "customerId" INTEGER NOT NULL,
    "builderId" INTEGER NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "preferredDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "meetingType" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Builder_userId_key" ON "Builder"("userId");

-- AddForeignKey
ALTER TABLE "Builder" ADD CONSTRAINT "Builder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "Builder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────
-- ChannelPartner
-- ─────────────────────────────────────────

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChannelPartner" (
    "id"                SERIAL NOT NULL,
    "userId"            INTEGER NOT NULL,
    "city"              TEXT,
    "tier"              TEXT NOT NULL DEFAULT 'Silver',
    "totalDeals"        INTEGER NOT NULL DEFAULT 0,
    "dealsThisMonth"    INTEGER NOT NULL DEFAULT 0,
    "totalEarnings"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "influencerScore"   INTEGER NOT NULL DEFAULT 0,
    "sharesThisMonth"   INTEGER NOT NULL DEFAULT 0,
    "leadsFromSocial"   INTEGER NOT NULL DEFAULT 0,
    "joinedDate"        TEXT,
    "referredById"      INTEGER,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChannelPartner_userId_key" ON "ChannelPartner"("userId");

-- AddForeignKey
ALTER TABLE "ChannelPartner" ADD CONSTRAINT "ChannelPartner_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChannelPartner" ADD CONSTRAINT "ChannelPartner_referredById_fkey"
    FOREIGN KEY ("referredById") REFERENCES "ChannelPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add CP reference to Deal (nullable — not all deals come via a CP)
ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "cpId" INTEGER;

ALTER TABLE "Deal" ADD CONSTRAINT "Deal_cpId_fkey"
    FOREIGN KEY ("cpId") REFERENCES "ChannelPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────
-- CPContact
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CPContact" (
    "id"        SERIAL NOT NULL,
    "cpId"      INTEGER NOT NULL,
    "name"      TEXT NOT NULL,
    "phone"     TEXT NOT NULL,
    "email"     TEXT,
    "notes"     TEXT,
    "tags"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CPContact_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CPContact" ADD CONSTRAINT "CPContact_cpId_fkey"
    FOREIGN KEY ("cpId") REFERENCES "ChannelPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

