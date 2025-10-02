-- CreateTable
CREATE TABLE "MfaDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_SETUP',
    "secret" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "backupCodes" TEXT,
    "lastUsed" DATETIME,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MfaDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "location" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "location" TEXT,
    "riskScore" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SessionToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" DATETIME,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "lastPasswordChangeAt" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "emailVerifiedAt", "id", "isAdmin", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "emailVerified", "emailVerifiedAt", "id", "isAdmin", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MfaDevice_userId_idx" ON "MfaDevice"("userId");

-- CreateIndex
CREATE INDEX "MfaDevice_method_idx" ON "MfaDevice"("method");

-- CreateIndex
CREATE INDEX "MfaDevice_status_idx" ON "MfaDevice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MfaDevice_userId_method_key" ON "MfaDevice"("userId", "method");

-- CreateIndex
CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");

-- CreateIndex
CREATE INDEX "TrustedDevice_deviceId_idx" ON "TrustedDevice"("deviceId");

-- CreateIndex
CREATE INDEX "TrustedDevice_trusted_idx" ON "TrustedDevice"("trusted");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_userId_deviceId_key" ON "TrustedDevice"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_idx" ON "SecurityEvent"("type");

-- CreateIndex
CREATE INDEX "SecurityEvent_timestamp_idx" ON "SecurityEvent"("timestamp");

-- CreateIndex
CREATE INDEX "SecurityEvent_riskScore_idx" ON "SecurityEvent"("riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitEntry_key_key" ON "RateLimitEntry"("key");

-- CreateIndex
CREATE INDEX "RateLimitEntry_key_idx" ON "RateLimitEntry"("key");

-- CreateIndex
CREATE INDEX "RateLimitEntry_resetAt_idx" ON "RateLimitEntry"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionToken_token_key" ON "SessionToken"("token");

-- CreateIndex
CREATE INDEX "SessionToken_userId_idx" ON "SessionToken"("userId");

-- CreateIndex
CREATE INDEX "SessionToken_token_idx" ON "SessionToken"("token");

-- CreateIndex
CREATE INDEX "SessionToken_expiresAt_idx" ON "SessionToken"("expiresAt");

-- CreateIndex
CREATE INDEX "SessionToken_deviceId_idx" ON "SessionToken"("deviceId");
