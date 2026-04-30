-- CreateEnum
CREATE TYPE "Role" AS ENUM ('engineer', 'healthcare', 'admin');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('ideation', 'research', 'prototype', 'development', 'testing', 'clinical_validation');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'active', 'meeting_scheduled', 'partner_found', 'expired', 'removed');

-- CreateEnum
CREATE TYPE "Confidentiality" AS ENUM ('public', 'confidential', 'highly_confidential');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('pending', 'accepted', 'declined', 'scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deactivated', 'pending_deletion');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('message_received', 'meeting_requested', 'meeting_accepted', 'meeting_declined', 'meeting_scheduled', 'meeting_cancelled', 'nda_required', 'post_status', 'post_expired', 'partner_found', 'email_verification', 'account', 'interest');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('email', 'phone', 'linkedin', 'other');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('success', 'failure', 'warning');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'engineer',
    "institution" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "country" TEXT,
    "expertiseTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interestTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portfolioSummary" TEXT,
    "portfolioLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredContactMethod" "ContactMethod",
    "preferredContactValue" TEXT,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "avatar" TEXT,
    "verifyToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "deletionRequestedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workingDomain" TEXT NOT NULL,
    "shortExplanation" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT,
    "requiredExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matchTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projectStage" "ProjectStage" NOT NULL DEFAULT 'ideation',
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "confidentiality" "Confidentiality" NOT NULL DEFAULT 'public',
    "collaborationType" TEXT,
    "commitmentLevel" TEXT,
    "highLevelIdea" TEXT,
    "notesPreview" TEXT,
    "country" TEXT,
    "city" TEXT,
    "expiryDate" TIMESTAMP(3),
    "autoClose" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "ownerRole" "Role" NOT NULL DEFAULT 'engineer',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_status_history" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "reason" TEXT,

    CONSTRAINT "post_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "meetingRequestId" TEXT,
    "content" TEXT NOT NULL,
    "ndaAcceptedAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_requests" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "requesterRole" "Role" NOT NULL,
    "introductoryMessage" TEXT NOT NULL DEFAULT '',
    "proposedSlots" JSONB NOT NULL DEFAULT '[]',
    "selectedSlot" TIMESTAMP(3),
    "agreedTime" TIMESTAMP(3),
    "externalUrl" TEXT,
    "ndaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "ndaAcceptedAt" TIMESTAMP(3),
    "status" "MeetingStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nda_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meetingRequestId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "nda_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "role" "Role",
    "action" TEXT NOT NULL,
    "actionType" TEXT,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "targetEntity" TEXT,
    "resultStatus" "AuditResult" NOT NULL DEFAULT 'success',
    "details" JSONB,
    "ip" TEXT,
    "ipPreview" TEXT,
    "userAgent" TEXT,
    "hash" TEXT,
    "prevHash" TEXT,
    "retentionUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_verifyToken_key" ON "users"("verifyToken");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_city_country_idx" ON "posts"("city", "country");

-- CreateIndex
CREATE INDEX "posts_projectStage_idx" ON "posts"("projectStage");

-- CreateIndex
CREATE INDEX "post_status_history_postId_idx" ON "post_status_history"("postId");

-- CreateIndex
CREATE INDEX "messages_postId_idx" ON "messages"("postId");

-- CreateIndex
CREATE INDEX "messages_senderId_recipientId_idx" ON "messages"("senderId", "recipientId");

-- CreateIndex
CREATE INDEX "meeting_requests_postId_idx" ON "meeting_requests"("postId");

-- CreateIndex
CREATE INDEX "meeting_requests_requestorId_idx" ON "meeting_requests"("requestorId");

-- CreateIndex
CREATE INDEX "meeting_requests_recipientId_idx" ON "meeting_requests"("recipientId");

-- CreateIndex
CREATE INDEX "meeting_requests_status_idx" ON "meeting_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "nda_acceptances_meetingRequestId_key" ON "nda_acceptances"("meetingRequestId");

-- CreateIndex
CREATE INDEX "nda_acceptances_userId_idx" ON "nda_acceptances"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_status_history" ADD CONSTRAINT "post_status_history_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_status_history" ADD CONSTRAINT "post_status_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_meetingRequestId_fkey" FOREIGN KEY ("meetingRequestId") REFERENCES "meeting_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nda_acceptances" ADD CONSTRAINT "nda_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nda_acceptances" ADD CONSTRAINT "nda_acceptances_meetingRequestId_fkey" FOREIGN KEY ("meetingRequestId") REFERENCES "meeting_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
